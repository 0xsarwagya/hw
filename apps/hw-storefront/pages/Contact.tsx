import React, { useState } from "react";
import { Link } from "react-router-dom";

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      alert("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 animate-[fade-in_0.5s_ease-out]">
      {/* Header */}
      <div className="mb-16">
        <h1 className="text-4xl md:text-7xl font-bold uppercase tracking-tight mb-4">
          Get In Touch
        </h1>
        <p className="text-gray-500 text-lg md:text-xl max-w-2xl">
          Have a question? Drop us a line. We're here to help and would love to
          hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 mb-24">
        {/* Contact Form */}
        <div>
          <h2 className="text-xl font-bold mb-8">Send a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase mb-2">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                required
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">
                Your Email
              </label>
              <input
                type="email"
                placeholder="Enter your email address"
                required
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">
                Subject
              </label>
              <input
                type="text"
                placeholder="What is your message about?"
                required
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">
                Message
              </label>
              <textarea
                rows={5}
                placeholder="Write your message here..."
                required
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white font-bold py-4 rounded-lg uppercase tracking-wide hover:opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        {/* Contact Details */}
        <div className="space-y-12">
          {/* Contact Info */}
          <div>
            <h2 className="text-xl font-bold mb-6">Contact Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-icons-outlined text-sm">email</span>
                </div>
                <span className="font-medium">support@hushwear.in</span>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-icons-outlined text-sm">call</span>
                </div>
                <span className="font-medium">+91 123 456 7890</span>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h2 className="text-xl font-bold mb-6">Business Hours</h2>
            <div className="space-y-2 text-gray-600">
              <p>Monday - Friday: 9am - 6pm IST</p>
              <p>Saturday: 10am - 4pm IST</p>
              <p>Sunday: Closed</p>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-xl font-bold mb-6">Our Location</h2>
            <div className="aspect-[4/3] w-full bg-gray-100 rounded-2xl overflow-hidden mb-4 relative group">
              <img
                src="https://img.freepik.com/free-vector/isometric-city-map-navigation-interface_1284-22340.jpg?w=800&t=st=1710123456~exp=1710124056~hmac=abcdef1234567890"
                alt="Map Location"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="material-icons text-4xl text-primary drop-shadow-xl animate-bounce">
                  location_on
                </span>
              </div>
            </div>
            <p className="text-gray-600 font-medium">
              123 Style Street, Fashion District, Mumbai, India
            </p>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t border-gray-100 pt-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-4">
            What Our Customers Say
          </h2>
          <p className="text-gray-500">
            The top Indian clothing store in terms of quality and condition.
            Don't just take our word for it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ReviewCard
            text="Absolutely love the hoodie I got from Hush & Wear. The quality is insane for the price. Super soft and the print is top-notch."
            author="Arjun K."
          />
          <ReviewCard
            text="Fast delivery and exceptional customer service. They helped me with a size exchange and it was a seamless process."
            author="Priya S."
          />
          <ReviewCard
            text="My new favorite T-shirt. The fit is perfect, and the material feels premium. Definitely coming back for more."
            author="Rohan M."
          />
        </div>
      </div>
    </div>
  );
};

const ReviewCard = ({ text, author }: { text: string; author: string }) => (
  <div className="border border-gray-200 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white flex flex-col justify-between h-full group">
    <div>
      <div className="flex text-accent mb-4 gap-1">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="material-icons text-lg">
            star
          </span>
        ))}
      </div>
      <p className="text-gray-600 text-sm leading-relaxed mb-8">"{text}"</p>
    </div>
    <p className="font-bold text-sm uppercase tracking-wide group-hover:text-primary transition-colors">
      {author}
    </p>
  </div>
);

export default Contact;
