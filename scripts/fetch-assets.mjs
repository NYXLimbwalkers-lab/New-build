#!/usr/bin/env node
/*
  DéLa Já — full asset crawler.
  Walks her live site (same-domain BFS) and pulls EVERY product photo and video
  into assets/raw/images and assets/raw/videos, plus a structured catalog.json
  (product name, price, page, image list). These raw photos are the SOURCE for
  the transparent-PNG layer library used by the photo-compositing preview engine
  (see docs/ASSETS.md).

  ── RUN THIS ON A MACHINE WITH OPEN NETWORK (e.g. the Mac), or in the web
     environment AFTER her domains are added to the egress allowlist. ──
  In the locked-down web sandbox every request 403s and nothing downloads.

  Allowlisted download hosts: delajacandles.com, *.wp.com, *.smushcdn.com.

  Usage:  node scripts/fetch-assets.mjs            (or: npm run fetch:assets)
  Safe to re-run — already-downloaded files are skipped.
*/
import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, join, extname, basename } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const RAW = join(ROOT, "assets", "raw");
const IMG_DIR = join(RAW, "images");
const VID_DIR = join(RAW, "videos");

const ORIGIN = "https://delajacandles.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Full browser-like headers — beats simple WAF rules that block non-browsers.
const BROWSER = {
  "user-agent": UA,
  "accept-language": "en-US,en;q=0.9",
  "accept-encoding": "gzip, deflate, br",
  "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "upgrade-insecure-requests": "1",
};

// Known real image URLs (her CDN) — downloaded even if the HTML pages are
// challenge-blocked, so we always get the core menu photos.
const KNOWN_IMAGES = [
  "https://i0.wp.com/delajacandles.com/wp-content/uploads/2026/01/29519-1-scaled.jpg",
  "https://i0.wp.com/delajacandles.com/wp-content/uploads/2025/07/6845-scaled.jpg",
  "https://i0.wp.com/delajacandles.com/wp-content/uploads/2025/07/6842-scaled.jpg",
  "https://i0.wp.com/delajacandles.com/wp-content/uploads/2025/07/6841-scaled.jpg",
  "https://i0.wp.com/delajacandles.com/wp-content/uploads/2025/07/6846-scaled.jpg",
  "https://i0.wp.com/delajacandles.com/wp-content/uploads/2025/07/6823-scaled.jpg",
  "https://i0.wp.com/delajacandles.com/wp-content/uploads/2026/01/28710-scaled.webp",
  "https://i0.wp.com/delajacandles.com/wp-content/uploads/2025/07/Messenger_creation_7C35B6DB-D94B-40AE-831C-515369D99907.jpeg",
  "https://i0.wp.com/delajacandles.com/wp-content/uploads/2026/03/37271-scaled.webp",
  "https://i0.wp.com/delajacandles.com/wp-content/uploads/2026/05/46981-scaled.jpg",
  "https://i0.wp.com/delajacandles.com/wp-content/uploads/2025/11/21878-scaled.webp",
  "https://b4130177.smushcdn.com/4130177/wp-content/uploads/2025/04/1-e1745898030663.png",
];

// Seed pages — her real sections + known product slugs (so we hit product
// galleries directly even if the shop markup changes).
const SEED_PAGES = [
  "/", "/home/", "/shop/", "/contact/",
  "/product-category/home-decor-candles/",
  "/product-category/dessert-candles/",
  "/product-category/wax-melts/",
  "/product/berry-intoxicating-candle/",
  "/product/festive-peppermint-whip-candle/",
  "/product/lavender-lullabies-candle/",
];

const PAGE_CAP = 120;       // safety limit on pages crawled
const isDownloadHost = (h) =>
  h === "delajacandles.com" || h.endsWith(".wp.com") || h.endsWith(".smushcdn.com");

const IMG_RE = /\.(jpe?g|png|webp|gif|avif)(?:$|\?)/i;
const VID_RE = /\.(mp4|mov|webm|m4v)(?:$|\?)/i;

async function exists(p) { try { await access(p); return true; } catch { return false; } }

function blockedBy(res) {
  const cf = res.headers.get("cf-mitigated") || res.headers.get("cf-ray");
  const server = res.headers.get("server") || "?";
  return `${res.status} server=${server}${cf ? ` cf=${cf}` : ""}`;
}

async function getText(url) {
  const res = await fetch(url, {
    headers: { ...BROWSER, accept: "text/html,application/xhtml+xml", referer: ORIGIN + "/" },
  });
  if (!res.ok) throw new Error(blockedBy(res));
  return res.text();
}

async function download(url, dir) {
  // Normalize wp.com Photon: strip resize/scale params to get the original.
  const clean = url.replace(/([?&])(resize|fit|w|h|crop|quality|strip|ssl)=[^&]*/g, "$1").replace(/[?&]+$/, "");
  let name = basename(new URL(clean).pathname) || `asset-${Date.now()}`;
  if (!extname(name)) name += ".jpg";
  // de-collide across folders/months
  const dest = join(dir, name);
  if (await exists(dest)) return { url: clean, dest, skipped: true };
  const res = await fetch(clean, {
    headers: { ...BROWSER, accept: "image/avif,image/webp,image/png,image/*,video/*,*/*", referer: ORIGIN + "/" },
  });
  if (!res.ok) throw new Error(blockedBy(res));
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return { url: clean, dest, bytes: buf.length };
}

/** Pull every asset URL + same-origin link + product meta from one page's HTML. */
function parse(html, pageUrl) {
  const abs = (u) => { try { return new URL(u, pageUrl).href; } catch { return null; } };
  const assets = new Set();
  const links = new Set();

  // src / href / data-src / data-large_image / content (og)
  for (const m of html.matchAll(/(?:src|href|data-src|data-large_image|data-srcset|content)\s*=\s*["']([^"']+)["']/gi)) {
    const u = abs(m[1]); if (!u) continue;
    if (IMG_RE.test(u) || VID_RE.test(u)) assets.add(u);
    else if (u.startsWith(ORIGIN) && /\/(product|product-category|shop|home)\b/.test(u)) links.add(u.split("#")[0]);
  }
  // srcset: take the largest candidate of each set
  for (const m of html.matchAll(/srcset\s*=\s*["']([^"']+)["']/gi)) {
    const cands = m[1].split(",").map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
    for (const c of cands) { const u = abs(c); if (u && IMG_RE.test(u)) assets.add(u); }
  }
  // <video><source>, <source src>
  for (const m of html.matchAll(/<source[^>]+src\s*=\s*["']([^"']+)["']/gi)) {
    const u = abs(m[1]); if (u && VID_RE.test(u)) assets.add(u);
  }
  // social/video embeds (recorded for reference; not downloaded here)
  const embeds = [...html.matchAll(/(https?:\/\/(?:www\.)?(?:tiktok|youtube|youtu\.be|instagram)\.[^"'\s<>]+)/gi)].map((m) => m[1]);

  const name = (html.match(/<h1[^>]*product[^>]*>([^<]+)</i) || html.match(/<h1[^>]*>([^<]+)</i) || [])[1];
  const price = (html.match(/woocommerce-Price-amount[^>]*><bdi>([^<]+)</i) || [])[1];

  return { assets: [...assets], links: [...links], embeds, name: name?.trim(), price: price?.trim() };
}

async function main() {
  await mkdir(IMG_DIR, { recursive: true });
  await mkdir(VID_DIR, { recursive: true });

  const queue = SEED_PAGES.map((p) => ORIGIN + p);
  const seen = new Set();
  const assetUrls = new Set();
  const embeds = new Set();
  const products = [];

  console.log("→ Crawling delajacandles.com …");
  while (queue.length && seen.size < PAGE_CAP) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    let html;
    try { html = await getText(url); } catch (e) { console.warn(`  ✗ ${url} (${e.message})`); continue; }
    const { assets, links, embeds: emb, name, price } = parse(html, url);
    assets.forEach((a) => assetUrls.add(a));
    emb.forEach((e) => embeds.add(e));
    if (url.includes("/product/")) products.push({ url, name, price, images: assets.filter((a) => IMG_RE.test(a)) });
    for (const l of links) if (!seen.has(l) && !queue.includes(l)) queue.push(l);
    console.log(`  · ${seen.size}/${PAGE_CAP} ${name ? `[${name}] ` : ""}${assets.length} assets — ${url}`);
  }

  // Always include the known CDN images — these usually bypass the WAF even
  // when the HTML pages don't.
  KNOWN_IMAGES.forEach((u) => assetUrls.add(u));

  console.log(`\n→ Downloading ${assetUrls.size} assets …`);
  const downloads = [];
  for (const url of assetUrls) {
    const host = new URL(url).hostname;
    if (!isDownloadHost(host)) { console.warn(`  ⤬ skip off-host ${host}`); continue; }
    const dir = VID_RE.test(url) ? VID_DIR : IMG_DIR;
    try {
      const r = await download(url, dir);
      downloads.push({ url: r.url, file: r.dest.replace(ROOT, ""), bytes: r.bytes ?? null, skipped: !!r.skipped });
      console.log(r.skipped ? `  · cached ${basename(r.dest)}` : `  ✓ ${basename(r.dest)} (${r.bytes} b)`);
    } catch (e) { console.warn(`  ✗ ${url} (${e.message})`); }
  }

  const images = downloads.filter((d) => IMG_RE.test(d.url)).length;
  const videos = downloads.filter((d) => VID_RE.test(d.url)).length;
  await writeFile(
    join(RAW, "catalog.json"),
    JSON.stringify({ fetchedAt: new Date().toISOString(), pagesCrawled: seen.size, products, embeds: [...embeds], downloads }, null, 2),
  );

  console.log(`\nDone. ${images} images, ${videos} videos → assets/raw/.`);
  if (embeds.size) console.log(`Social/video embeds recorded in catalog.json (download with yt-dlp): ${embeds.size}`);
  console.log(`Products captured: ${products.length}. Next: build the layer library (docs/ASSETS.md).`);
}

main().catch((e) => {
  console.error("\nFAILED:", e.message);
  console.error("If every request 403s: you're on the locked-down web sandbox. Run this on the Mac, or add her domains to the egress allowlist.");
  process.exit(1);
});
