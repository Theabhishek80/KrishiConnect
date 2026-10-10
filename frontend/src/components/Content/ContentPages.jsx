import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChefHat,
  Clock,
  BookOpen,
  Users,
  Gauge
} from "lucide-react";

import { useBlog, useBlogs } from "../../hooks/useBlogs";
import { useRecipe, useRecipes } from "../../hooks/useRecipes";
import "../../styles/blog.css";

/* =========================
   LIST PAGES  (/blog , /recipes)
========================= */

export function ContentList({ kind }) {
  const isRecipe = kind === "recipe";
  const recipeData = useRecipes(isRecipe);
  const blogData = useBlogs(!isRecipe);
  const items = isRecipe ? recipeData.items : blogData.items;
  const loading = isRecipe ? recipeData.loading : blogData.loading;
  const base = isRecipe ? "/recipes" : "/blog";

  return (
    <section className="page-section kd-content-page">

      <div className="page-heading">
        <div>
          <span className="section-kicker">
            {isRecipe ? "FARM TO KITCHEN" : "KISANDIRECT BLOG"}
          </span>
          <h1>
            {isRecipe
              ? "Fresh recipes for every meal."
              : "Stories, tips and farming knowledge."}
          </h1>
        </div>

        <Link to="/">
          <ArrowLeft size={16} /> Back home
        </Link>
      </div>

      {loading && (
        <div className="empty-inline">
          {isRecipe ? "Loading recipes…" : "Loading articles…"}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <h3>{isRecipe ? "No recipes yet" : "No articles yet"}</h3>
          <p>
            {isRecipe
              ? "New recipes will appear here soon."
              : "New articles will appear here soon."}
          </p>
        </div>
      )}

      <div className="kd-grid">
        {items.map(item => (
          <Link
            key={item.slug}
            to={`${base}/${item.slug}`}
            className="kd-card"
          >
            <div className={`kd-card-art tone-${item.tone}`}>
              {item.imageUrl ? (
                <img
                  className="kd-card-img"
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                />
              ) : (
                <span className="kd-card-emoji" aria-hidden="true">
                  {item.emoji}
                </span>
              )}
              <span className="kd-card-tag">{item.category}</span>
            </div>

            <div className="kd-card-body">
              <h3>{item.title}</h3>
              <p>{item.excerpt}</p>

              <div className="kd-card-meta">
                <span><Clock size={14} />{item.readTime}</span>
                {isRecipe && <span><Users size={14} />{item.serves}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>

    </section>
  );
}

/* =========================
   DETAIL PAGES  (/blog/:slug , /recipes/:slug)
========================= */

function NotFound({ backTo, label }) {
  return (
    <section className="page-section">
      <div className="empty-state">
        <h3>We couldn't find that {label}</h3>
        <p>It may have been moved or removed.</p>
        <Link className="primary-btn" to={backTo}>
          Browse all
        </Link>
      </div>
    </section>
  );
}

function BodyLine({ text }) {
  if (text.startsWith("## ")) {
    return <h2>{text.slice(3).trim()}</h2>;
  }

  return <p>{text}</p>;
}

export function BlogDetail() {
  const { slug } = useParams();
  const { blog: post, loading } = useBlog(slug);

  if (loading) {
    return (
      <section className="page-section">
        <div className="empty-inline">Loading article…</div>
      </section>
    );
  }

  if (!post) return <NotFound backTo="/blog" label="article" />;

  return (
    <article className="page-section kd-article">

      <Link className="kd-back" to="/blog">
        <ArrowLeft size={16} /> All articles
      </Link>

      <div className={`kd-article-hero tone-${post.tone}${post.imageUrl ? " has-image" : ""}`}>
        {post.imageUrl ? (
          <img className="kd-article-img" src={post.imageUrl} alt={post.title} />
        ) : (
          <span className="kd-article-emoji" aria-hidden="true">{post.emoji}</span>
        )}
      </div>

      <div className="kd-article-head">
        <span className="kd-card-tag solid">{post.category}</span>
        <h1>{post.title}</h1>
        <div className="kd-article-meta">
          <span><BookOpen size={15} />{post.readTime}</span>
        </div>
      </div>

      <div className="kd-article-body">
        {(post.body || []).map((line, i) => (
          <BodyLine key={i} text={line} />
        ))}
      </div>

    </article>
  );
}

export function RecipeDetail() {
  const { slug } = useParams();
  const { recipe, loading } = useRecipe(slug);

  if (loading) {
    return (
      <section className="page-section">
        <div className="empty-inline">Loading recipe…</div>
      </section>
    );
  }

  if (!recipe) return <NotFound backTo="/recipes" label="recipe" />;

  return (
    <article className="page-section kd-article">

      <Link className="kd-back" to="/recipes">
        <ArrowLeft size={16} /> All recipes
      </Link>

      <div className={`kd-article-hero tone-${recipe.tone}${recipe.imageUrl ? " has-image" : ""}`}>
        {recipe.imageUrl ? (
          <img className="kd-article-img" src={recipe.imageUrl} alt={recipe.title} />
        ) : (
          <span className="kd-article-emoji" aria-hidden="true">{recipe.emoji}</span>
        )}
      </div>

      <div className="kd-article-head">
        <span className="kd-card-tag solid">{recipe.category}</span>
        <h1>{recipe.title}</h1>
        <p className="kd-article-lead">{recipe.excerpt}</p>

        <div className="kd-article-meta">
          {recipe.readTime && <span><Clock size={15} />{recipe.readTime}</span>}
          {recipe.serves && <span><Users size={15} />{recipe.serves}</span>}
          {recipe.level && <span><Gauge size={15} />{recipe.level}</span>}
        </div>
      </div>

      <div className="kd-recipe-layout">

        <aside className="kd-recipe-box">
          <h2><ChefHat size={18} /> Ingredients</h2>
          <ul>
            {recipe.ingredients.map((ingredient, i) => (
              <li key={i}>{ingredient}</li>
            ))}
          </ul>
        </aside>

        <div className="kd-recipe-box">
          <h2>Method</h2>
          <ol className="kd-steps">
            {recipe.steps.map((step, i) => (
              <li key={i}>
                <span>{i + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </div>

      </div>

    </article>
  );
}
