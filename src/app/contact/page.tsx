import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Reveal from "@/components/site/Reveal";
import ContactForm from "./components/ContactForm";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Talk to Growmerce about Growsearch, your store, support, or a partnership.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="font-bricolage">
        <section className="mx-auto max-w-[1370px] px-6 pt-16 pb-12 lg:pt-24 lg:pb-16">
          <Reveal>
            <p className="font-poppins text-[13px] font-extrabold tracking-[0.2em] text-brand uppercase">
              Contact us
            </p>
            <h1 className="mt-5 max-w-[18ch] text-[clamp(2.3rem,5.5vw,5rem)] leading-[1.02] font-extrabold tracking-tight text-balance">
              Let&rsquo;s talk about growing your store
            </h1>
            <p className="mt-6 max-w-[62ch] text-[clamp(1.0625rem,1.6vw,1.35rem)] leading-relaxed text-body-mute">
              Whether you want to see Growsearch in action, have a question about the product, need support, or want to discuss your store, send us a message. We&rsquo;ll make sure it reaches the right person.
            </p>
          </Reveal>
        </section>

        <Reveal className="mx-auto max-w-[1370px] px-6 pb-24">
          <ContactForm />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
