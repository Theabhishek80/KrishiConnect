import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
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
import { clearBlogCache } from "../../services/blogService";
import "../../styles/blog.css";

const EMPTY_FORM = {
  title: "",
  excerpt: "",
  category: "Farming Tips",
  readTime: "",
  emoji: "📝",
  body: "",
  published: true,
};

const MAX_IMAGE = 5 * 1024 * 1024;

const errorText = (error, fallback) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  fallback;

export default function BlogManager() {
  const [blogs, setBlogs] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [file, setFile] = useState(null);

  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInput = useRef(null);
  const formTop = useRef(null);

  const working = busy || deletingId !== null || togglingId !== null;

  /* ---------------- load ---------------- */

  const load = async () => {
    try {
      setError("");
      const { data } = await api.get("/admin/blogs");
      setBlogs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(errorText(e, "Could not load blogs."));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const clearFileInput = () => {
    if (fileInput.current) fileInput.current.value = "";
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setExistingImage("");
    setRemoveImage(false);
    setFile(null);
    clearFileInput();
  };

  /* ---------------- edit ---------------- */

  const startEdit = (blog) => {
    setEditingId(blog.id);
    setExistingImage(blog.imageUrl || "");
    setRemoveImage(false);
    setFile(null);
    setConfirmDeleteId(null);
    setMessage("");
    setError("");

    setForm({
      title: blog.title || "",
      excerpt: blog.excerpt || "",
      category: blog.category || "",
      readTime: blog.readTime || "",
      emoji: blog.emoji || "📝",
      body: Array.isArray(blog.body) ? blog.body.join("\n") : "",
      published: Boolean(blog.published),
    });

    clearFileInput();

    requestAnimationFrame(() => {
      formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  /* ---------------- create / update ---------------- */

  const submit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.title.trim()) {
      setError("Please enter a blog title.");
      return;
    }

    if (!form.body.trim()) {
      setError("Write the blog content (one paragraph per line).");
      return;
    }

    if (file && file.size > MAX_IMAGE) {
      setError("Blog image must be 5 MB or less.");
      return;
    }

    setBusy(true);

    try {
      const data = new FormData();

      data.append("title", form.title.trim());
      data.append("excerpt", form.excerpt.trim());
      data.append("category", form.category.trim());
      data.append("readTime", form.readTime.trim());
      data.append("emoji", form.emoji.trim() || "📝");
      data.append("body", form.body);
      data.append("published", String(form.published));

      if (file) {
        data.append("image", file);
      }

      if (editingId) {
        data.append("removeImage", String(removeImage));
        await api.put(`/admin/blogs/${editingId}`, data);
        setMessage("Blog updated successfully.");
      } else {
        await api.post("/admin/blogs", data);
        setMessage("Blog published successfully.");
      }

      clearBlogCache();
      reset();
      await load();
    } catch (e) {
      setError(
        errorText(
          e,
          editingId ? "Could not update the blog." : "Could not publish the blog."
        )
      );
    } finally {
      setBusy(false);
    }
  };

  /* ---------------- hide / show ---------------- */

  const toggle = async (id) => {
    setError("");
    setMessage("");
    setTogglingId(id);

    try {
      await api.patch(`/admin/blogs/${id}/toggle`);
      clearBlogCache();
      await load();
      setMessage("Blog visibility updated successfully.");
    } catch (e) {
      setError(errorText(e, "Could not change blog visibility."));
    } finally {
      setTogglingId(null);
    }
  };

  /* ---------------- delete (asks once, in the row) ---------------- */

  const remove = async (blog) => {
    setError("");
    setMessage("");
    setDeletingId(blog.id);

    try {
      await api.delete(`/admin/blogs/${blog.id}`);

      clearBlogCache();

      if (editingId === blog.id) reset();

      setConfirmDeleteId(null);
      await load();
      setMessage("Blog deleted successfully.");
    } catch (e) {
      setError(errorText(e, "Could not delete the blog."));
    } finally {
      setDeletingId(null);
    }
  };

  /* ---------------- file select ---------------- */

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] || null;

    if (selected) {
      if (selected.size > MAX_IMAGE) {
        setFile(null);
        setError("Blog image must be 5 MB or less.");
        clearFileInput();
        return;
      }

      if (!selected.type.startsWith("image/")) {
        setFile(null);
        setError("Please select a valid image file.");
        clearFileInput();
        return;
      }
    }

    setError("");
    setFile(selected);
    setRemoveImage(false);
  };

  return (
    <section className="kd-recipe-admin panel">

      <div className="sectionhead" ref={formTop}>
        <div>
          <span className="section-kicker">CONTENT CONTROL</span>

          <h2>{editingId ? "Edit blog" : "Write a new blog"}</h2>

          <p>
            Blogs you publish here show up on the home page slider and on the
            Blog page straight away. You can also add a photo to an old blog by
            editing it.
          </p>
        </div>

        <span>{blogs.length} total</span>
      </div>

      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="notice success" role="status">
          {message}
        </div>
      )}

      {/* ---------------- FORM ---------------- */}
      <form className="kd-recipe-form" onSubmit={submit}>

        <div className="kd-recipe-grid">

          <label className="kd-recipe-wide">
            Title
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. 5 simple ways to improve your soil"
              maxLength={160}
              required
            />
          </label>

          <label className="kd-recipe-wide">
            Short description <span>optional</span>
            <input
              type="text"
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="One or two lines shown on the blog card"
              maxLength={500}
            />
          </label>

          <label>
            Category
            <input
              type="text"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="Farming Tips"
              maxLength={60}
            />
          </label>

          <label>
            Reading time <span>optional</span>
            <input
              type="text"
              value={form.readTime}
              onChange={(e) => set("readTime", e.target.value)}
              placeholder="4 min read"
              maxLength={40}
            />
          </label>

          <label>
            Emoji <span>used if there is no photo</span>
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => set("emoji", e.target.value)}
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
              onChange={handleFileChange}
            />
          </label>

        </div>

        {editingId && existingImage && !file && (
          <div className="kd-recipe-current-photo">
            {!removeImage && <img src={existingImage} alt="Current blog" />}

            <button
              type="button"
              className="secondary-btn"
              onClick={() => setRemoveImage((current) => !current)}
              disabled={busy}
            >
              {removeImage ? "Keep current photo" : "Remove photo"}
            </button>
          </div>
        )}

        <label>
          Blog content <span>one paragraph per line</span>

          <textarea
            rows={14}
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            placeholder={
              "Write your first paragraph here.\n## A heading for the next part\nPress Enter to start a new paragraph."
            }
            required
          />

          <p className="kd-blog-hint">
            Press Enter to start a new paragraph. Start a line with{" "}
            <strong>##</strong> to make it a heading.
          </p>
        </label>

        <label className="kd-ad-checkbox">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => set("published", e.target.checked)}
          />
          Visible on the website
        </label>

        <div className="kd-recipe-actions">
          <button className="primary-btn" type="submit" disabled={busy}>
            {editingId ? <Save size={17} /> : <Plus size={17} />}

            {busy
              ? "Saving…"
              : editingId
                ? "Save changes"
                : "Publish blog"}
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

      {/* ---------------- LIST ---------------- */}
      <div className="kd-recipe-list">

        {!blogs.length ? (
          <div className="empty-inline">No blogs yet.</div>
        ) : (
          blogs.map((blog) => (
            <article className="kd-recipe-row" key={blog.id}>

              {blog.imageUrl ? (
                <img src={blog.imageUrl} alt={blog.title} loading="lazy" />
              ) : (
                <span className="kd-recipe-row-emoji" aria-hidden="true">
                  {blog.emoji || "📝"}
                </span>
              )}

              <div className="kd-recipe-row-info">
                <strong>{blog.title}</strong>

                <span>
                  {blog.category || "Blog"}
                  {blog.readTime ? ` · ${blog.readTime}` : ""}
                  {" · "}
                  {blog.published ? "Visible" : "Hidden"}
                  {blog.imageUrl ? "" : " · No photo"}
                </span>
              </div>

              <div className="kd-recipe-row-actions">

                {confirmDeleteId === blog.id ? (
                  <>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => remove(blog)}
                      disabled={working}
                    >
                      {deletingId === blog.id ? "Deleting…" : "Yes, delete"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={working}
                    >
                      Keep
                    </button>
                  </>
                ) : (
                  <>
                    {blog.published && (
                      <Link
                        className="kd-row-link"
                        to={`/blog/${blog.slug}`}
                        title="Open on the website"
                      >
                        <ExternalLink size={15} />
                        View
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => startEdit(blog)}
                      title="Edit blog"
                      disabled={working}
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => toggle(blog.id)}
                      title={blog.published ? "Hide blog" : "Show blog"}
                      disabled={working}
                    >
                      {togglingId === blog.id ? (
                        "Updating…"
                      ) : (
                        <>
                          {blog.published ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                          {blog.published ? "Hide" : "Show"}
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() => setConfirmDeleteId(blog.id)}
                      title="Delete blog"
                      disabled={working}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </>
                )}

              </div>

            </article>
          ))
        )}

      </div>

    </section>
  );
}
