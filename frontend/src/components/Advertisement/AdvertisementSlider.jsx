import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import api from "../../api";

/*
 * Shown while there are no admin-uploaded posters (or the ads API is
 * unreachable) so the home page never has an empty gap. As soon as the
 * admin uploads and activates posters, those replace these.
 */
const DEFAULT_SLIDES = [
  {
    id: "default-1",
    tone: 1,
    kicker: "FARM FRESH",
    title: "Fresh produce, straight from the farm",
    text: "Order seasonal vegetables, fruits and grains directly from local farmers.",
    cta: "Shop now",
    to: "#products"
  },
  {
    id: "default-2",
    tone: 2,
    kicker: "FOR FARMERS",
    title: "Sell your harvest at a fairer price",
    text: "List your produce on KisanDirect and reach customers without middlemen.",
    cta: "Join as a farmer",
    to: "/register"
  },
  {
    id: "default-3",
    tone: 3,
    kicker: "LEARN & COOK",
    title: "Farming tips and fresh recipes",
    text: "Read practical guides and cook something new with farm-fresh ingredients.",
    cta: "Read the blog",
    to: "/blog"
  }
];

const SWIPE_THRESHOLD = 45;

function ActionLink({ to, className, children }) {
  if (to?.startsWith("#")) {
    return <a className={className} href={to}>{children}</a>;
  }
  return <Link className={className} to={to}>{children}</Link>;
}

export default function AdvertisementSlider() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const touchStart = useRef(null);

  useEffect(() => {
    let mounted = true;

    api.get("/advertisements")
      .then(response => {
        if (!mounted) return;
        const data = Array.isArray(response.data) ? response.data : [];
        setAds(data.filter(ad => ad && ad.imageUrl));
      })
      .catch(() => {
        if (mounted) setAds([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const usingDefaults = ads.length === 0;
  const slides = usingDefaults ? DEFAULT_SLIDES : ads;
  const count = slides.length;

  const go = useCallback(
    next => setIndex(((next % count) + count) % count),
    [count]
  );

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    if (count <= 1 || paused) return;

    const timer = window.setInterval(() => {
      setIndex(current => (current + 1) % count);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (loading) {
    return (
      <section className="kd-ad-section" aria-hidden="true">
        <div className="kd-ad-frame kd-ad-loading" />
      </section>
    );
  }

  const onTouchStart = event => {
    touchStart.current = event.touches[0].clientX;
    setPaused(true);
  };

  const onTouchEnd = event => {
    if (touchStart.current !== null) {
      const delta = event.changedTouches[0].clientX - touchStart.current;

      if (Math.abs(delta) > SWIPE_THRESHOLD) {
        go(index + (delta < 0 ? 1 : -1));
      }
    }

    touchStart.current = null;
    window.setTimeout(() => setPaused(false), 2500);
  };

  return (
    <section className="kd-ad-section" aria-label="Advertisements">
      <div
        className="kd-ad-frame"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >

        <div
          className="kd-ad-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => {

            const hidden = i !== index;

            if (usingDefaults) {
              return (
                <div
                  className={`kd-ad-slide kd-ad-default tone-${slide.tone}`}
                  key={slide.id}
                  aria-hidden={hidden}
                >
                  <div className="kd-ad-default-copy">
                    <span className="kd-ad-kicker">{slide.kicker}</span>
                    <h3>{slide.title}</h3>
                    <p>{slide.text}</p>

                    <ActionLink
                      to={slide.to}
                      className="kd-ad-cta"
                    >
                      {slide.cta}
                      <ArrowRight size={16} />
                    </ActionLink>
                  </div>
                </div>
              );
            }

            const picture = (
              <>
                <img
                  src={slide.imageUrl}
                  alt={slide.title || "KisanDirect advertisement"}
                  className="kd-ad-image"
                  loading={i === 0 ? "eager" : "lazy"}
                  draggable="false"
                />

                {slide.title && (
                  <div className="kd-ad-caption">
                    <Megaphone size={15} />
                    <span>{slide.title}</span>
                  </div>
                )}
              </>
            );

            return (
              <div
                className="kd-ad-slide"
                key={slide.id}
                aria-hidden={hidden}
              >
                {slide.linkUrl ? (
                  <a
                    href={slide.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="kd-ad-link"
                    tabIndex={hidden ? -1 : 0}
                  >
                    {picture}
                  </a>
                ) : (
                  picture
                )}
              </div>
            );
          })}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              className="kd-ad-arrow kd-ad-prev"
              onClick={() => go(index - 1)}
              aria-label="Previous advertisement"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              className="kd-ad-arrow kd-ad-next"
              onClick={() => go(index + 1)}
              aria-label="Next advertisement"
            >
              <ChevronRight size={20} />
            </button>

            <div className="kd-ad-dots" role="tablist">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Go to slide ${i + 1}`}
                  className={i === index ? "active" : ""}
                  onClick={() => go(i)}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </section>
  );
}
