import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">

        {/* Main Footer */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div>
            <Link
              to="/"
              className="text-2xl font-bold tracking-tight"
            >
              Kisan<span className="text-green-500">Direct</span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-400">
              Fresh farm products directly from farmers.
              Discover quality products, support farmers,
              and make better choices with KisanDirect.
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Connecting farmers and customers across India.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h3>

            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  to="/"
                  className="text-gray-400 transition hover:text-green-400"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  to="/products"
                  className="text-gray-400 transition hover:text-green-400"
                >
                  Products
                </Link>
              </li>

              <li>
                <Link
                  to="/mandi"
                  className="text-gray-400 transition hover:text-green-400"
                >
                  Mandi
                </Link>
              </li>

              <li>
                <Link
                  to="/recipes"
                  className="text-gray-400 transition hover:text-green-400"
                >
                  Recipes
                </Link>
              </li>

              <li>
                <Link
                  to="/blogs"
                  className="text-gray-400 transition hover:text-green-400"
                >
                  Blogs
                </Link>
              </li>

              <li>
                <Link
                  to="/kisandirect-ai"
                  className="text-gray-400 transition hover:text-green-400"
                >
                  KisanDirect AI
                </Link>
              </li>
            </ul>
          </div>

          {/* Farmers */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              For Farmers
            </h3>

            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  to="/farmer/register"
                  className="text-gray-400 transition hover:text-green-400"
                >
                  Join as a Farmer
                </Link>
              </li>

              <li>
                <Link
                  to="/farmer/dashboard"
                  className="text-gray-400 transition hover:text-green-400"
                >
                  Farmer Dashboard
                </Link>
              </li>

              <li>
                <Link
                  to="/products"
                  className="text-gray-400 transition hover:text-green-400"
                >
                  Sell Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Support
            </h3>

            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 transition hover:text-green-400"
                >
                  About Us
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className="text-gray-400 transition hover:text-green-400"
                >
                  Contact Us
                </Link>
              </li>

              <li>
                <Link
                  to="/privacy-policy"
                  className="text-gray-400 transition hover:text-green-400"
                >
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link
                  to="/terms"
                  className="text-gray-400 transition hover:text-green-400"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 border-t border-gray-800" />

        {/* Bottom */}
        <div className="flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">

          <p className="text-gray-500">
            © {new Date().getFullYear()} KisanDirect. All rights reserved.
          </p>

          <p className="text-gray-500">
            Made for farmers and customers in India 🇮🇳
          </p>

        </div>
      </div>
    </footer>
  );
}
