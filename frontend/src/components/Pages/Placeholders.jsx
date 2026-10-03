import React from "react";
import { Link } from "react-router-dom";
import { Compass, Hammer } from "lucide-react";

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
