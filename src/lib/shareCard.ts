/*
  Auto-render a shareable "hero snapshot" of the finished candle (the Nike-By-You
  move: the build becomes shareable content). We rasterize the live candle <svg>
  onto a foil-pressed boutique card (4:5) and hand back a PNG Blob for
  navigator.share or download.
*/
const W = 1080;
const H = 1350;

export async function buildShareCard(
  svg: SVGSVGElement,
  opts: { name: string; price: string },
): Promise<Blob | null> {
  try {
    // Serialize the candle SVG → an <img> we can draw to canvas.
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const xml = new XMLSerializer().serializeToString(clone);
    const svgUrl =
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);

    const img = new Image();
    img.decoding = "async";
    img.src = svgUrl;
    await img.decode().catch(() => {});

    // Make sure the brand fonts are ready so canvas text renders correctly.
    if ("fonts" in document) await (document as Document).fonts.ready;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Warm porcelain → blush gradient background.
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#FFFAF7");
    bg.addColorStop(1, "#F3DDE0");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Thin gold frame.
    ctx.strokeStyle = "rgba(200,161,90,0.55)";
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    // Eyebrow.
    ctx.fillStyle = "#C8A15A";
    ctx.textAlign = "center";
    ctx.font = "500 26px Jost, sans-serif";
    ctx.save();
    ctx.translate(0, 0);
    drawTracked(ctx, "DÉLA JÁ · MADE JUST FOR YOU", W / 2, 130, 6);
    ctx.restore();

    // Candle, centered.
    const size = 720;
    ctx.drawImage(img, (W - size) / 2, 190, size, size);

    // Name (display serif).
    ctx.fillStyle = "#2A1F1D";
    ctx.font = "500 64px 'Playfair Display', Georgia, serif";
    ctx.fillText(truncate(opts.name, 22), W / 2, 1040);

    // Price.
    ctx.fillStyle = "#3A2C2A";
    ctx.font = "400 40px 'Cormorant Garamond', Georgia, serif";
    ctx.fillText(opts.price, W / 2, 1110);

    // Divider + footer.
    ctx.strokeStyle = "rgba(200,161,90,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 70, 1160);
    ctx.lineTo(W / 2 + 70, 1160);
    ctx.stroke();
    ctx.fillStyle = "#8A7470";
    ctx.font = "400 22px Jost, sans-serif";
    drawTracked(ctx, "HAND-POURED · SMALL-BATCH", W / 2, 1215, 4);

    return await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png", 0.95),
    );
  } catch {
    return null;
  }
}

function truncate(s: string, n: number) {
  const t = s.trim() || "Your Creation";
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

/** Draw letter-spaced (tracked) centered text — canvas has no letter-spacing. */
function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  tracking: number,
) {
  const widths = [...text].map((ch) => ctx.measureText(ch).width + tracking);
  const total = widths.reduce((a, b) => a + b, 0) - tracking;
  let x = cx - total / 2;
  const prev = ctx.textAlign;
  ctx.textAlign = "left";
  [...text].forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i];
  });
  ctx.textAlign = prev;
}

/** Share the PNG (mobile share sheet) or download it. */
export async function shareOrDownload(blob: Blob, name: string) {
  const file = new File([blob], `${slug(name)}.png`, { type: "image/png" });
  const nav = navigator as Navigator & {
    canShare?: (d: { files: File[] }) => boolean;
  };
  if (nav.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file], title: name });
      return;
    } catch {
      /* fell through to download */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const slug = (s: string) =>
  (s.trim() || "dela-ja-candle").toLowerCase().replace(/[^a-z0-9]+/g, "-");
