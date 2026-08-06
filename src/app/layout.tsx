import type { Metadata, Viewport } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
    <html lang="en" className={`${poppins.variable} ${playfair.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
