import { Hero } from "@/features/menu/Hero";
import { BrandStory, HowItWorks } from "@/features/menu/HomeSections";
import { MenuBoard } from "@/features/menu/MenuBoard";
import { BundlesRail } from "@/features/menu/BundlesRail";
import { CandleClub } from "@/features/marketing/CandleClub";
import { useDocumentTitle } from "@/lib/useTitle";

export function StorefrontHome() {
  useDocumentTitle(
    "Hand-poured dessert candles",
    "Shop dessert-style candles or build your own at the Candle Bar. Veteran- & mom-owned, small-batch, made to order.",
  );
  return (
    <>
      <Hero />
      <BrandStory />
      <MenuBoard />
      <BundlesRail />
      <CandleClub />
      <HowItWorks />
    </>
  );
}
