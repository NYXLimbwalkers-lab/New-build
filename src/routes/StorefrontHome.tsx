import { Hero } from "@/features/menu/Hero";
import { BrandStory, HowItWorks } from "@/features/menu/HomeSections";
import { MenuBoard } from "@/features/menu/MenuBoard";
import { BundlesRail } from "@/features/menu/BundlesRail";

export function StorefrontHome() {
  return (
    <>
      <Hero />
      <BrandStory />
      <MenuBoard />
      <BundlesRail />
      <HowItWorks />
    </>
  );
}
