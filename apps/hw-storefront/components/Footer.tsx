"use client";

import Link from "next/link";
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-primary text-white pt-12 pb-8 border-t border-blue-900">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/" className="inline-block">
            <img
              src="https://s6.imgcdn.dev/YT5tM2.png"
              alt="Hush & Wear"
              className="h-10 w-auto object-contain brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 mb-12">
          {/* Col 1 */}
          <div className="space-y-6">
            <div>
              <h4 className="text-secondary font-bold uppercase mb-4 text-sm tracking-widest">
                Customer Service
              </h4>
              <ul className="space-y-2 text-sm text-blue-100">
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/track-order"
                    className="hover:text-white transition-colors"
                  >
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link
                    href="/policies#returns"
                    className="hover:text-white transition-colors"
                  >
                    Return Order
                  </Link>
                </li>
                <li>
                  <Link
                    href="/policies#returns"
                    className="hover:text-white transition-colors"
                  >
                    Cancel Order
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-2 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <span className="material-icons text-secondary text-lg">
                  schedule
                </span>
                <span>15 Days Return Policy*</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-icons text-secondary text-lg">
                  payments
                </span>
                <span>Cash On Delivery*</span>
              </div>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-8">
            <div>
              <h4 className="text-secondary font-bold uppercase mb-4 text-sm tracking-widest">
                Company
              </h4>
              <ul className="space-y-2 text-sm text-blue-100">
                <li>
                  <Link
                    href="/policies#about"
                    className="hover:text-white transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/policies#terms"
                    className="hover:text-white transition-colors"
                  >
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/policies#privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    We are Hiring
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Col 3 */}
          <div className="space-y-6">
            <h4 className="text-secondary font-bold uppercase mb-4 text-sm tracking-widest">
              Connect With Us
            </h4>
            <div className="flex gap-4 mt-4 text-blue-100">
              <a href="#" className="hover:text-white transition-colors">
                <span className="material-icons">facebook</span>
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <span className="material-icons">camera_alt</span>
              </a>{" "}
              {/* Instagramish */}
              <a href="#" className="hover:text-white transition-colors">
                <span className="material-icons">alternate_email</span>
              </a>{" "}
              {/* Twitterish */}
              <a href="#" className="hover:text-white transition-colors">
                <span className="material-icons">smart_display</span>
              </a>{" "}
              {/* Youtube/Snapchat */}
            </div>
          </div>

          {/* Col 4 */}
          <div className="space-y-8">
            <div>
              <h4 className="text-secondary font-bold uppercase mb-4 text-sm tracking-widest">
                Keep Up To Date
              </h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter Email Id:"
                  className="bg-blue-900/50 border-b border-secondary text-white px-3 py-2 text-sm w-full focus:outline-none placeholder-blue-300"
                />
                <button className="bg-secondary text-primary font-bold text-xs uppercase px-4 py-2 hover:bg-white transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-secondary font-bold uppercase mb-4 text-sm tracking-widest">
                100% Secure Payment
              </h4>
              <div className="flex flex-wrap gap-2">
                <div className="bg-white px-2 py-1 rounded flex items-center justify-center">
                  <span className="font-bold text-xs text-blue-800">VISA</span>
                </div>
                <div className="bg-white px-2 py-1 rounded flex items-center justify-center">
                  <span className="font-bold text-xs text-red-600">
                    MasterCard
                  </span>
                </div>
                <div className="bg-white px-2 py-1 rounded flex items-center justify-center">
                  <span className="font-bold text-xs text-blue-500">Paytm</span>
                </div>
                <div className="bg-white px-2 py-1 rounded flex items-center justify-center">
                  <span className="font-bold text-xs text-green-600">UPI</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-900 pt-8 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-blue-300">
            <div>
              <h5 className="text-white font-bold uppercase mb-2 text-xs">
                Men's Clothing
              </h5>
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <Link href="/shop" className="hover:text-white">
                  Top Wear
                </Link>{" "}
                <span>|</span>
                <Link href="/shop" className="hover:text-white">
                  Men's New Arrivals
                </Link>{" "}
                <span>|</span>
                <Link href="/shop" className="hover:text-white">
                  Men's T-Shirts
                </Link>{" "}
                <span>|</span>
                <Link href="/shop" className="hover:text-white">
                  Men's Hoodies
                </Link>{" "}
                <span>|</span>
                <Link href="/shop" className="hover:text-white">
                  Oversized T-Shirts
                </Link>
              </div>
            </div>
            <div>
              <h5 className="text-white font-bold uppercase mb-2 text-xs">
                Unisex Clothing
              </h5>
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <Link href="/shop" className="hover:text-white">
                  Brands
                </Link>{" "}
                <span>|</span>
                <Link href="/shop" className="hover:text-white">
                  Unisex Hoodies
                </Link>{" "}
                <span>|</span>
                <Link href="/shop" className="hover:text-white">
                  Joggers
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-blue-400">
            <p>
              © {new Date().getFullYear()} Rani Sati Clothing Private Limited.
              All rights reserved.
            </p>
            <p className="mt-2 opacity-70">
              Proudly Built and Maintained By vestcodes
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
