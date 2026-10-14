import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Caveat, Manrope } from "next/font/google";
import { SHARED_OPEN_GRAPH, TITLE_TEMPLATE } from "@/lib/page-metadata";
import { SITE_ORIGIN } from "@/lib/site-urls";
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
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "Growmerce: Shopping, made smarter for every customer",
    template: TITLE_TEMPLATE,
  },
  description:
    "Growmerce turns browsing into buying with AI-powered personalization built for modern commerce.",
  /* Pages that give their own title and description (see page-metadata.ts)
     replace this whole object; the rest inherit it as it is. */
  openGraph: {
    ...SHARED_OPEN_GRAPH,
    title: "Growmerce: Shopping, made smarter for every customer",
    description:
      "Growmerce turns browsing into buying with AI-powered personalization built for modern commerce.",
    url: SITE_ORIGIN,
  },
  /* Proves ownership of the domain to Google Search Console. Next renders it
     as <meta name="google-site-verification">; the tag must stay on every
     page for as long as the property is verified. */
  verification: {
    google: "Cs1nGjC-TCZhgMuRwTDa7ivC6-hhMJYrjaQOfr9PlAw",
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
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-XBS59VYVXV"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XBS59VYVXV');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
