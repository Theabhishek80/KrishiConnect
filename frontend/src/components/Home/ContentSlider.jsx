import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Clock, UtensilsCrossed } from "lucide-react";
import api from "../../api";
import Carousel from "../Carousel/Carousel";

const CONFIG = {
  blog: {
    endpoint: "/blogs",
    basePath: "/blog",
    kicker: "FROM THE FIELD",
    title: "Farming stories & guides",
    cta: "Read more",
    emptyTitle: "No articles yet",
    emptyText: "Farm stories and growing tips will show up here once published.",
    Icon: BookOpen
  },
  recipe: {
    endpoint: "/recipes",
    basePath: "/recipe",
    kicker: "FROM THE KITCHEN",
    title: "Cook with fresh produce",
    cta: "View recipe",
    emptyTitle: "No recipes yet",
    emptyText: "Seasonal recipes made with farm produce will show up here.",
    Icon: UtensilsCrossed
  }
};

const pick = (item, keys) => {
  for (const k of keys) if (item?.[k]) return item[k];
  return "";
};

const formatDate = value => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

function ContentCard({ item, type }) {
  const cfg = CONFIG[type];
  const [broken, setBroken] = useState(false);

  const image = pick(item, ["imageUrl", "image", "coverImage", "thumbnail"]);
  const title = pick(item, ["title", "name"]);
  const text = pick(item, ["excerpt", "summary", "description", "shortDescription"]);
  const category = typeof item.category === "object" ? item.category?.name : item.category;
  const meta =
    type === "blog"
      ? formatDate(item.publishedAt || item.createdAt || item.date)
      : pick(item, ["totalTime", "cookTime", "time", "duration"]);
  const external = pick(item, ["linkUrl", "url", "link"]);
  const to = `${cfg.basePath}/${item.slug || item.id}`;

  const button = external ? (
    <a className="kd-card-cta" href={external} target="_blank" rel="noreferrer noopener">
      {cfg.cta} <ArrowRight size={15} />
    </a>
  ) : (
    <Link className="kd-card-cta" to={to}>
      {cfg.cta} <ArrowRight size={15} />
    </Link>
  );

  return (
    <article className="kd-content-card">
      <div className="kd-content-media">
        {image && !broken ? (
          <img src={image} alt={title} loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <div className="kd-content-placeholder" aria-hidden="true">
            <cfg.Icon size={34} />
          </div>
        )}
        {category && <span className="kd-content-tag">{category}</span>}
      </div>
      <div className="kd-content-body">
        {meta && (
          <span className="kd-content-meta">
            {type === "recipe" && <Clock size={13} />}
            {meta}
          </span>
        )}
        <h3>{title}</h3>
        {text && <p>{text}</p>}
        {button}
      </div>
    </article>
  );
}

export default function ContentSlider({ type }) {
  const cfg = CONFIG[type];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .get(cfg.endpoint, { params: { page: 0, size: 12 } })
      .then(r => {
        if (!mounted) return;
        const raw = r.data;
        setItems(Array.isArray(raw) ? raw : raw?.content || []);
      })
      .catch(() => {
        if (mounted) {
          setItems([]);
          setFailed(true);
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [cfg.endpoint]);

  return (
    <section className="kd-content-section" aria-label={cfg.title}>
      <div className="sectionhead modern-head">
        <div>
          <span className="section-kicker">{cfg.kicker}</span>
          <h2>{cfg.title}</h2>
        </div>
      </div>

      {loading ? (
        <div className="kd-content-skeletons">
          {[1, 2, 3].map(i => (
            <div className="skeleton-card" key={i}>
              <div className="skeleton image" />
              <div className="skeleton line" />
              <div className="skeleton short" />
            </div>
          ))}
        </div>
      ) : items.length ? (
        <Carousel variant="cards" label={cfg.title}>
          {items.map((item, i) => (
            <ContentCard item={item} type={type} key={item.id ?? i} />
          ))}
        </Carousel>
      ) : (
        <div className="empty-state kd-content-empty">
          <cfg.Icon size={34} />
          <h3>{failed ? "Couldn't load this section" : cfg.emptyTitle}</h3>
          <p>{failed ? "Please check your connection and refresh the page." : cfg.emptyText}</p>
        </div>
      )}
    </section>
  );
}
