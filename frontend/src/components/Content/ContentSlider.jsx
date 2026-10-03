import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";

/**
 * Horizontally sliding card row used for the Blog and Recipe sections.
 * - Auto-slides, pauses on hover / touch / keyboard focus
 * - Swipes natively on mobile (scroll-snap)
 * - Arrow buttons on desktop
 */
export default function ContentSlider({
  kind,          // "blog" | "recipe"
  kicker,
  title,
  subtitle,
  items,
  viewAllTo
}) {
  const trackRef = useRef(null);
  const pausedRef = useRef(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const basePath = kind === "recipe" ? "/recipes" : "/blog";

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const step = useCallback(direction => {
    const el = trackRef.current;
    if (!el) return;

    const card = el.querySelector(".kd-card");
    const gap = 18;
    const amount = card ? card.offsetWidth + gap : el.clientWidth * 0.8;

    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;

    if (direction > 0 && atEnd) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      el.scrollBy({ left: direction * amount, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges, items.length]);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;

    if (reduceMotion || items.length < 2) return;

    const timer = window.setInterval(() => {
      if (!pausedRef.current && !document.hidden) step(1);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [items.length, step]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  return (
    <section className="kd-content-section" aria-label={title}>

      <div className="kd-content-head">
        <div>
          <span className="section-kicker">{kicker}</span>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <div className="kd-content-tools">
          <Link className="kd-view-all" to={viewAllTo}>
            View all <ArrowRight size={15} />
          </Link>

          <button
            type="button"
            className="kd-slider-btn"
            onClick={() => step(-1)}
            disabled={!canPrev}
            aria-label="Previous"
          >
            <ChevronLeft size={19} />
          </button>

          <button
            type="button"
            className="kd-slider-btn"
            onClick={() => step(1)}
            disabled={!canNext}
            aria-label="Next"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </div>

      <div
        className="kd-track"
        ref={trackRef}
        onScroll={updateEdges}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={() => window.setTimeout(resume, 2500)}
        onFocus={pause}
        onBlur={resume}
      >
        {items.map(item => (
          <Link
            key={item.slug}
            to={`${basePath}/${item.slug}`}
            className="kd-card"
          >
            <div className={`kd-card-art tone-${item.tone}`}>
              <span className="kd-card-emoji" aria-hidden="true">
                {item.emoji}
              </span>
              <span className="kd-card-tag">{item.category}</span>
            </div>

            <div className="kd-card-body">
              <h3>{item.title}</h3>
              <p>{item.excerpt}</p>

              <div className="kd-card-meta">
                <span>
                  <Clock size={14} />
                  {item.readTime}
                </span>

                {kind === "recipe" && item.serves && (
                  <span>
                    <Users size={14} />
                    {item.serves}
                  </span>
                )}

                <span className="kd-card-go">
                  {kind === "recipe" ? "Cook" : "Read"}
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </section>
  );
}
