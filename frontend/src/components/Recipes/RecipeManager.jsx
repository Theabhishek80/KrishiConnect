import React, { useEffect, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  ImagePlus,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import api from "../../api";
import { clearRecipeCache } from "../../services/recipeService";

const EMPTY_FORM = {
  title: "",
  excerpt: "",
  category: "Main Course",
  readTime: "",
  serves: "",
  level: "Easy",
  emoji: "🍲",
  ingredients: "",
  steps: "",
  published: true,
};

const errorText = (error, fallback) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  fallback;

export default function RecipeManager() {
  const [recipes, setRecipes] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [file, setFile] = useState(null);

  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInput = useRef(null);
  const formTop = useRef(null);

  // -----------------------------------------
  // LOAD RECIPES
  // -----------------------------------------
  const load = async () => {
    try {
      setError("");

      const { data } = await api.get("/admin/recipes");

      setRecipes(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(
        errorText(e, "Could not load recipes.")
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  // -----------------------------------------
  // FORM HELPER
  // -----------------------------------------
  const set = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // -----------------------------------------
  // RESET FORM
  // -----------------------------------------
  const reset = () => {
    setForm(EMPTY_FORM);

    setEditingId(null);
    setExistingImage("");
    setRemoveImage(false);
    setFile(null);

    if (fileInput.current) {
      fileInput.current.value = "";
    }
  };

  // -----------------------------------------
  // START EDIT
  // -----------------------------------------
  const startEdit = (recipe) => {
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
      level: recipe.level || "Easy",
      emoji: recipe.emoji || "🍲",
      ingredients: Array.isArray(recipe.ingredients)
        ? recipe.ingredients.join("\n")
        : "",
      steps: Array.isArray(recipe.steps)
        ? recipe.steps.join("\n")
        : "",
      published: Boolean(recipe.published),
    });

    if (fileInput.current) {
      fileInput.current.value = "";
    }

    requestAnimationFrame(() => {
      formTop.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  // -----------------------------------------
  // SUBMIT / CREATE / UPDATE
  // -----------------------------------------
  const submit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.title.trim()) {
      setError("Please enter a recipe title.");
      return;
    }

    if (!form.ingredients.trim()) {
      setError(
        "Add at least one ingredient (one per line)."
      );
      return;
    }

    if (!form.steps.trim()) {
      setError(
        "Add at least one step (one per line)."
      );
      return;
    }

    if (file && file.size > 5 * 1024 * 1024) {
      setError("Recipe image must be 5 MB or less.");
      return;
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
      data.append(
        "emoji",
        form.emoji.trim() || "🍲"
      );
      data.append("ingredients", form.ingredients);
      data.append("steps", form.steps);
      data.append(
        "published",
        String(form.published)
      );

      if (file) {
        data.append("image", file);
      }

      if (editingId) {
        data.append(
          "removeImage",
          String(removeImage)
        );

        await api.put(
          `/admin/recipes/${editingId}`,
          data
        );

        setMessage("Recipe updated successfully.");
      } else {
        await api.post(
          "/admin/recipes",
          data
        );

        setMessage(
          "Recipe published successfully."
        );
      }

      clearRecipeCache();

      reset();

      await load();
    } catch (e) {
      setError(
        errorText(
          e,
          editingId
            ? "Could not update the recipe."
            : "Could not publish the recipe."
        )
      );
    } finally {
      setBusy(false);
    }
  };

  // -----------------------------------------
  // HIDE / SHOW
  // -----------------------------------------
  const toggle = async (id) => {
    setError("");
    setMessage("");
    setTogglingId(id);

    try {
      await api.patch(
        `/admin/recipes/${id}/toggle`
      );

      clearRecipeCache();

      await load();

      setMessage(
        "Recipe visibility updated successfully."
      );
    } catch (e) {
      setError(
        errorText(
          e,
          "Could not change recipe visibility."
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  // -----------------------------------------
  // DELETE
  // No browser confirmation alert
  // -----------------------------------------
  const remove = async (recipe) => {
    setError("");
    setMessage("");
    setDeletingId(recipe.id);

    try {
      await api.delete(
        `/admin/recipes/${recipe.id}`
      );

      clearRecipeCache();

      if (editingId === recipe.id) {
        reset();
      }

      await load();

      setMessage(
        "Recipe deleted successfully."
      );
    } catch (e) {
      setError(
        errorText(
          e,
          "Could not delete the recipe."
        )
      );
    } finally {
      setDeletingId(null);
    }
  };

  // -----------------------------------------
  // CURRENT IMAGE REMOVE / KEEP
  // -----------------------------------------
  const toggleRemoveImage = () => {
    setRemoveImage((current) => !current);
  };

  // -----------------------------------------
  // FILE SELECT
  // -----------------------------------------
  const handleFileChange = (event) => {
    const selectedFile =
      event.target.files?.[0] || null;

    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setFile(null);
        setError(
          "Recipe image must be 5 MB or less."
        );

        if (fileInput.current) {
          fileInput.current.value = "";
        }

        return;
      }

      if (!selectedFile.type.startsWith("image/")) {
        setFile(null);
        setError(
          "Please select a valid image file."
        );

        if (fileInput.current) {
          fileInput.current.value = "";
        }

        return;
      }
    }

    setError("");
    setFile(selectedFile);
    setRemoveImage(false);
  };

  return (
    <section className="kd-recipe-admin panel">

      {/* -----------------------------------------
          HEADER
      ----------------------------------------- */}
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
            Recipes you post here show up on the
            home page slider and on the Recipes page
            straight away.
          </p>
        </div>

        <span>
          {recipes.length} total
        </span>
      </div>

      {/* -----------------------------------------
          MESSAGES
      ----------------------------------------- */}
      {error && (
        <div
          className="notice error"
          role="alert"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          className="notice success"
          role="status"
        >
          {message}
        </div>
      )}

      {/* -----------------------------------------
          RECIPE FORM
      ----------------------------------------- */}
      <form
        className="kd-recipe-form"
        onSubmit={submit}
      >

        <div className="kd-recipe-grid">

          {/* TITLE */}
          <label className="kd-recipe-wide">
            Title

            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                set(
                  "title",
                  event.target.value
                )
              }
              placeholder="e.g. Palak Paneer"
              maxLength={160}
              required
            />
          </label>

          {/* DESCRIPTION */}
          <label className="kd-recipe-wide">
            Short description{" "}
            <span>optional</span>

            <input
              type="text"
              value={form.excerpt}
              onChange={(event) =>
                set(
                  "excerpt",
                  event.target.value
                )
              }
              placeholder="One line shown on the recipe card"
              maxLength={500}
            />
          </label>

          {/* CATEGORY */}
          <label>
            Category

            <input
              type="text"
              value={form.category}
              onChange={(event) =>
                set(
                  "category",
                  event.target.value
                )
              }
              placeholder="Main Course"
              maxLength={60}
            />
          </label>

          {/* TIME */}
          <label>
            Time

            <input
              type="text"
              value={form.readTime}
              onChange={(event) =>
                set(
                  "readTime",
                  event.target.value
                )
              }
              placeholder="30 min"
              maxLength={40}
            />
          </label>

          {/* SERVES */}
          <label>
            Serves

            <input
              type="text"
              value={form.serves}
              onChange={(event) =>
                set(
                  "serves",
                  event.target.value
                )
              }
              placeholder="4 servings"
              maxLength={40}
            />
          </label>

          {/* LEVEL */}
          <label>
            Level

            <select
              value={form.level}
              onChange={(event) =>
                set(
                  "level",
                  event.target.value
                )
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

          {/* EMOJI */}
          <label>
            Emoji{" "}
            <span>
              used if there is no photo
            </span>

            <input
              type="text"
              value={form.emoji}
              onChange={(event) =>
                set(
                  "emoji",
                  event.target.value
                )
              }
              maxLength={8}
            />
          </label>

          {/* IMAGE */}
          <label className="kd-recipe-photo">
            <ImagePlus size={18} />

            <strong>
              {file
                ? file.name
                : existingImage &&
                    !removeImage
                  ? "Replace photo"
                  : "Add photo (optional)"}
            </strong>

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>

        </div>

        {/* -----------------------------------------
            CURRENT IMAGE
        ----------------------------------------- */}
        {editingId &&
          existingImage &&
          !file && (
            <div className="kd-recipe-current-photo">

              {!removeImage && (
                <img
                  src={existingImage}
                  alt="Current recipe"
                />
              )}

              <button
                type="button"
                className="secondary-btn"
                onClick={toggleRemoveImage}
                disabled={busy}
              >
                {removeImage
                  ? "Keep current photo"
                  : "Remove photo"}
              </button>

            </div>
          )}

        {/* -----------------------------------------
            INGREDIENTS
        ----------------------------------------- */}
        <label>
          Ingredients{" "}
          <span>one per line</span>

          <textarea
            rows={7}
            value={form.ingredients}
            onChange={(event) =>
              set(
                "ingredients",
                event.target.value
              )
            }
            placeholder={
              "2 medium potatoes, cubed\n1 onion, chopped\nSalt to taste"
            }
            required
          />
        </label>

        {/* -----------------------------------------
            METHOD
        ----------------------------------------- */}
        <label>
          Method{" "}
          <span>one step per line</span>

          <textarea
            rows={7}
            value={form.steps}
            onChange={(event) =>
              set(
                "steps",
                event.target.value
              )
            }
            placeholder={
              "Heat oil and add cumin seeds.\nAdd the onion and cook until golden."
            }
            required
          />
        </label>

        {/* -----------------------------------------
            PUBLISHED
        ----------------------------------------- */}
        <label className="kd-ad-checkbox">

          <input
            type="checkbox"
            checked={form.published}
            onChange={(event) =>
              set(
                "published",
                event.target.checked
              )
            }
          />

          Visible on the website

        </label>

        {/* -----------------------------------------
            FORM ACTIONS
        ----------------------------------------- */}
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

      {/* -----------------------------------------
          RECIPE LIST
      ----------------------------------------- */}
      <div className="kd-recipe-list">

        {!recipes.length ? (
          <div className="empty-inline">
            No recipes yet.
          </div>
        ) : (
          recipes.map((recipe) => (
            <article
              className="kd-recipe-row"
              key={recipe.id}
            >

              {/* IMAGE */}
              {recipe.imageUrl ? (
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  loading="lazy"
                />
              ) : (
                <span
                  className="kd-recipe-row-emoji"
                  aria-hidden="true"
                >
                  {recipe.emoji || "🍲"}
                </span>
              )}

              {/* INFO */}
              <div className="kd-recipe-row-info">

                <strong>
                  {recipe.title}
                </strong>

                <span>
                  {recipe.category || "Recipe"}

                  {recipe.readTime
                    ? ` · ${recipe.readTime}`
                    : ""}

                  {" · "}

                  {recipe.published
                    ? "Visible"
                    : "Hidden"}
                </span>

              </div>

              {/* ACTIONS */}
              <div className="kd-recipe-row-actions">

                {/* EDIT */}
                <button
                  type="button"
                  onClick={() =>
                    startEdit(recipe)
                  }
                  title="Edit recipe"
                  disabled={
                    busy ||
                    deletingId !== null ||
                    togglingId !== null
                  }
                >
                  <Pencil size={16} />
                  Edit
                </button>

                {/* HIDE / SHOW */}
                <button
                  type="button"
                  onClick={() =>
                    toggle(recipe.id)
                  }
                  title={
                    recipe.published
                      ? "Hide recipe"
                      : "Show recipe"
                  }
                  disabled={
                    busy ||
                    deletingId !== null ||
                    togglingId !== null
                  }
                >
                  {togglingId === recipe.id ? (
                    "Updating…"
                  ) : (
                    <>
                      {recipe.published ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}

                      {recipe.published
                        ? "Hide"
                        : "Show"}
                    </>
                  )}
                </button>

                {/* DELETE */}
                <button
                  type="button"
                  className="danger"
                  onClick={() =>
                    remove(recipe)
                  }
                  title="Delete recipe"
                  disabled={
                    busy ||
                    deletingId !== null ||
                    togglingId !== null
                  }
                >
                  {deletingId === recipe.id ? (
                    "Deleting…"
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete
                    </>
                  )}
                </button>

              </div>

            </article>
          ))
        )}

      </div>

    </section>
  );
}
