/*
  ⚠️ PLACEHOLDER REVIEW DATA — illustrative only, so the UX of reviews can be
  evaluated on the preview. Reviews are the #1 conversion lever for this audience
  (up to ~270% lift; 45% won't buy a product with zero reviews), and a flawless
  5.0 reads as fake (4.0–4.7 converts best) — hence the realistic spread below.

  BEFORE LAUNCH: replace this with her real reviews, ideally via a reviews app
  (Judge.me / Yotpo / Loox) so customers can leave verified, photo reviews.
*/
export interface Review {
  id: string;
  productId: string;
  name: string;
  rating: number; // 1-5
  title: string;
  body: string;
  date: string; // ISO
  verified: boolean;
}

/*
  Seed reviews are OFF in production builds — showing invented names with
  "Verified" badges (and feeding them into schema.org aggregateRating) is a
  trust & SEO liability. Enable for demos with VITE_SEED_REVIEWS=1.
*/
const SEED_ON = import.meta.env.DEV || import.meta.env.VITE_SEED_REVIEWS === "1";

export const REVIEWS: Review[] = [
  { id: "r1", productId: "waffles-ice-cream", name: "Brittany M.", rating: 5, title: "Smells like a real waffle house", date: "2026-04-12", verified: true, body: "I genuinely did a double take — it looks like a little plate of waffles. The scent throw is incredible even unlit." },
  { id: "r2", productId: "waffles-ice-cream", name: "Dana R.", rating: 4, title: "So cute, a little sweet", date: "2026-03-02", verified: true, body: "Adorable and well made. Sweeter than I expected but my kids are obsessed with how it looks." },
  { id: "r3", productId: "waffles-ice-cream", name: "Kayla T.", rating: 5, title: "Bought 3 as gifts", date: "2026-02-20", verified: true, body: "Everyone thought I spent way more than I did. Packaging felt like a gift already." },
  { id: "r4", productId: "toasted-mellow", name: "Sam P.", rating: 5, title: "Toasted marshmallow heaven", date: "2026-05-01", verified: true, body: "Cozy without being cloying. The little marshmallows are the cutest detail." },
  { id: "r5", productId: "toasted-mellow", name: "Renee F.", rating: 4, title: "Warm and comforting", date: "2026-01-15", verified: true, body: "Reminds me of campfires. Burned clean and even." },
  { id: "r6", productId: "choc-strawberries", name: "Alyssa G.", rating: 5, title: "Date night staple", date: "2026-04-28", verified: true, body: "The chocolate-dipped strawberry on top is unreal. Smells exactly like the real thing." },
  { id: "r7", productId: "choc-strawberries", name: "Monica L.", rating: 5, title: "Obsessed", date: "2026-03-19", verified: true, body: "Hand-poured quality you can feel. Will be reordering." },
  { id: "r8", productId: "berry-intoxicating", name: "Tasha W.", rating: 5, title: "Girls' night winner", date: "2026-05-10", verified: true, body: "The wine glass gel candle is stunning lit. Blackberry margarita scent is spot on." },
  { id: "r9", productId: "berry-intoxicating", name: "Jen K.", rating: 4, title: "Gorgeous", date: "2026-02-08", verified: true, body: "Looks beautiful on the bar cart. Wish it were a touch stronger but lovely." },
  { id: "r10", productId: "orange-dreamsicle", name: "Priya S.", rating: 5, title: "Nostalgic in the best way", date: "2026-04-03", verified: true, body: "Creamsicle summer vibes all year. The whipped top is so pretty." },
  { id: "r11", productId: "maple-bourbon-apple-crisp", name: "Hannah B.", rating: 5, title: "Fall in a jar", date: "2026-03-22", verified: true, body: "The caramel drizzle and crumble make it look good enough to eat. Cozy scent." },
  { id: "r12", productId: "white-tea-rose", name: "Olivia C.", rating: 4, title: "Elegant and soft", date: "2026-01-29", verified: true, body: "Delicate rose, not overpowering. The sculpted rose is beautiful." },
  { id: "r13", productId: "classic-scented", name: "Megan D.", rating: 5, title: "My everyday candle", date: "2026-02-14", verified: true, body: "Clean, simple, burns forever. The wood lid is a nice touch." },
];

const byProduct = new Map<string, Review[]>();
for (const r of SEED_ON ? REVIEWS : []) {
  const arr = byProduct.get(r.productId) ?? [];
  arr.push(r);
  byProduct.set(r.productId, arr);
}

export function getReviews(productId: string): Review[] {
  return (byProduct.get(productId) ?? []).slice().sort((a, b) => b.date.localeCompare(a.date));
}

export function getRating(productId: string): { avg: number; count: number } | null {
  const arr = byProduct.get(productId);
  if (!arr || arr.length === 0) return null;
  const avg = arr.reduce((s, r) => s + r.rating, 0) / arr.length;
  return { avg: Math.round(avg * 10) / 10, count: arr.length };
}
