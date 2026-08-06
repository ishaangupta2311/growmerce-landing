import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

// A neutral grotesque with real weight, per the reference — the airy geometric
// sans was a big part of why the page read as template-ish.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://growmerce.ai"),
  title: {
    default: "Growmerce — AI products for ecommerce",
    template: "%s · Growmerce",
  },
  description:
    "Growmerce builds AI products that run the unglamorous half of ecommerce — search, merchandising, restocking and conversion.",
  openGraph: {
    title: "Growmerce — AI products for ecommerce",
    description:
      "AI products that run the unglamorous half of ecommerce, so your catalogue keeps working after you close the laptop.",
    url: "https://growmerce.ai",
    siteName: "Growmerce",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f5f7",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
