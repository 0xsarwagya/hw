"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";

const Policies: React.FC = () => {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.getElementById(hash.replace("#", ""));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]); // Use pathname instead of hash

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      // Update URL hash without jumping
      window.history.pushState(null, "", `#${id}`);
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-[fade-in_0.5s_ease-out]">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <h1 className="text-2xl font-bold mb-6 uppercase tracking-tight">
              Help Center
            </h1>
            <nav className="space-y-1">
              {[
                { id: "faq", icon: "quiz", label: "FAQs" },
                {
                  id: "shipping",
                  icon: "local_shipping",
                  label: "Shipping Policy",
                },
                {
                  id: "returns",
                  icon: "autorenew",
                  label: "Returns & Exchanges",
                },
                { id: "terms", icon: "description", label: "Terms of Service" },
                { id: "privacy", icon: "shield", label: "Privacy Policy" },
                { id: "contact", icon: "mail", label: "Contact Us" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50 hover:text-black transition-colors focus:outline-none focus:bg-gray-50 focus:text-black"
                >
                  <span className="material-icons text-lg text-gray-400">
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-16">
          {/* FAQ Section */}
          <section id="faq" className="scroll-mt-28">
            <h2 className="text-3xl font-bold mb-8 uppercase tracking-tight">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <details className="group border-b border-gray-200 py-4 cursor-pointer">
                <summary className="flex items-center justify-between font-medium list-none">
                  <span>How do I track my order?</span>
                  <span className="material-icons transition-transform group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <p className="text-gray-600 mt-4 text-sm leading-relaxed">
                  Once your order has shipped, you will receive an email and/or
                  text message with a tracking number and a link to the
                  carrier's website. You can also find tracking information in
                  your account dashboard under 'Order History' or use our{" "}
                  <Link href="/track-order" className="underline text-black">
                    Track Order
                  </Link>{" "}
                  page.
                </p>
              </details>
              <details className="group border-b border-gray-200 py-4 cursor-pointer">
                <summary className="flex items-center justify-between font-medium list-none">
                  <span>What are my payment options?</span>
                  <span className="material-icons transition-transform group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <p className="text-gray-600 mt-4 text-sm leading-relaxed">
                  We accept all major credit cards (VISA, Mastercard, AMEX),
                  PayPal, Net Banking, and UPI. All transactions are encrypted
                  for your security via our secure payment gateway.
                </p>
              </details>
              <details className="group border-b border-gray-200 py-4 cursor-pointer">
                <summary className="flex items-center justify-between font-medium list-none">
                  <span>Do you ship internationally?</span>
                  <span className="material-icons transition-transform group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <p className="text-gray-600 mt-4 text-sm leading-relaxed">
                  Currently, we only ship within India. We are working on
                  expanding our shipping options to international destinations
                  in the near future. Stay tuned for updates!
                </p>
              </details>
              <details className="group border-b border-gray-200 py-4 cursor-pointer">
                <summary className="flex items-center justify-between font-medium list-none">
                  <span>How do I determine my size?</span>
                  <span className="material-icons transition-transform group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <p className="text-gray-600 mt-4 text-sm leading-relaxed">
                  We recommend checking our detailed size guide available on
                  every product page. Our fits are generally true to size, but
                  for an oversized look, you might want to size up.
                </p>
              </details>
            </div>
          </section>

          {/* Shipping Policy */}
          <section
            id="shipping"
            className="scroll-mt-28 bg-gray-50 rounded-2xl p-8 border border-gray-100"
          >
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">
              Shipping Policy
            </h2>
            <div className="prose prose-sm max-w-none text-gray-600">
              <p className="mb-4">
                We are committed to delivering your order accurately, in good
                condition, and always on time. We partner with reputed national
                couriers to ship your orders.
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                <li>
                  <strong>Free Shipping:</strong> Available on all prepaid
                  orders above ₹999 across India.
                </li>
                <li>
                  <strong>COD Charges:</strong> A nominal fee of ₹50 is charged
                  for Cash on Delivery orders.
                </li>
                <li>
                  <strong>Dispatch Time:</strong> Orders are typically
                  dispatched within 1-2 business days.
                </li>
                <li>
                  <strong>Delivery Time:</strong> Standard delivery takes 3-7
                  business days depending on your location. Metro cities may see
                  faster delivery.
                </li>
              </ul>
              <p>
                In the unlikely event that we are unable to deliver any items in
                your order, be assured that you will not be charged for that
                item, or you shall be refunded the full amount charged for the
                item.
              </p>
            </div>
          </section>

          {/* Returns Policy */}
          <section
            id="returns"
            className="scroll-mt-28 bg-gray-50 rounded-2xl p-8 border border-gray-100"
          >
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">
              Returns & Exchanges
            </h2>
            <div className="prose prose-sm max-w-none text-gray-600">
              <p className="mb-4">
                Your satisfaction is our priority. If you are not 100% satisfied
                with your purchase, you can return the product and get a full
                refund or exchange it.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Eligibility:</strong> You can return a product for up
                  to 7 days from the date you received it.
                </li>
                <li>
                  <strong>Condition:</strong> Any product you return must be in
                  the same condition you received it and in the original
                  packaging with tags attached.
                </li>
                <li>
                  <strong>Process:</strong> Initiate a return from your Account
                  Orders page or contact our support team.
                </li>
                <li>
                  <strong>Refunds:</strong> Once received and inspected, refunds
                  are processed within 5-7 business days to the original payment
                  method.
                </li>
              </ul>
            </div>
          </section>

          {/* Terms of Service */}
          <section id="terms" className="scroll-mt-28">
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">
              Terms of Service
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              By accessing or using the Hush & Wear website, you agree to be
              bound by these Terms of Service. All content on this site,
              including text, graphics, logos, and images, is the property of
              Hush & Wear.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              We reserve the right to refuse service to anyone for any reason at
              any time. Prices for our products are subject to change without
              notice. We reserve the right at any time to modify or discontinue
              the Service (or any part or content thereof) without notice at any
              time.
            </p>
          </section>

          {/* Privacy Policy */}
          <section id="privacy" className="scroll-mt-28">
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">
              Privacy Policy
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Hush & Wear respects your privacy. We collect personal information
              such as your name, email address, and shipping address to process
              your orders and improve your shopping experience. We do not sell
              or trade your personal information to third parties.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              We use cookies to analyze website traffic and personalize content.
              By using our website, you consent to our use of cookies and other
              tracking technologies.
            </p>
          </section>

          {/* Contact Us */}
          <section id="contact" className="scroll-mt-28">
            <h2 className="text-2xl font-bold mb-6 uppercase tracking-tight">
              Contact Us
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-black text-white p-8 rounded-2xl">
                <h3 className="font-bold text-lg mb-4">Get in Touch</h3>
                <div className="space-y-4 text-sm opacity-90">
                  <div className="flex items-center gap-3">
                    <span className="material-icons text-lime-400">email</span>
                    <span>support@hushandwear.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-icons text-lime-400">phone</span>
                    <span>+91 98765 43210</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-icons text-lime-400">place</span>
                    <span>123 Fashion Street, Bangalore, India</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-icons text-lime-400">
                      schedule
                    </span>
                    <span>Mon - Fri, 10am - 6pm IST</span>
                  </div>
                </div>
              </div>
              <div>
                <form className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:bg-white focus:ring-black focus:border-black"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:bg-white focus:ring-black focus:border-black"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:bg-white focus:ring-black focus:border-black"
                      placeholder="How can we help?"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="bg-black text-white px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wide hover:opacity-90"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Policies;
