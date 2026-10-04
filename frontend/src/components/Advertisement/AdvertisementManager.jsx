import React, { useEffect, useState } from "react";
import { ImagePlus, Power, Trash2, Upload } from "lucide-react";
import api from "../../api";

export default function AdvertisementManager() {
  const [ads, setAds] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const response = await api.get("/admin/advertisements");

      setAds(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (e) {
      setError(
        e.response?.data?.error ||
        e.response?.data?.message ||
        "Could not load advertisements."
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async event => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!file) {
      setError("Please choose an advertisement image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Advertisement image must be 5 MB or less."
      );
      return;
    }

    setBusy(true);

    try {
      const formData = new FormData();

      formData.append("image", file);
      formData.append("title", title.trim());
      formData.append("linkUrl", linkUrl.trim());
      formData.append("active", String(active));

      await api.post(
        "/admin/advertisements",
        formData
      );

      setFile(null);
      setTitle("");
      setLinkUrl("");
      setActive(true);

      const uploadInput =
        document.getElementById("kd-ad-upload");

      if (uploadInput) {
        uploadInput.value = "";
      }

      setMessage(
        "Advertisement uploaded successfully."
      );

      await load();

    } catch (e) {
      setError(
        e.response?.data?.error ||
        e.response?.data?.message ||
        "Could not upload advertisement."
      );

    } finally {
      setBusy(false);
    }
  };

  const toggle = async id => {
    setError("");

    try {
      await api.patch(
        `/admin/advertisements/${id}/toggle`
      );

      await load();

    } catch (e) {
      setError(
        e.response?.data?.error ||
        e.response?.data?.message ||
        "Could not change advertisement status."
      );
    }
  };

  const remove = async id => {
    if (
      !window.confirm(
        "Delete this advertisement?"
      )
    ) {
      return;
    }

    setError("");

    try {
      await api.delete(
        `/admin/advertisements/${id}`
      );

      await load();

    } catch (e) {
      setError(
        e.response?.data?.error ||
        e.response?.data?.message ||
        "Could not delete advertisement."
      );
    }
  };

  const activeCount =
    ads.filter(ad => ad.active).length;

  return (
    <section className="kd-ad-admin panel">

      <div className="sectionhead">
        <div>
          <span className="section-kicker">
            CONTENT CONTROL
          </span>

          <h2>Advertisement slider</h2>

          <p>
            Upload up to 5 active posters for the
            home page.
          </p>
        </div>

        <span>
          {activeCount}/5 active
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
        className="kd-ad-form"
        onSubmit={upload}
      >

        <label className="kd-ad-upload-box">

          <ImagePlus size={22} />

          <strong>
            {file
              ? file.name
              : "Choose poster image"}
          </strong>

          <small>
            Recommended landscape poster · max 5 MB
          </small>

          <input
            id="kd-ad-upload"
            type="file"
            accept="image/*"
            onChange={event =>
              setFile(
                event.target.files?.[0] || null
              )
            }
          />

        </label>

        <div className="kd-ad-form-fields">

          <label>
            Poster title <span>optional</span>

            <input
              type="text"
              value={title}
              onChange={event =>
                setTitle(event.target.value)
              }
              placeholder="Fresh paneer — order now"
            />
          </label>

          <label>
            Click URL <span>optional</span>

            <input
              type="url"
              value={linkUrl}
              onChange={event =>
                setLinkUrl(event.target.value)
              }
              placeholder="https://example.com"
            />
          </label>

          <label className="kd-ad-checkbox">

            <input
              type="checkbox"
              checked={active}
              onChange={event =>
                setActive(
                  event.target.checked
                )
              }
            />

            Make this advertisement active
            immediately

          </label>

          <button
            className="primary-btn"
            type="submit"
            disabled={
              busy ||
              (active && activeCount >= 5)
            }
          >

            <Upload size={17} />

            {busy
              ? "Uploading…"
              : "Upload advertisement"}

          </button>

        </div>

      </form>

      <div className="kd-ad-admin-list">

        {!ads.length ? (

          <div className="empty-inline">
            No advertisements uploaded yet.
          </div>

        ) : (

          ads.map(ad => (

            <article
              className="kd-ad-admin-row"
              key={ad.id}
            >

              <img
                src={ad.imageUrl}
                alt={
                  ad.title ||
                  "Advertisement"
                }
              />

              <div className="kd-ad-admin-info">

                <strong>
                  {ad.title ||
                    "Untitled advertisement"}
                </strong>

                <span>
                  {ad.active
                    ? "Active"
                    : "Inactive"}
                </span>

              </div>

              <div className="kd-ad-admin-actions">

                <button
                  type="button"
                  className={
                    ad.active
                      ? "kd-ad-active"
                      : "kd-ad-inactive"
                  }
                  onClick={() =>
                    toggle(ad.id)
                  }
                  title={
                    ad.active
                      ? "Deactivate"
                      : "Activate"
                  }
                >

                  <Power size={16} />

                  {ad.active
                    ? "Active"
                    : "Inactive"}

                </button>

                <button
                  type="button"
                  className="kd-ad-delete"
                  onClick={() =>
                    remove(ad.id)
                  }
                  title="Delete advertisement"
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
