import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Scroll-snap carousel. Native horizontal scrolling (touch friendly) with
 * arrows, pagination dots and optional autoplay. Cards per view is controlled
 * by CSS (see .kd-carousel in ui-upgrade.css) via the `variant` prop.
 */
export default function Carousel({
  children,
  variant = "cards",
  autoplay = 0,
  label = "Carousel"
}) {
  const trackRef = useRef(null);
  const pausedRef = useRef(false);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const totalPages = el.clientWidth
      ? Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth - 0.05))
      : 1;
    setPages(totalPages);
    setPage(
      max <= 0 ? 0 : Math.round((el.scrollLeft / max) * (totalPages - 1))
    );
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure, children]);

  const scrollByPage = direction => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  };

  const goToPage = index => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({
      left: pages > 1 ? (max * index) / (pages - 1) : 0,
      behavior: "smooth"
    });
  };

  useEffect(() => {
    if (!autoplay || pages <= 1) return undefined;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (reduce?.matches) return undefined;
    const timer = window.setInterval(() => {
      const el = trackRef.current;
      if (!el || pausedRef.current || document.hidden) return;
      const max = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= max - 2) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
      }
    }, autoplay);
    return () => window.clearInterval(timer);
  }, [autoplay, pages]);

  const pause = () => { pausedRef.current = true; };
  const resume = () => { pausedRef.current = false; };

  return (
    <div
      className={`kd-carousel kd-carousel-${variant}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      onTouchStart={pause}
      onTouchEnd={() => window.setTimeout(resume, 4000)}
    >
      <div className="kd-carousel-track" ref={trackRef}>
        {React.Children.map(children, child => (
          <div className="kd-carousel-item">{child}</div>
        ))}
      </div>

      {pages > 1 && (
        <>
          <button
            type="button"
            className="kd-carousel-arrow kd-carousel-prev"
            onClick={() => scrollByPage(-1)}
            disabled={edges.start}
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="kd-carousel-arrow kd-carousel-next"
            onClick={() => scrollByPage(1)}
            disabled={edges.end}
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>

          <div className="kd-carousel-dots" role="tablist">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === page}
                aria-label={`Go to slide ${i + 1}`}
                className={i === page ? "active" : ""}
                onClick={() => goToPage(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
