import React, { useState } from "react";

const FAQS = [
  {
    question: "How do I determine my size?",
    answer:
      "We recommend checking our detailed size guide available on every product page. Our fits are generally true to size, but for an oversized look, you might want to size up.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We offer a hassle-free 7-day return policy for unworn items with tags attached. Simply initiate a return from your account page.",
  },
  {
    question: "How long does shipping take?",
    answer:
      "Standard shipping typically takes 3-5 business days. Express options are available at checkout for 1-2 day delivery in select cities.",
  },
  {
    question: "Do the prints fade after washing?",
    answer:
      "Our prints are high-quality DTG or screen prints designed to last. We recommend washing inside out with cold water to maintain vibrancy.",
  },
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-12 max-w-3xl mx-auto px-4" id="faq">
      <h2 className="text-3xl font-bold text-center uppercase mb-8">
        Frequently Asked Questions
      </h2>
      <div className="space-y-4">
        {FAQS.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex justify-between items-center p-4 text-left font-bold bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span>{faq.question}</span>
              <span className="material-icons text-gray-500">
                {openIndex === index ? "remove" : "add"}
              </span>
            </button>
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                openIndex === index
                  ? "max-h-40 opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="p-4 text-gray-600 bg-white border-t border-gray-100 text-sm leading-relaxed">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQ;
