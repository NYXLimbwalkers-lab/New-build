// Generate the 1200×630 social share image (public/og.png) from the rig art.
// Run after art changes: node scripts/make-og.mjs
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { candleSVG } from "./preview-candle.mjs";

const candle = candleSVG({
  vessel: "jar",
  layers: ["#EBB7BE", "#F4E4C9"],
  whipHex: "#FBF3E4",
  drizzleId: "caramel",
  toppingIds: ["strawberry", "cherry", "sprinkles"],
})
  .replace(/^<svg[^>]*>/, "")
  .replace(/<\/svg>$/, "")
  // strip the rig's page background so the card gradient shows through
  .replace('<rect width="600" height="740" fill="url(#bg)"/>', "");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFF9F5"/><stop offset="1" stop-color="#F3DFDA"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#card)"/>
  <svg x="700" y="-10" width="540" height="666" viewBox="0 0 600 740">${candle}</svg>
  <g font-family="Georgia, 'Times New Roman', serif">
    <text x="96" y="210" font-size="30" letter-spacing="10" fill="#B08D57">THE CANDLE PATISSERIE</text>
    <text x="90" y="310" font-size="92" fill="#3A2C2A">DéLa Já</text>
    <text x="94" y="380" font-size="34" font-style="italic" fill="#5B3A4A">Hand-poured dessert candles</text>
    <text x="94" y="426" font-size="34" font-style="italic" fill="#5B3A4A">that look good enough to eat.</text>
    <text x="96" y="510" font-size="24" letter-spacing="4" fill="#8a6f52">VETERAN-FOUNDED · MOM-OWNED · SMALL-BATCH</text>
  </g>
  <rect x="94" y="238" width="120" height="3" fill="#C8A15A"/>
</svg>`;

writeFileSync(
  new URL("../public/og.png", import.meta.url),
  new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng(),
);
console.log("wrote public/og.png");
