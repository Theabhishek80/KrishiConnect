import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="kd-footer">
      <div className="kd-footer-container">

        <div className="kd-footer-grid">

          {/* Brand */}
          <div className="kd-footer-brand">
            <h2>
              Kisan<span>Direct</span>
            </h2>

            <p>
              Fresh farm products directly from farmers.
              Discover quality products, support farmers,
              and make better choices with KisanDirect.
            </p>

            <p>
              Connecting farmers and customers across India.
            </p>
          </div>

          {/* Quick Links */}
          <div className="kd-footer-column">
            <h3>Quick Links</h3>

            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>

              <li>
                <Link to="/about">About Us</Link>
              </li>

              <li>
                <Link to="/blog">Blogs</Link>
              </li>

              <li>
                <Link to="/recipes">Recipes</Link>
              </li>

              <li>
                <Link to="/mandi">Mandi</Link>
              </li>

              <li>
                <Link to="/kisandirect-ai">
                  KisanDirect AI
                </Link>
              </li>
            </ul>
          </div>

          {/* For Farmers */}
          <div className="kd-footer-column">
            <h3>For Farmers</h3>

            <ul>
              <li>
                <Link to="/farmer">
                  Farmer Dashboard
                </Link>
              </li>

              <li>
                <Link to="/register">
                  Join KisanDirect
                </Link>
              </li>

              <li>
                <Link to="/farmer">
                  Sell Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="kd-footer-column">
            <h3>Support</h3>

            <ul>
              <li>
                <Link to="/about">About Us</Link>
              </li>

              <li>
                <Link to="/login">Login</Link>
              </li>

              <li>
                <Link to="/register">Register</Link>
              </li>

              <li>
                <Link to="/settings">Settings</Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="kd-footer-divider" />

        <div className="kd-footer-bottom">

          <p>
            © {new Date().getFullYear()} KisanDirect.
            All rights reserved.
          </p>

          <p className="kd-footer-india">
            Made for farmers and customers in India 🇮🇳
          </p>

        </div>

      </div>
    </footer>
  );
}
