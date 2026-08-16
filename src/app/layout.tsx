import type { Metadata, Viewport } from "next";
import { Manrope, Poppins, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Manrope carries almost all copy in the reference; Poppins is reserved for
// the nav links and the hero headline, Space Grotesk for the pricing headline.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins-loaded",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-grotesk-loaded",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://growmerce.ai"),
  title: {
    default: "Growmerce — Shopping, made smarter for every customer",
    template: "%s · Growmerce",
  },
  description:
    "Growmerce turns browsing into buying with AI-powered personalization built for modern commerce.",
  openGraph: {
    title: "Growmerce — Shopping, made smarter for every customer",
    description:
      "Growmerce turns browsing into buying with AI-powered personalization built for modern commerce.",
    url: "https://growmerce.ai",
    siteName: "Growmerce",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The inline script below adds a `js` class before hydration; React must
      // not treat that attribute delta as a mismatch.
      suppressHydrationWarning
      className={`${manrope.variable} ${poppins.variable} ${spaceGrotesk.variable} antialiased`}
    >
      <head>
        {/* Tags the document so scroll-reveal hidden states only apply with JS. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
