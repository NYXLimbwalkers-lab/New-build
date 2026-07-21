#!/usr/bin/env node
/*
  DéLa Já — headless-browser catalog crawler (Playwright).

  Her live site sits behind WordPress + Cloudflare bot protection and returns
  HTTP 403 (cf-mitigated: challenge) to plain scripts — so scripts/fetch-assets.mjs
  can only grab the handful of known CDN images. This crawler drives a REAL
  Chromium so it passes the JS challenge like a human, reads the rendered DOM,
  and walks the whole catalog:

    /shop/ (+ pagination) → every /product/<slug>/ → /product-category/*

  For each product it captures name, price, size, short + long description,
  scent, every wp-content/uploads / i0.wp.com image (full-size, Photon params
  stripped) and any <video>/.mp4 source. Originals are saved to assets/raw/ and
  a structured assets/raw/catalog.json is written. Downloads reuse the browser's
  authenticated request context so CDN/challenge cookies come along.

  Usage:
    node scripts/crawl-assets.mjs            # headless (default)
    HEADED=1 node scripts/crawl-assets.mjs   # show the browser window
    npm run crawl:assets

  Safe to re-run — already-downloaded files are skipped.
*/
import { chromium } from "playwright";
import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, join, extname, basename } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const RAW = join(ROOT, "assets", "raw");
const IMG_DIR = join(RAW, "images");
const VID_DIR = join(RAW, "videos");

const ORIGIN = "https://delajacandles.com";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const SEED_PAGES = [
  "/",
  "/shop/",
  "/product-category/home-decor-candles/",
  "/product-category/dessert-candles/",
  "/product-category/wax-melts/",
];

const PAGE_CAP = 160; // safety limit on pages crawled
const CHALLENGE_TIMEOUT = 45_000; // ms to wait for Cloudflare to clear

const IMG_RE = /\.(jpe?g|png|webp|gif|avif)(?:$|\?)/i;
const VID_RE = /\.(mp4|mov|webm|m4v)(?:$|\?)/i;
const isDownloadHost = (h) =>
  h === "delajacandles.com" ||
  h.endsWith(".wp.com") ||
  h.endsWith(".smushcdn.com") ||
  h.endsWith(".cdninstagram.com") ||
  h.endsWith(".tiktokcdn.com");

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** Strip wp.com Photon / WooCommerce resize params → original full-size URL. */
function dePhoton(url) {
  try {
    const u = new URL(url);
    for (const k of ["resize", "fit", "w", "h", "crop", "quality", "strip", "ssl", "zoom"]) {
      u.searchParams.delete(k);
    }
    // i*.wp.com/<host>/<path> mirrors the origin; keep as-is (CDN bypasses CF).
    return u.toString().replace(/\?$/, "");
  } catch {
    return url;
  }
}

/** Is the page still showing a Cloudflare interstitial? */
async function isChallenge(page) {
  try {
    const title = (await page.title()) || "";
    if (/just a moment|attention required|checking your browser/i.test(title)) return true;
    const flagged = await page.evaluate(() => {
      const t = document.body ? document.body.innerText : "";
      return (
        /verify you are human|needs to review the security|cf-browser-verification|cf-challenge/i.test(t) ||
        !!document.querySelector("#challenge-form, #cf-challenge-running, iframe[src*='challenges.cloudflare']")
      );
    });
    return flagged;
  } catch {
    return false;
  }
}

/** Navigate and wait out the Cloudflare challenge. Returns true if content loaded. */
async function loadPage(page, url) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40_000 });
  } catch (e) {
    // A soft 403/blocked nav still yields a document we can inspect.
    if (!/net::ERR|Timeout/i.test(e.message)) throw e;
  }
  const deadline = Date.now() + CHALLENGE_TIMEOUT;
  while (Date.now() < deadline) {
    if (!(await isChallenge(page))) return true;
    // Nudge any interactive Turnstile checkbox inside an iframe.
    for (const frame of page.frames()) {
      try {
        const box = await frame.$("input[type=checkbox], .cb-lb, #challenge-stage");
        if (box) await box.click({ timeout: 1500 }).catch(() => {});
      } catch {
        /* frame detached */
      }
    }
    await page.waitForTimeout(1500);
  }
  return !(await isChallenge(page));
}

/** Extract links + product metadata from the rendered page. */
async function extract(page, url) {
  return page.evaluate(
    ({ origin }) => {
      const abs = (u) => {
        try {
          return new URL(u, location.href).href;
        } catch {
          return null;
        }
      };
      const imgRe = /\.(jpe?g|png|webp|gif|avif)(?:$|\?)/i;
      const vidRe = /\.(mp4|mov|webm|m4v)(?:$|\?)/i;

      const assets = new Set();
      const links = new Set();

      // Every img: prefer the full-size gallery source when present.
      for (const el of document.querySelectorAll("img")) {
        for (const cand of [
          el.getAttribute("data-large_image"),
          el.getAttribute("data-src"),
          el.currentSrc,
          el.getAttribute("src"),
        ]) {
          const u = cand && abs(cand);
          if (u && imgRe.test(u)) assets.add(u);
        }
        const srcset = el.getAttribute("srcset") || el.getAttribute("data-srcset");
        if (srcset) {
          // largest candidate (last after sort by width descriptor)
          const cands = srcset
            .split(",")
            .map((s) => s.trim().split(/\s+/))
            .filter((p) => p[0]);
          for (const [u] of cands) {
            const a = abs(u);
            if (a && imgRe.test(a)) assets.add(a);
          }
        }
      }
      // WooCommerce gallery anchors wrap the full-size image.
      for (const a of document.querySelectorAll("a[href]")) {
        const u = abs(a.getAttribute("href"));
        if (!u) continue;
        if (imgRe.test(u) || vidRe.test(u)) assets.add(u);
        else if (u.startsWith(origin) && /\/(product|product-category|shop)\b/.test(u))
          links.add(u.split("#")[0].split("?")[0]);
      }
      // Videos + og:image / og:video
      for (const s of document.querySelectorAll("video source, video, source")) {
        const u = abs(s.getAttribute("src"));
        if (u && (vidRe.test(u) || imgRe.test(u))) assets.add(u);
      }
      for (const m of document.querySelectorAll("meta[property^='og:image'], meta[property^='og:video']")) {
        const u = abs(m.getAttribute("content"));
        if (u && (imgRe.test(u) || vidRe.test(u))) assets.add(u);
      }

      // Social embeds (recorded for reference).
      const embeds = [];
      for (const a of document.querySelectorAll("a[href]")) {
        const h = a.getAttribute("href") || "";
        if (/(tiktok|instagram|youtube|youtu\.be|facebook)\.com/i.test(h)) embeds.push(h);
      }

      const isProduct = /\/product\//.test(location.pathname);
      let product = null;
      if (isProduct) {
        const txt = (sel) => {
          const el = document.querySelector(sel);
          return el ? el.textContent.trim().replace(/\s+/g, " ") : null;
        };
        const name =
          txt("h1.product_title") || txt(".product_title") || txt("h1");
        // Price: the current (sale-aware) amount; grab the last amount inside .price.
        let price = null;
        const priceEl = document.querySelector(
          ".summary .price .woocommerce-Price-amount, .price .woocommerce-Price-amount, .woocommerce-Price-amount",
        );
        if (priceEl) price = priceEl.textContent.trim();
        const short = txt(".woocommerce-product-details__short-description");
        const long =
          txt("#tab-description") ||
          txt(".woocommerce-Tabs-panel--description") ||
          txt(".wc-tab.panel");
        // Size / scent often live in variation selects or attribute tables.
        const attrs = {};
        for (const row of document.querySelectorAll(
          ".woocommerce-product-attributes tr, table.shop_attributes tr",
        )) {
          const k = row.querySelector("th")?.textContent.trim().toLowerCase();
          const v = row.querySelector("td")?.textContent.trim().replace(/\s+/g, " ");
          if (k && v) attrs[k] = v;
        }
        const options = {};
        for (const sel of document.querySelectorAll(".variations select, form.cart select")) {
          const label =
            sel.closest("tr")?.querySelector("label,th")?.textContent.trim().toLowerCase() ||
            sel.getAttribute("name") ||
            sel.getAttribute("data-attribute_name") ||
            "option";
          options[label] = [...sel.options]
            .map((o) => o.textContent.trim())
            .filter((t) => t && !/choose an option/i.test(t));
        }
        const sku = txt(".sku");
        const cats = [...document.querySelectorAll(".posted_in a")].map((a) => a.textContent.trim());
        product = { name, price, short, long, attrs, options, sku, cats };
      }

      return { assets: [...assets], links: [...links], embeds, product };
    },
    { origin: ORIGIN },
  );
}

async function download(request, url, dir) {
  const clean = dePhoton(url);
  let name = basename(new URL(clean).pathname) || `asset-${Math.abs(hash(clean))}`;
  if (!extname(name)) name += ".jpg";
  const dest = join(dir, name);
  if (await exists(dest)) return { url: clean, dest, skipped: true };
  const res = await request.get(clean, {
    headers: { accept: "image/avif,image/webp,image/png,image/*,video/*,*/*", referer: ORIGIN + "/" },
    timeout: 30_000,
  });
  if (!res.ok()) throw new Error(`${res.status()}`);
  const buf = Buffer.from(await res.body());
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return { url: clean, dest, bytes: buf.length };
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

async function main() {
  await mkdir(IMG_DIR, { recursive: true });
  await mkdir(VID_DIR, { recursive: true });

  const headed = !!process.env.HEADED;
  console.log(`→ Launching Chromium (${headed ? "headed" : "headless"}) …`);
  const browser = await chromium.launch({
    headless: !headed,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    userAgent: UA,
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    timezoneId: "America/New_York",
    deviceScaleFactor: 2,
  });
  // Light stealth: hide webdriver flag.
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });
  const page = await context.newPage();

  const queue = SEED_PAGES.map((p) => ORIGIN + p);
  const seen = new Set();
  const assetUrls = new Set();
  const embeds = new Set();
  const products = [];
  let challengeFailures = 0;

  console.log("→ Crawling delajacandles.com (real browser) …");
  while (queue.length && seen.size < PAGE_CAP) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    const ok = await loadPage(page, url);
    if (!ok) {
      challengeFailures++;
      console.warn(`  ✗ ${url} (challenge did not clear)`);
      continue;
    }
    let data;
    try {
      data = await extract(page, url);
    } catch (e) {
      console.warn(`  ✗ ${url} (extract failed: ${e.message})`);
      continue;
    }
    data.assets.forEach((a) => assetUrls.add(a));
    data.embeds.forEach((e) => embeds.add(e));
    for (const l of data.links) if (!seen.has(l) && !queue.includes(l)) queue.push(l);
    if (data.product) {
      products.push({
        url,
        ...data.product,
        images: data.assets.filter((a) => IMG_RE.test(a)),
        videos: data.assets.filter((a) => VID_RE.test(a)),
      });
    }
    const tag = data.product?.name ? `[${data.product.name}] ` : "";
    console.log(
      `  · ${seen.size}/${PAGE_CAP} ${tag}${data.assets.length} assets, ${data.links.length} links — ${url.replace(ORIGIN, "")}`,
    );
  }

  console.log(`\n→ Downloading ${assetUrls.size} assets …`);
  const request = context.request;
  const downloads = [];
  for (const url of assetUrls) {
    let host;
    try {
      host = new URL(url).hostname;
    } catch {
      continue;
    }
    if (!isDownloadHost(host)) {
      continue;
    }
    const dir = VID_RE.test(url) ? VID_DIR : IMG_DIR;
    try {
      const r = await download(request, url, dir);
      downloads.push({ url: r.url, file: r.dest.replace(ROOT, ""), bytes: r.bytes ?? null, skipped: !!r.skipped });
      console.log(r.skipped ? `  · cached ${basename(r.dest)}` : `  ✓ ${basename(r.dest)} (${r.bytes} b)`);
    } catch (e) {
      console.warn(`  ✗ ${basename(url)} (${e.message})`);
    }
  }

  const images = downloads.filter((d) => IMG_RE.test(d.url)).length;
  const videos = downloads.filter((d) => VID_RE.test(d.url)).length;
  await writeFile(
    join(RAW, "catalog.json"),
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        source: "playwright",
        pagesCrawled: seen.size,
        challengeFailures,
        products,
        embeds: [...embeds],
        downloads,
      },
      null,
      2,
    ),
  );

  await browser.close();

  console.log(`\nDone. ${products.length} products, ${images} images, ${videos} videos → assets/raw/.`);
  if (challengeFailures)
    console.log(`⚠ ${challengeFailures} page(s) never cleared the Cloudflare challenge — try HEADED=1.`);
  if (embeds.size) console.log(`Social/video embeds recorded in catalog.json: ${embeds.size}`);
}

main().catch((e) => {
  console.error("\nFAILED:", e.stack || e.message);
  process.exit(1);
});
