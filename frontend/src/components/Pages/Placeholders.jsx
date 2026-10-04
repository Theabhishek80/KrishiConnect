import React from "react";
import { Link } from "react-router-dom";
import { Compass, Hammer, TrendingUp, Bell, MapPin, LineChart } from "lucide-react";

/* Shown for account pages that are linked in the menu but not built yet
   (instead of a blank screen). Replace a route's element when the real
   page is ready. */
export function ComingSoon({ title, text }) {
  return (
    <section className="page-section">
      <div className="empty-state">
        <Hammer size={36} />
        <h3>{title}</h3>
        <p>{text || "This section is coming soon. Thanks for your patience!"}</p>
        <Link className="primary-btn" to="/">
          Back to marketplace
        </Link>
      </div>
    </section>
  );
}

export function NotFoundPage() {
  return (
    <section className="page-section">
      <div className="empty-state">
        <Compass size={36} />
        <h3>Page not found</h3>
        <p>The page you're looking for doesn't exist or has moved.</p>
        <Link className="primary-btn" to="/">
          Go to home
        </Link>
      </div>
    </section>
  );
}

/* Mandi rates: the live price feed is not available yet. */
export function MandiPage() {
  return (
    <section className="page-section">
      <div className="kd-mandi-soon">
        <span className="kd-mandi-icon" aria-hidden="true">
          <TrendingUp size={34} />
        </span>

        <span className="kd-soon-badge">COMING SOON</span>

        <h1>Mandi rates</h1>

        <p>
          Live mandi prices for your crops and your nearest markets are on
          the way. We are connecting the price data right now.
        </p>

        <ul className="kd-mandi-points">
          <li><LineChart size={18} /> Daily prices for popular crops</li>
          <li><MapPin size={18} /> Rates from mandis near you</li>
          <li><Bell size={18} /> Price alerts for your produce</li>
        </ul>

        <Link className="primary-btn" to="/">
          Back to marketplace
        </Link>
      </div>
    </section>
  );
}
