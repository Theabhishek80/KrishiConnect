import React, { useEffect, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  ImagePlus,
  Pencil,
  Plus,
  Save,
  Trash2,
  X
} from "lucide-react";

import api from "../../api";
import { clearRecipeCache } from "../../services/recipeService";

const EMPTY = {
  title: "",
  excerpt: "",
  category: "Main Course",
  readTime: "",
  serves: "",
  level: "Easy",
  emoji: "🍲",
  ingredients: "",
  steps: "",
  published: true
};

const errorText = (e, fallback) =>
  e?.response?.data?.error ||
  e?.response?.data?.message ||
  fallback;

export default function RecipeManager() {
  const [recipes, setRecipes] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInput = useRef(null);
  const formTop = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get("/admin/recipes");
      setRecipes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(errorText(e, "Could not load recipes."));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key, value) =>
    setForm(f => ({ ...f, [key]: value }));

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
    setExistingImage("");
    setRemoveImage(false);
    setFile(null);

    if (fileInput.current) {
      fileInput.current.value = "";
    }
  };

  const startEdit = recipe => {
    setEditingId(recipe.id);
    setExistingImage(recipe.imageUrl || "");
    setRemoveImage(false);
    setFile(null);
    setMessage("");
    setError("");

    setForm({
      title: recipe.title || "",
      excerpt: recipe.excerpt || "",
      category: recipe.category || "",
      readTime: recipe.readTime || "",
      serves: recipe.serves || "",
      level: recipe.level || "",
      emoji: recipe.emoji || "🍲",
      ingredients: (recipe.ingredients || []).join("\n"),
      steps: (recipe.steps || []).join("\n"),
      published: recipe.published
    });

    formTop.current?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  const submit = async event => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.title.trim()) {
      return setError("Please enter a recipe title.");
    }

    if (!form.ingredients.trim()) {
      return setError("Add at least one ingredient (one per line).");
    }

    if (!form.steps.trim()) {
      return setError("Add at least one step (one per line).");
    }

    if (file && file.size > 5 * 1024 * 1024) {
      return setError("Recipe image must be 5 MB or less.");
    }

    setBusy(true);

    try {
      const data = new FormData();

      data.append("title", form.title.trim());
      data.append("excerpt", form.excerpt.trim());
      data.append("category", form.category.trim());
      data.append("readTime", form.readTime.trim());
      data.append("serves", form.serves.trim());
      data.append("level", form.level.trim());
      data.append("emoji", form.emoji.trim() || "🍲");
      data.append("ingredients", form.ingredients);
      data.append("steps", form.steps);
      data.append("published", String(form.published));

      if (file) {
        data.append("image", file);
      }

      if (editingId) {
        data.append("removeImage", String(removeImage));

        await api.put(`/admin/recipes/${editingId}`, data);

        setMessage("Recipe updated.");
      } else {
        await api.post("/admin/recipes", data);

        setMessage(
          "Recipe published. It now appears on the website."
        );
      }

      clearRecipeCache();
      reset();
      await load();

    } catch (e) {
      setError(
        errorText(e, "Could not save the recipe.")
      );

    } finally {
      setBusy(false);
    }
  };

  const toggle = async id => {
    setError("");

    try {
      await api.patch(`/admin/recipes/${id}/toggle`);

      clearRecipeCache();
      await load();

    } catch (e) {
      setError(
        errorText(e, "Could not change visibility.")
      );
    }
  };

  /*
   * DELETE RECIPE
   * No browser confirmation alert.
   * Clicking Delete immediately sends the delete request.
   */
  const remove = async recipe => {
    setError("");
    setMessage("");

    try {
      await api.delete(`/admin/recipes/${recipe.id}`);

      clearRecipeCache();

      if (editingId === recipe.id) {
        reset();
      }

      await load();

      setMessage("Recipe deleted successfully.");

    } catch (e) {
      setError(
        errorText(e, "Could not delete the recipe.")
      );
    }
  };

  return (
    <section className="kd-recipe-admin panel">

      <div
        className="sectionhead"
        ref={formTop}
      >
        <div>
          <span className="section-kicker">
            CONTENT CONTROL
          </span>

          <h2>
            {editingId
              ? "Edit recipe"
              : "Post a new recipe"}
          </h2>

          <p>
            Recipes you post here show up on the home page
            slider and on the Recipes page straight away.
          </p>
        </div>

        <span>
          {recipes.length} total
        </span>
      </div>

      {error && (
        <div className="notice error">
          {error}
        </div>
      )}

      {message && (
        <div className="notice success">
          {message}
        </div>
      )}

      <form
        className="kd-recipe-form"
        onSubmit={submit}
      >

        <div className="kd-recipe-grid">

          <label className="kd-recipe-wide">
            Title

            <input
              value={form.title}
              onChange={e =>
                set("title", e.target.value)
              }
              placeholder="e.g. Palak Paneer"
              maxLength={160}
              required
            />
          </label>

          <label className="kd-recipe-wide">
            Short description{" "}
            <span>optional</span>

            <input
              value={form.excerpt}
              onChange={e =>
                set("excerpt", e.target.value)
              }
              placeholder="One line shown on the recipe card"
              maxLength={500}
            />
          </label>

          <label>
            Category

            <input
              value={form.category}
              onChange={e =>
                set("category", e.target.value)
              }
              placeholder="Main Course"
              maxLength={60}
            />
          </label>

          <label>
            Time

            <input
              value={form.readTime}
              onChange={e =>
                set("readTime", e.target.value)
              }
              placeholder="30 min"
              maxLength={40}
            />
          </label>

          <label>
            Serves

            <input
              value={form.serves}
              onChange={e =>
                set("serves", e.target.value)
              }
              placeholder="4 servings"
              maxLength={40}
            />
          </label>

          <label>
            Level

            <select
              value={form.level}
              onChange={e =>
                set("level", e.target.value)
              }
            >
              <option value="Easy">
                Easy
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="Hard">
                Hard
              </option>
            </select>
          </label>

          <label>
            Emoji{" "}
            <span>
              used if there is no photo
            </span>

            <input
              value={form.emoji}
              onChange={e =>
                set("emoji", e.target.value)
              }
              maxLength={8}
            />
          </label>

          <label className="kd-recipe-photo">
            <ImagePlus size={18} />

            <strong>
              {file
                ? file.name
                : existingImage && !removeImage
                  ? "Replace photo"
                  : "Add photo (optional)"}
            </strong>

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={e => {
                setFile(
                  e.target.files?.[0] || null
                );

                setRemoveImage(false);
              }}
            />
          </label>

        </div>

        {editingId &&
          existingImage &&
          !file && (
            <div className="kd-recipe-current-photo">

              {!removeImage && (
                <img
                  src={existingImage}
                  alt="Current"
                />
              )}

              <button
                type="button"
                className="secondary-btn"
                onClick={() =>
                  setRemoveImage(v => !v)
                }
              >
                {removeImage
                  ? "Keep current photo"
                  : "Remove photo"}
              </button>

            </div>
          )}

        <label>
          Ingredients{" "}
          <span>one per line</span>

          <textarea
            rows={7}
            value={form.ingredients}
            onChange={e =>
              set("ingredients", e.target.value)
            }
            placeholder={
              "2 medium potatoes, cubed\n1 onion, chopped\nSalt to taste"
            }
            required
          />
        </label>

        <label>
          Method{" "}
          <span>one step per line</span>

          <textarea
            rows={7}
            value={form.steps}
            onChange={e =>
              set("steps", e.target.value)
            }
            placeholder={
              "Heat oil and add cumin seeds.\nAdd the onion and cook until golden."
            }
            required
          />
        </label>

        <label className="kd-ad-checkbox">
          <input
            type="checkbox"
            checked={form.published}
            onChange={e =>
              set(
                "published",
                e.target.checked
              )
            }
          />

          Visible on the website
        </label>

        <div className="kd-recipe-actions">

          <button
            className="primary-btn"
            type="submit"
            disabled={busy}
          >
            {editingId ? (
              <Save size={17} />
            ) : (
              <Plus size={17} />
            )}

            {busy
              ? "Saving…"
              : editingId
                ? "Save changes"
                : "Publish recipe"}
          </button>

          {editingId && (
            <button
              type="button"
              className="secondary-btn"
              onClick={reset}
              disabled={busy}
            >
              <X size={16} />
              Cancel edit
            </button>
          )}

        </div>

      </form>

      <div className="kd-recipe-list">

        {!recipes.length ? (
          <div className="empty-inline">
            No recipes yet.
          </div>
        ) : (
          recipes.map(recipe => (
            <article
              className="kd-recipe-row"
              key={recipe.id}
            >

              {recipe.imageUrl ? (
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                />
              ) : (
                <span
                  className="kd-recipe-row-emoji"
                  aria-hidden="true"
                >
                  {recipe.emoji}
                </span>
              )}

              <div className="kd-recipe-row-info">

                <strong>
                  {recipe.title}
                </strong>

                <span>
                  {recipe.category}

                  {recipe.readTime
                    ? ` · ${recipe.readTime}`
                    : ""}

                  {" · "}

                  {recipe.published
                    ? "Visible"
                    : "Hidden"}
                </span>

              </div>

              <div className="kd-recipe-row-actions">

                <button
                  type="button"
                  onClick={() =>
                    startEdit(recipe)
                  }
                  title="Edit"
                >
                  <Pencil size={16} />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    toggle(recipe.id)
                  }
                  title={
                    recipe.published
                      ? "Hide"
                      : "Show"
                  }
                >
                  {recipe.published ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}

                  {recipe.published
                    ? "Hide"
                    : "Show"}
                </button>

                <button
                  type="button"
                  className="danger"
                  onClick={() =>
                    remove(recipe)
                  }
                  title="Delete"
                >
                  <Trash2 size={16} />
                  Delete
                </button>

              </div>

            </article>
          ))
        )}

      </div>

    </section>
  );
}

      </div>

    </section>
  );
}
