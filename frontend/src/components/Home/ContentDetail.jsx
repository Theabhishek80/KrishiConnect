import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import api from "../../api";

export default function ContentDetail({ type }) {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [state, setState] = useState("loading");
  const endpoint = type === "blog" ? "/blogs" : "/recipes";

  useEffect(() => {
    setState("loading");
    api
      .get(`${endpoint}/${id}`)
      .then(r => { setItem(r.data); setState("ready"); })
      .catch(() => setState("error"));
  }, [endpoint, id]);

  const body = item?.content || item?.body || item?.description || "";
  const image = item?.imageUrl || item?.image;

  return (
    <section className="page-section kd-detail">
      <Link to="/" className="kd-back"><ChevronLeft size={16} /> Back to home</Link>
      {state === "loading" && <div className="empty-state"><p>Loading…</p></div>}
      {state === "error" && (
        <div className="empty-state">
          <h3>Not found</h3>
          <p>This {type === "blog" ? "article" : "recipe"} isn't available right now.</p>
        </div>
      )}
      {state === "ready" && item && (
        <article className="panel kd-detail-card">
          {image && <img src={image} alt={item.title || item.name} className="kd-detail-img" />}
          <h1>{item.title || item.name}</h1>
          {Array.isArray(item.ingredients) && item.ingredients.length > 0 && (
            <ul>{item.ingredients.map((x, i) => <li key={i}>{String(x)}</li>)}</ul>
          )}
          <div className="kd-detail-text">{body}</div>
        </article>
      )}
    </section>
  );
}
