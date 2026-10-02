import React, { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import api from "../../api";
import Carousel from "../Carousel/Carousel";

function AdSlide({ ad }) {
  const [broken, setBroken] = useState(false);

  const inner = (
    <div className="kd-ad-slide">
      {broken || !ad.imageUrl ? (
        <div className="kd-ad-fallback" aria-hidden="true">
          <Megaphone size={34} />
        </div>
      ) : (
        <img
          src={ad.imageUrl}
          alt={ad.title || "KisanDirect advertisement"}
          className="kd-ad-image"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      )}
      {ad.title && (
        <div className="kd-ad-caption">
          <Megaphone size={15} />
          <span>{ad.title}</span>
        </div>
      )}
    </div>
  );

  return ad.linkUrl ? (
    <a
      href={ad.linkUrl}
      target="_blank"
      rel="noreferrer noopener"
      className="kd-ad-link"
    >
      {inner}
    </a>
  ) : (
    inner
  );
}

export default function AdvertisementSlider() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    api
      .get("/advertisements")
      .then(response => {
        if (!mounted) return;
        const raw = response.data;
        const list = Array.isArray(raw) ? raw : raw?.content || [];
        setAds(list.filter(ad => ad && ad.imageUrl && ad.active !== false));
      })
      .catch(() => mounted && setAds([]))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="kd-ad-section" aria-hidden="true">
        <div className="kd-ad-frame kd-ad-skeleton" />
      </section>
    );
  }

  // No active ads (or API unavailable): render nothing, page layout stays intact.
  if (!ads.length) return null;

  return (
    <section className="kd-ad-section" aria-label="Advertisements">
      <div className="kd-ad-frame">
        <Carousel variant="hero" autoplay={5500} label="Advertisements">
          {ads.map((ad, i) => (
            <AdSlide ad={ad} key={ad.id ?? i} />
          ))}
        </Carousel>
      </div>
    </section>
  );
}
