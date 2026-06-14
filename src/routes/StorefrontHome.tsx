import { Hero } from "@/features/menu/Hero";
import { BrandStory, HowItWorks } from "@/features/menu/HomeSections";
import { MenuBoard } from "@/features/menu/MenuBoard";

export function StorefrontHome() {
  return (
    <>
      <Hero />
      <BrandStory />
      <MenuBoard />
      <HowItWorks />
    </>
  );
}
