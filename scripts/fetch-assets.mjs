#!/usr/bin/env node
/*
  DéLa Já — asset crawler.
  Pulls her REAL catalog + product photos from her live site into
  `assets/raw/` and writes `assets/raw/catalog.json`. These raw photos are the
  SOURCE for the transparent-PNG layer library used by the photo-compositing
  preview engine (see docs/ASSETS.md).

  Requires her domains on the environment's network egress allowlist:
    delajacandles.com, i0.wp.com (i1/i2), b4130177.smushcdn.com

  Usage:  node scripts/fetch-assets.mjs
  Safe to re-run (skips files already downloaded).
*/
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { dirname, join, extname } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const RAW = join(ROOT, "assets", "raw");
const SHOP = "https://delajacandles.com/shop/";

// Known high-res source images from the deep plan (Appendix A) — seed set so we
// have something even if shop markup changes.
const SEED = {
  logo: "https://b4130177.smushcdn.com/4130177/wp-content/uploads/2025/04/1-e1745898030663.png",
  "choc-strawberries": "https://i0.wp.com/delajacandles.com/wp-content/uploads/2026/01/29519-1-scaled.jpg",
  "waffles-ice-cream-1": "https://i0.wp.com/delajacandles.com/wp-content/uploads/2025/07/6845-scaled.jpg",
  "waffles-ice-cream-2": "https://i0.wp.com/delajacandles.com/wp-content/uploads/2025/07/6842-scaled.jpg",
  "waffles-ice-cream-3": "https://i0.wp.com/delajacandles.com/wp-content/uploads/2025/07/6841-scaled.jpg",
  "waffles-ice-cream-4": "https://i0.wp.com/delajacandles.com/wp-content/uploads/2025/07/6846-scaled.jpg",
  "maple-bourbon-apple-crisp": "https://i0.wp.com/delajacandles.com/wp-content/uploads/2025/07/6823-scaled.jpg",
  "driftwood-midnight": "https://i0.wp.com/delajacandles.com/wp-content/uploads/2026/01/28710-scaled.webp",
  "orange-dreamsicle": "https://i0.wp.com/delajacandles.com/wp-content/uploads/2025/07/Messenger_creation_7C35B6DB-D94B-40AE-831C-515369D99907.jpeg",
  "banana-pudding": "https://i0.wp.com/delajacandles.com/wp-content/uploads/2026/03/37271-scaled.webp",
  "toasted-mellow": "https://i0.wp.com/delajacandles.com/wp-content/uploads/2026/05/46981-scaled.jpg",
  "site-hero": "https://delajacandles.com/wp-content/uploads/2025/11/21878-scaled.webp",
};

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function download(url, dest) {
  if (await exists(dest)) return { url, dest, skipped: true };
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 DelaJaAssetBot" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return { url, dest, bytes: buf.length };
}

/** Pull WooCommerce product cards + image srcs from the shop HTML (all pages). */
async function crawlShop() {
  const products = [];
  for (let page = 1; page <= 20; page++) {
    const url = page === 1 ? SHOP : `${SHOP}page/${page}/`;
    let html;
    try {
      const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 DelaJaAssetBot" } });
      if (!res.ok) break;
      html = await res.text();
    } catch {
      break;
    }
    // WooCommerce product list items
    const blocks = html.split(/<li[^>]*class="[^"]*product[^"]*"/i).slice(1);
    if (blocks.length === 0) break;
    for (const b of blocks) {
      const name = (b.match(/woocommerce-loop-product__title[^>]*>([^<]+)</i) || [])[1];
      const price = (b.match(/woocommerce-Price-amount[^>]*><bdi>([^<]+)</i) || [])[1];
      const img = (b.match(/<img[^>]+src="([^"]+)"/i) || [])[1];
      const link = (b.match(/href="([^"]+)"/i) || [])[1];
      if (name) products.push({ name: name.trim(), price, img, link });
    }
    if (!html.includes("page/" + (page + 1))) break;
  }
  return products;
}

async function main() {
  await mkdir(RAW, { recursive: true });
  console.log("→ Crawling shop catalog…");
  let crawled = [];
  try {
    crawled = await crawlShop();
    console.log(`  found ${crawled.length} products`);
  } catch (e) {
    console.warn("  shop crawl failed:", e.message);
  }

  const results = [];
  const all = { ...SEED };
  crawled.forEach((p, i) => {
    if (p.img) all[`shop-${i}-${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`] = p.img;
  });

  for (const [id, url] of Object.entries(all)) {
    const ext = extname(new URL(url).pathname) || ".jpg";
    const dest = join(RAW, `${id}${ext}`);
    try {
      const r = await download(url, dest);
      results.push({ id, ...r });
      console.log(r.skipped ? `  · ${id} (cached)` : `  ✓ ${id} (${r.bytes} bytes)`);
    } catch (e) {
      console.warn(`  ✗ ${id}: ${e.message}`);
    }
  }

  await writeFile(
    join(RAW, "catalog.json"),
    JSON.stringify({ fetchedAt: new Date().toISOString(), crawled, downloads: results }, null, 2),
  );
  console.log(`\nDone. Raw assets in assets/raw/. Next: build layers (see docs/ASSETS.md).`);
}

main().catch((e) => {
  console.error("\nFAILED:", e.message);
  console.error(
    "If this is a 403 'Host not in allowlist', add her domains to the environment's network egress settings and re-run.",
  );
  process.exit(1);
});
