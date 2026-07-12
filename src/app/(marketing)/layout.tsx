import type { ReactNode } from "react";
import { marketingFontVars } from "@/components/marketing/fonts";
import { BG, INK } from "@/components/marketing/theme";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingStyles } from "@/components/marketing/kit";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${marketingFontVars} relative min-h-dvh`}
      style={{
        background: BG,
        color: INK,
        fontFamily: "var(--font-body)",
        // clip → yatay taşmaları keser ama sticky nav'ı bozmaz (scroll container oluşturmaz)
        overflowX: "clip",
      }}
    >
      <MarketingStyles />
      <MarketingNav />
      {children}
      <MarketingFooter />
    </div>
  );
}
