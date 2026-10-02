import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import api from "../../api";

export default function AdvertisementSlider() {
  const [ads, setAds] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api.get("/advertisements")
      .then(response => {
        if (!mounted) return;
        const data = Array.isArray(response.data) ? response.data : [];
        setAds(data);
        setIndex(0);
      })
      .catch(() => {
        if (mounted) setAds([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex(current => (current + 1) % ads.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [ads.length]);

  if (loading || !ads.length) return null;

  const ad = ads[index];

  const previous = event => {
    event.preventDefault();
    setIndex(current => (current - 1 + ads.length) % ads.length);
  };

  const next = event => {
    event.preventDefault();
    setIndex(current => (current + 1) % ads.length);
  };

  const content = (
    <div className="kd-ad-slide">
      <img
        src={ad.imageUrl}
        alt={ad.title || "KisanDirect advertisement"}
        className="kd-ad-image"
      />

      {ad.title && (
        <div className="kd-ad-caption">
          <Megaphone size={15} />
          <span>{ad.title}</span>
        </div>
      )}
    </div>
  );

  return (
    <section className="kd-ad-section" aria-label="Advertisements">
      <div className="kd-ad-frame">
        {ad.linkUrl ? (
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noreferrer"
            className="kd-ad-link"
          >
            {content}
          </a>
        ) : (
          content
        )}

        {ads.length > 1 && (
          <>
            <button
              type="button"
              className="kd-ad-arrow kd-ad-prev"
              onClick={previous}
              aria-label="Previous advertisement"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              className="kd-ad-arrow kd-ad-next"
              onClick={next}
              aria-label="Next advertisement"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
