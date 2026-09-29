import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, UserRound, Save, X } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import api from "./api";
import { auth } from "./firebase";

export default function Profile() {

  const [profile, setProfile] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

 useEffect(() => {

  const unsubscribe = onAuthStateChanged(
    auth,
    firebaseUser => {

      if (firebaseUser) {
        loadProfile();
      } else {
        setError("Please sign in to view your profile.");
        setLoading(false);
      }

    }
  );

  return () => unsubscribe();

}, []);

  const loadProfile = async () => {

    try {

      setLoading(true);
      setError("");

      const response = await api.get("/profile");

      setProfile(response.data);
      setName(response.data.name || "");
      setPhone(response.data.phone || "");

    } catch (e) {

      console.error(e);

      setError(
        e.response?.data?.message ||
        "Could not load your profile."
      );

    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async e => {

    e.preventDefault();

    try {

      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.put(
        "/profile",
        {
          name,
          phone
        }
      );

      setProfile(response.data);
      setName(response.data.name || "");
      setPhone(response.data.phone || "");

      setSuccess("Profile updated successfully.");

    } catch (e) {

      console.error(e);

      setError(
        e.response?.data?.message ||
        "Could not update your profile."
      );

    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async e => {

    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    try {

      setUploading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();

      formData.append("image", file);

      const response = await api.post(
        "/profile/image",
        formData
      );

      setProfile(response.data);

      setSuccess(
        "Profile picture updated successfully."
      );

    } catch (e) {

      console.error(e);

      setError(
        e.response?.data?.message ||
        "Could not upload profile picture."
      );

    } finally {
      setUploading(false);

      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <main className="page-section">
        <div className="modern-form">
          <p>Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="page-section">
        <div className="modern-form">
          <div className="notice error">
            {error || "Profile not found."}
          </div>

          <Link
            className="primary-btn"
            to="/"
          >
            Back to marketplace
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-section">

      <div className="modern-form">

        <div className="profile-page-header">
          <div>
            <p className="eyebrow">
              Account
            </p>

            <h1>
              My Profile
            </h1>

            <p className="muted">
              Manage your personal information.
            </p>
          </div>
        </div>

        {error && (
          <div className="notice error">
            {error}
          </div>
        )}

        {success && (
          <div className="notice success">
            {success}
          </div>
        )}

        <div className="profile-picture-section">

          <div className="profile-picture">

            {profile.profileImageUrl ? (
            <img
  src={profile.profileImageUrl}
  alt="Profile"
  onClick={() => setShowImagePreview(true)}
  style={{
    width: "96px",
    height: "96px",
    objectFit: "cover",
    borderRadius: "50%",
    display: "block",
    cursor: "pointer"
  }}
/>
            ) : (
              <UserRound size={42} />
            )}

          </div>

          <div>

            <h3>
              Profile picture
            </h3>

            <p className="muted">
              JPG, PNG or other image formats. Maximum 5 MB.
            </p>

            <label className="secondary-btn">

              <Camera size={17} />

              {uploading
                ? "Uploading..."
                : "Change picture"}

              <input
                type="file"
                accept="image/*"
                onChange={uploadImage}
                disabled={uploading}
                hidden
              />

            </label>

          </div>

        </div>

        <form onSubmit={saveProfile}>

          <label>
            Full name

            <input
              type="text"
              value={name}
              onChange={e =>
                setName(e.target.value)
              }
              placeholder="Your name"
              required
            />
          </label>

          <label>
            Email

            <input
              type="email"
              value={profile.email}
              disabled
            />

            <small className="muted">
              Email is managed by Firebase.
            </small>
          </label>

          <label>
            Phone number

            <input
              type="tel"
              value={phone}
              onChange={e =>
                setPhone(e.target.value)
              }
              placeholder="Enter your phone number"
            />
          </label>

          <button
            className="primary-btn full"
            type="submit"
            disabled={saving}
          >

            <Save size={17} />

            {saving
              ? "Saving..."
              : "Save changes"}

          </button>

        </form>

      </div>

    </main>
  );
}
