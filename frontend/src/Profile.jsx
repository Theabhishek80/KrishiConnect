import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Camera, UserRound, Save, X } from "lucide-react";
import Cropper from "react-easy-crop";
import { onAuthStateChanged } from "firebase/auth";
import api from "./api";
import { auth } from "./firebase";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Full image preview
  const [showImagePreview, setShowImagePreview] = useState(false);

  // Crop states
  const [selectedImage, setSelectedImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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

      const response = await api.put("/profile", {
        name,
        phone
      });

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

  // Select image from device or camera
  const selectImage = e => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be 10 MB or less.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setSelectedImage(imageUrl);
    setShowCropper(true);

    setCrop({ x: 0, y: 0 });
    setZoom(1);

    setError("");
    setSuccess("");

    e.target.value = "";
  };

  // Crop completed
  const onCropComplete = useCallback(
    (croppedArea, croppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  // Create cropped image and upload
  const createCroppedImage = async () => {
    if (!selectedImage || !croppedAreaPixels) {
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const image = new Image();
      image.src = selectedImage;

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      const canvas = document.createElement("canvas");

      const size = Math.min(
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not create image canvas.");
      }

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        size,
        size
      );

      const blob = await new Promise(resolve => {
        canvas.toBlob(
          resolve,
          "image/jpeg",
          0.9
        );
      });

      if (!blob) {
        throw new Error("Could not create cropped image.");
      }

      const file = new File(
        [blob],
        "profile-picture.jpg",
        {
          type: "image/jpeg"
        }
      );

      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post(
        "/profile/image",
        formData
      );

      setProfile(response.data);

      setShowCropper(false);

      URL.revokeObjectURL(selectedImage);

      setSelectedImage(null);
      setCroppedAreaPixels(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });

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
    }
  };

  // Cancel crop
  const cancelCrop = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }

    setSelectedImage(null);
    setShowCropper(false);
    setCroppedAreaPixels(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
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

        {/* Profile Picture */}
        <div className="profile-picture-section">

          <div className="profile-picture">

            {profile.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt="Profile"
                onClick={() =>
                  setShowImagePreview(true)
                }
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
              Choose a picture or take a photo, then crop it.
            </p>

            <div className="profile-image-actions">

              {/* Choose existing image */}
              <label className="secondary-btn">

                <Camera size={17} />

                Choose image

                <input
                  type="file"
                  accept="image/*"
                  onChange={selectImage}
                  disabled={uploading}
                  hidden
                />

              </label>

              {/* Open camera */}
              <label className="secondary-btn">

                <Camera size={17} />

                Take photo

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={selectImage}
                  disabled={uploading}
                  hidden
                />

              </label>

            </div>

          </div>

        </div>

        {/* Profile Form */}
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

      {/* =========================
          CROP MODAL
         ========================= */}

      {showCropper && selectedImage && (

        <div className="profile-crop-overlay">

          <div className="profile-crop-modal">

            <div className="profile-crop-header">

              <h2>
                Crop profile picture
              </h2>

              <button
                type="button"
                onClick={cancelCrop}
                className="profile-crop-close"
                disabled={uploading}
              >
                <X size={22} />
              </button>

            </div>

            <div className="profile-crop-area">

              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />

            </div>

            <div className="profile-crop-controls">

              <label>
                Zoom
              </label>

              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={e =>
                  setZoom(Number(e.target.value))
                }
              />

            </div>

            <div className="profile-crop-actions">

              <button
                type="button"
                className="secondary-btn"
                onClick={cancelCrop}
                disabled={uploading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={createCroppedImage}
                disabled={uploading}
              >
                {uploading
                  ? "Uploading..."
                  : "Crop & Upload"}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =========================
          FULL IMAGE PREVIEW
         ========================= */}

      {showImagePreview && profile.profileImageUrl && (

        <div
          className="profile-image-preview-overlay"
          onClick={() =>
            setShowImagePreview(false)
          }
        >

          <button
            className="profile-image-preview-close"
            onClick={() =>
              setShowImagePreview(false)
            }
            aria-label="Close image preview"
          >
            <X size={24} />
          </button>

          <img
            src={profile.profileImageUrl}
            alt="Profile preview"
            className="profile-image-preview"
            onClick={e =>
              e.stopPropagation()
            }
          />

        </div>

      )}

    </main>
  );
}
