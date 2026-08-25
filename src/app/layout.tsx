import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Caveat, Manrope } from "next/font/google";
import "./globals.css";

// Manrope remains available to the archived /v concepts, which intentionally
// use a different type system. Every production route uses Bricolage through
// the shared `font-bricolage` token.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage-loaded",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat-loaded",
  subsets: ["latin"],
  weight: ["500", "600"],
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
      className={`${manrope.variable} ${bricolage.variable} ${caveat.variable} antialiased`}
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
