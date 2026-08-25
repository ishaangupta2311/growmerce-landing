import type { Metadata } from "next";
import LegalDoc, { type LegalSection } from "@/components/site/LegalDoc";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What Growsearch collects from shoppers and merchants, why, who processes it, and how long it is kept.",
};

const CONTACT = "ishaangupta1104@gmail.com";

/* Reproduced from the policy published with the Shopify listing. Wording is
   unchanged apart from naming the app Growsearch on first mention. */
const SECTIONS: LegalSection[] = [
  {
    id: "shopper-data",
    heading: "Data collected from shoppers",
    body: [
      "When a shopper uses search on a store with Growsearch installed, the app records the search query, which results were shown, which products were clicked or added to cart, response times, and a coarse device type.",
      "This activity is linked to randomly generated visitor and session identifiers created in the browser. It is not linked to a shopper’s name, email address, phone number, or postal address, and the app does not collect or store IP addresses.",
    ],
  },
  {
    id: "order-and-customer-data",
    heading: "Order and customer data",
    body: [
      "If a merchant enables optional personalization and grants the corresponding permissions, the app reads a signed-in shopper’s recent order history from Shopify to rank familiar products higher in their results.",
      "This data is used in memory only, for the duration of the search. It is held in a short-lived cache for at most ten minutes and is never written to the app’s database or to the search index. Every read is recorded in an access log that identifies the shopper only by a one-way hash.",
      "This feature is disabled by default. When it is off, the app reads no customer or order data at all.",
    ],
  },
  {
    id: "purchase-attribution",
    heading: "Purchase attribution",
    body: [
      "To show merchants which searches lead to sales, the app records order and line item identifiers, product identifiers, quantities, and totals for purchases that began with a search. Shopper identity, addresses, and payment details are excluded.",
    ],
  },
  {
    id: "merchant-data",
    heading: "Merchant and store data",
    body: [
      "The app stores the store domain, an access token issued by Shopify, and the product catalog information needed to build the search index: titles, descriptions, images, prices, and availability.",
    ],
  },
  {
    id: "service-providers",
    heading: "Service providers",
    body: [
      "Search queries and product information are sent to the following processors so the app can function:",
      {
        list: [
          <>
            <strong className="font-semibold text-charcoal">OpenRouter</strong>{" "}
            &mdash; converts product text and images, and shopper queries, into
            the numeric representations used for search, and answers shopper
            follow-up questions about results.
          </>,
          <>
            <strong className="font-semibold text-charcoal">Pinecone</strong>{" "}
            &mdash; stores those numeric representations of the product catalog.
            Each store is isolated in its own namespace.
          </>,
          <>
            <strong className="font-semibold text-charcoal">Render</strong>{" "}
            &mdash; hosts the application and its database.
          </>,
        ],
      },
      "No shopper identity is sent to any of these providers, and the app does not sell personal data or share it for advertising.",
    ],
  },
  {
    id: "retention",
    heading: "Retention and deletion",
    body: [
      "When a merchant uninstalls the app, their data is scheduled for erasure and permanently deleted within 30 days, including search activity, attribution records, AI request records, and the store’s search index. Reinstalling within that window cancels the deletion so the store resumes with its history intact.",
      "The app also responds to Shopify’s mandatory privacy requests. On a request to delete a store’s data, all records for that store are erased. On a request to delete an individual customer’s data, there is no stored record to erase, because the app holds no data keyed to a customer; any cached order history is discarded immediately.",
    ],
  },
  {
    id: "security",
    heading: "Security",
    body: [
      "Data is encrypted in transit and at rest. Access to production systems is restricted to the app’s operator and protected by multi-factor authentication. Reads of customer data are logged. Development and production data are kept strictly separate.",
    ],
  },
  {
    id: "shopper-rights",
    heading: "Shopper rights",
    body: [
      "Shoppers should direct requests to access or delete their data to the merchant whose store they used. Shopify passes those requests to the app automatically, and the app acts on them as described above.",
    ],
  },
  {
    id: "contact",
    heading: "Contact",
    body: [
      <>
        Questions about this policy can be sent to{" "}
        <a
          href={`mailto:${CONTACT}`}
          className="font-semibold text-brand underline underline-offset-2"
        >
          {CONTACT}
        </a>
        .
      </>,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      updated="August 11, 2026"
      intro={
        <>
          Growsearch &mdash; listed on the Shopify App Store as Smart Search
          &mdash; is a Shopify app that replaces a store&rsquo;s built-in search
          with AI-assisted product search and reports on how shoppers use it.
          This policy explains what the app collects, why, and how long it is
          kept.
        </>
      }
      sections={SECTIONS}
    />
  );
}
