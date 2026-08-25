import Link from "next/link";
import type { Metadata } from "next";
import LegalDoc, { type LegalSection } from "@/components/site/LegalDoc";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms you agree to when you install and use Growsearch, including plans, billing, the free trial, acceptable use and cancellation.",
};

const CONTACT = "admin@growmerce.ai";

function Mail() {
  return (
    <a
      href={`mailto:${CONTACT}`}
      className="font-semibold text-brand underline underline-offset-2"
    >
      {CONTACT}
    </a>
  );
}

const SECTIONS: LegalSection[] = [
  {
    id: "who",
    heading: "Who these terms are between",
    body: [
      "These terms are an agreement between Growmerce (“we”, “us”) and the merchant who installs one of our apps on their store (“you”). Growmerce is the umbrella brand that builds and operates the AI tools listed here; Growsearch is the first of them, listed on the Shopify App Store as Smart Search.",
      "Installing the app, or using it after these terms change, means you accept them. If you are installing on behalf of a company, you confirm you are allowed to agree to these terms for that company.",
    ],
  },
  {
    id: "service",
    heading: "What the service does",
    body: [
      "Growsearch layers AI-assisted search over your store’s existing search. It indexes your catalogue, interprets what shoppers type, ranks and recovers results, and reports on what shoppers searched for and what those searches earned.",
      "It is designed to sit on top of your native results rather than replace them, so your storefront keeps working if our service is unavailable.",
    ],
  },
  {
    id: "store-access",
    heading: "Your store and the access you grant",
    body: [
      "The app runs on permissions you grant through Shopify at install. We use that access only to operate the features you have enabled — building and refreshing your search index, serving results, and attributing checkouts to searches.",
      "Optional personalization, which reads a signed-in shopper’s recent order history to rank familiar products higher, is off unless you turn it on and grant the extra permission. You are responsible for deciding whether to enable it for your store and your shoppers.",
      "You are responsible for keeping your Shopify account secure and for the accuracy of the catalogue data the app indexes.",
    ],
  },
  {
    id: "trial",
    heading: "The free trial",
    body: [
      "Every plan starts with a 15-day free trial. No card is required to begin it, and we take no revenue share at any point.",
      "The trial gives you the full plan so the comparison is against your own store’s numbers. If you do not choose a plan by the end of it, the app simply stops serving AI results and your native Shopify search continues as before.",
    ],
  },
  {
    id: "plans",
    heading: "Plans, billing and renewals",
    body: [
      <>
        Plans, their monthly and annual prices, and what each one includes are
        listed on the{" "}
        <Link
          href="/pricing"
          className="font-semibold text-brand underline underline-offset-2"
        >
          pricing page
        </Link>
        , which forms part of these terms. Charges are billed through Shopify on
        your regular store invoice.
      </>,
      "Subscriptions renew automatically for the same period until you cancel. Annual plans are charged up front for the year at the discounted rate shown at checkout.",
      "We may change prices for future billing periods. If we do, we will tell you before the change takes effect on your subscription, and you are free to cancel rather than accept it.",
      "Taxes are added where they apply. Charges already made are not refunded on a mid-period cancellation, but you keep access until the period you paid for runs out.",
    ],
  },
  {
    id: "limits",
    heading: "Search limits and fair use",
    body: [
      "Each plan includes a monthly allowance of shopper searches. The allowance for your plan is shown on the pricing page and in your dashboard, and it resets at the start of each billing period.",
      "If you consistently exceed your allowance we will contact you about moving to a plan that fits rather than cutting your storefront off without warning. Enterprise catalogues and unusual volumes are handled by arrangement.",
      "Automated traffic, load testing and scraping through the search endpoint are not covered by these allowances and may be rate limited.",
    ],
  },
  {
    id: "data",
    heading: "Your catalogue and your data",
    body: [
      "Your catalogue and your store’s search data remain yours. We use them to run the service for you, and we do not sell personal data or share it for advertising.",
      <>
        What the app collects, which processors it uses and how long anything is
        kept is set out in full in our{" "}
        <Link
          href="/privacy"
          className="font-semibold text-brand underline underline-offset-2"
        >
          privacy policy
        </Link>
        .
      </>,
      "We may report on aggregated, de-identified usage — for example how often searches return nothing across all stores — in a form that does not identify you, your store or your shoppers.",
    ],
  },
  {
    id: "acceptable-use",
    heading: "Acceptable use",
    body: [
      "You agree not to:",
      {
        list: [
          "use the app for a store selling anything illegal in the markets it ships to, or anything Shopify’s own policies prohibit",
          "attempt to reverse engineer, resell or white-label the service without a written agreement with us",
          "interfere with the service, probe it for vulnerabilities outside a disclosure we have agreed to, or use it to send automated or abusive traffic",
          "misrepresent the app’s output to your shoppers as anything other than search results",
        ],
      },
      "We may suspend an account that is causing harm to the service or to other merchants. Where we can, we will tell you first and give you a chance to fix it.",
    ],
  },
  {
    id: "availability",
    heading: "Availability, changes and support",
    body: [
      "We aim to keep the service running continuously, but we do not guarantee uninterrupted availability. Maintenance, third-party outages and faults happen; the app is built to fall back to your native Shopify search when they do.",
      "We improve and change the product regularly. We will not remove a material feature your plan depends on without notice, and where a change requires action from you we will say so in advance.",
      "Support is by email at the address below.",
    ],
  },
  {
    id: "ip",
    heading: "Intellectual property",
    body: [
      "The app, its interface, its models and configuration, and the Growmerce and Growsearch names and marks belong to us. Nothing in these terms transfers them to you; you get a licence to use the service while your subscription is active.",
      "Everything you supply — your catalogue, your content, your trade marks — stays yours. You grant us only the permission needed to index, process and display it in the course of running the service for you.",
    ],
  },
  {
    id: "cancelling",
    heading: "Cancelling and uninstalling",
    body: [
      "You can cancel at any time from your dashboard, and you can uninstall the app from Shopify whenever you like. There is no notice period and no cancellation fee.",
      "On uninstall, your data is scheduled for erasure and permanently deleted within 30 days. Reinstalling inside that window cancels the deletion so your store resumes with its history intact.",
      "We may end this agreement if you break these terms materially and do not put it right after we have asked, or if we discontinue the service — in which case we will give you reasonable notice and refund the unused part of any period you have paid for in advance.",
    ],
  },
  {
    id: "liability",
    heading: "Warranties and liability",
    body: [
      "The service is provided as it is. AI-assisted search is probabilistic: it will not rank every query perfectly, and we do not warrant particular sales, conversion or ranking outcomes.",
      "To the extent the law allows, we are not liable for lost profits, lost revenue or indirect or consequential losses. Our total liability for any claim relating to the service is limited to the fees you paid us in the twelve months before the claim arose.",
      "Nothing here limits liability that cannot be limited by law.",
    ],
  },
  {
    id: "changes",
    heading: "Changes to these terms",
    body: [
      "We may update these terms as the product changes. The date at the top of this page always reflects the current version, and we will give notice of material changes before they take effect on your subscription. Continuing to use the app after that means you accept the updated terms.",
    ],
  },
  {
    id: "law",
    heading: "Governing law",
    body: [
      "These terms are governed by the laws of India, and the courts of India have exclusive jurisdiction over any dispute arising from them. This does not remove any protection you have under the mandatory law of the country you operate in.",
    ],
  },
  {
    id: "contact",
    heading: "Contact",
    body: [
      <>
        Questions about these terms, or anything else, can be sent to <Mail />.
      </>,
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms &amp; Conditions"
      updatedLabel="Effective"
      updated="August 25, 2026"
      intro={
        <>
          These are the terms you agree to when you install and use a Growmerce
          app on your store. They cover what the service does, how plans and
          billing work, what each of us is responsible for, and how to leave.
        </>
      }
      sections={SECTIONS}
    />
  );
}
