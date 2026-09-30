import React, {
  useEffect,
  useState,
  useCallback
} from "react";

import { Link } from "react-router-dom";

import {
  Camera,
  UserRound,
  Save,
  X
} from "lucide-react";

import Cropper from "react-easy-crop";

import {
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";

import api from "./api";
import { auth } from "./firebase";


/*
==================================================
  KEEP LOCAL STORAGE USER IN SYNC
==================================================
*/

function syncStoredUser(profileData) {

  try {

    const currentUser = JSON.parse(
      localStorage.getItem("kc_user") || "{}"
    );

    const updatedUser = {
      ...currentUser
    };

    if (
      profileData.name !== undefined &&
      profileData.name !== null
    ) {
      updatedUser.name = profileData.name;
    }

    if (
      profileData.email !== undefined &&
      profileData.email !== null
    ) {
      updatedUser.email = profileData.email;
    }

    if (
      profileData.phone !== undefined &&
      profileData.phone !== null
    ) {
      updatedUser.phone = profileData.phone;
    }

    if (
      profileData.profileImageUrl !== undefined
    ) {
      updatedUser.profileImageUrl =
        profileData.profileImageUrl;
    }

    if (
      profileData.role !== undefined &&
      profileData.role !== null
    ) {
      updatedUser.role = profileData.role;
    }

    if (
      profileData.id !== undefined &&
      profileData.id !== null
    ) {
      updatedUser.id = profileData.id;
    }

    localStorage.setItem(
      "kc_user",
      JSON.stringify(updatedUser)
    );

  } catch (error) {

    console.error(
      "Could not synchronize stored user:",
      error
    );

  }

}


/*
==================================================
  PROFILE COMPONENT
==================================================
*/

export default function Profile() {

  const [profile, setProfile] = useState(null);

  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");


  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);


  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");


  /*
  ================================================
    IMAGE PREVIEW
  ================================================
  */

  const [
    showImagePreview,
    setShowImagePreview
  ] = useState(false);


  /*
  ================================================
    CROP STATES
  ================================================
  */

  const [
    selectedImage,
    setSelectedImage
  ] = useState(null);

  const [
    showCropper,
    setShowCropper
  ] = useState(false);

  const [
    crop,
    setCrop
  ] = useState({
    x: 0,
    y: 0
  });

  const [
    zoom,
    setZoom
  ] = useState(1);

  const [
    croppedAreaPixels,
    setCroppedAreaPixels
  ] = useState(null);


  /*
  ================================================
    AUTH STATE
  ================================================
  */

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        firebaseUser => {

          if (firebaseUser) {

            loadProfile();

          } else {

            setError(
              "Please sign in to view your profile."
            );

            setLoading(false);

          }

        }
      );

    return () => unsubscribe();

  }, []);


  /*
  ================================================
    LOAD PROFILE
  ================================================
  */

  const loadProfile = async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await api.get("/profile");

      const profileData =
        response.data;


      /*
      ----------------------------------------------
        Update React state
      ----------------------------------------------
      */

      setProfile(profileData);

      setName(
        profileData.name || ""
      );

      setPhone(
        profileData.phone || ""
      );


      /*
      ----------------------------------------------
        Synchronize navbar/session
      ----------------------------------------------
      */

      syncStoredUser(
        profileData
      );

    } catch (e) {

      console.error(
        "Load profile error:",
        e
      );

      setError(
        e.response?.data?.message ||
        "Could not load your profile."
      );

    } finally {

      setLoading(false);

    }

  };


  /*
  ================================================
    SAVE PROFILE
  ================================================
  */

  const saveProfile = async e => {

    e.preventDefault();

    if (saving) {
      return;
    }

    const trimmedName =
      name.trim();


    if (!trimmedName) {

      setError(
        "Name cannot be empty."
      );

      return;

    }


    try {

      setSaving(true);

      setError("");

      setSuccess("");


      /*
      ----------------------------------------------
        1. Save to Spring Boot / PostgreSQL
      ----------------------------------------------
      */

      const response =
        await api.put(
          "/profile",
          {
            name: trimmedName,
            phone
          }
        );


      const updatedProfile =
        response.data;


      /*
      ----------------------------------------------
        2. Update React state
      ----------------------------------------------
      */

      setProfile(
        updatedProfile
      );

      setName(
        updatedProfile.name || ""
      );

      setPhone(
        updatedProfile.phone || ""
      );


      /*
      ----------------------------------------------
        3. Update Firebase display name
      ----------------------------------------------

        This keeps Firebase and PostgreSQL
        synchronized.
      ----------------------------------------------
      */

      if (auth.currentUser) {

        try {

          await updateProfile(
            auth.currentUser,
            {
              displayName:
                updatedProfile.name ||
                trimmedName
            }
          );

        } catch (firebaseError) {

          /*
          Firebase display name synchronization
          should not make a successful database
          update look like a failed profile update.
          */

          console.error(
            "Firebase display name update failed:",
            firebaseError
          );

        }

      }


      /*
      ----------------------------------------------
        4. Update localStorage
      ----------------------------------------------

        Navbar uses kc_user, so this is important.
      ----------------------------------------------
      */

      syncStoredUser(
        updatedProfile
      );


      /*
      ----------------------------------------------
        5. Show success
      ----------------------------------------------
      */

      setSuccess(
        "Profile updated successfully."
      );


      /*
      ----------------------------------------------
        Reload the application

        This makes the navbar immediately read
        the updated kc_user value.
      ----------------------------------------------
      */

      setTimeout(() => {

        window.location.reload();

      }, 500);


    } catch (e) {

      console.error(
        "Save profile error:",
        e
      );

      setError(
        e.response?.data?.message ||
        "Could not update your profile."
      );

    } finally {

      setSaving(false);

    }

  };


  /*
  ================================================
    SELECT IMAGE
  ================================================
  */

  const selectImage = e => {

    const file =
      e.target.files?.[0];


    if (!file) {
      return;
    }


    /*
    ----------------------------------------------
      Validate image type
    ----------------------------------------------
    */

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      setError(
        "Please select an image file."
      );

      return;

    }


    /*
    ----------------------------------------------
      Validate image size
    ----------------------------------------------
    */

    if (
      file.size >
      10 * 1024 * 1024
    ) {

      setError(
        "Image must be 10 MB or less."
      );

      return;

    }


    /*
    ----------------------------------------------
      Create temporary browser URL
    ----------------------------------------------
    */

    const imageUrl =
      URL.createObjectURL(file);


    setSelectedImage(
      imageUrl
    );

    setShowCropper(
      true
    );


    /*
    Reset crop state
    */

    setCrop({
      x: 0,
      y: 0
    });

    setZoom(1);

    setCroppedAreaPixels(
      null
    );


    setError("");

    setSuccess("");


    /*
    Reset input so the same image
    can be selected again.
    */

    e.target.value = "";

  };


  /*
  ================================================
    CROP COMPLETE
  ================================================
  */

  const onCropComplete =
    useCallback(
      (
        croppedArea,
        croppedAreaPixels
      ) => {

        setCroppedAreaPixels(
          croppedAreaPixels
        );

      },
      []
    );


  /*
  ================================================
    CREATE CROPPED IMAGE
  ================================================
  */

  const createCroppedImage =
    async () => {

      if (
        !selectedImage ||
        !croppedAreaPixels
      ) {

        return;

      }


      try {

        setUploading(true);

        setError("");

        setSuccess("");


        /*
        ----------------------------------------------
          Load image
        ----------------------------------------------
        */

        const image =
          new Image();

        image.src =
          selectedImage;


        await new Promise(
          (resolve, reject) => {

            image.onload =
              resolve;

            image.onerror =
              reject;

          }
        );


        /*
        ----------------------------------------------
          Create canvas
        ----------------------------------------------
        */

        const canvas =
          document.createElement(
            "canvas"
          );


        const size =
          Math.min(
            croppedAreaPixels.width,
            croppedAreaPixels.height
          );


        canvas.width =
          size;

        canvas.height =
          size;


        const ctx =
          canvas.getContext(
            "2d"
          );


        if (!ctx) {

          throw new Error(
            "Could not create image canvas."
          );

        }


        /*
        ----------------------------------------------
          Draw cropped image
        ----------------------------------------------
        */

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


        /*
        ----------------------------------------------
          Convert canvas to JPEG
        ----------------------------------------------
        */

        const blob =
          await new Promise(
            resolve => {

              canvas.toBlob(

                resolve,

                "image/jpeg",

                0.9

              );

            }
          );


        if (!blob) {

          throw new Error(
            "Could not create cropped image."
          );

        }


        /*
        ----------------------------------------------
          Create File
        ----------------------------------------------
        */

        const file =
          new File(

            [blob],

            "profile-picture.jpg",

            {
              type: "image/jpeg"
            }

          );


        /*
        ----------------------------------------------
          Create FormData
        ----------------------------------------------
        */

        const formData =
          new FormData();

        formData.append(
          "image",
          file
        );


        /*
        ----------------------------------------------
          Upload to Spring Boot
        ----------------------------------------------
        */

        const response =
          await api.post(
            "/profile/image",
            formData
          );


        const updatedProfile =
          response.data;


        /*
        ----------------------------------------------
          Update profile state
        ----------------------------------------------
        */

        setProfile(
          updatedProfile
        );


        /*
        ----------------------------------------------
          Synchronize localStorage

          This also updates the navbar profile
          image if the navbar uses profileImageUrl.
        ----------------------------------------------
        */

        syncStoredUser(
          updatedProfile
        );


        /*
        ----------------------------------------------
          Close cropper
        ----------------------------------------------
        */

        setShowCropper(
          false
        );


        /*
        ----------------------------------------------
          Clean temporary URL
        ----------------------------------------------
        */

        URL.revokeObjectURL(
          selectedImage
        );


        setSelectedImage(
          null
        );

        setCroppedAreaPixels(
          null
        );

        setZoom(1);

        setCrop({
          x: 0,
          y: 0
        });


        setSuccess(
          "Profile picture updated successfully."
        );


        /*
        ----------------------------------------------
          Reload after successful upload

          This keeps navbar/profile state
          synchronized everywhere.
        ----------------------------------------------
        */

        setTimeout(() => {

          window.location.reload();

        }, 500);


      } catch (e) {

        console.error(
          "Profile image upload error:",
          e
        );

        setError(
          e.response?.data?.message ||
          "Could not upload profile picture."
        );

      } finally {

        setUploading(false);

      }

    };


  /*
  ================================================
    CANCEL CROP
  ================================================
  */

  const cancelCrop =
    () => {

      if (selectedImage) {

        URL.revokeObjectURL(
          selectedImage
        );

      }


      setSelectedImage(
        null
      );

      setShowCropper(
        false
      );

      setCroppedAreaPixels(
        null
      );

      setZoom(1);

      setCrop({
        x: 0,
        y: 0
      });

      setError("");

    };


  /*
  ================================================
    LOADING STATE
  ================================================
  */

  if (loading) {

    return (

      <main className="page-section">

        <div className="modern-form">

          <p>
            Loading profile...
          </p>

        </div>

      </main>

    );

  }


  /*
  ================================================
    PROFILE NOT FOUND
  ================================================
  */

  if (!profile) {

    return (

      <main className="page-section">

        <div className="modern-form">

          <div className="notice error">

            {error ||
              "Profile not found."}

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


  /*
  ================================================
    MAIN PROFILE PAGE
  ================================================
  */

  return (

    <main className="page-section">

      <div className="modern-form">


        {/* ========================================
            HEADER
        ======================================== */}

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


        {/* ========================================
            ERROR
        ======================================== */}

        {error && (

          <div className="notice error">

            {error}

          </div>

        )}


        {/* ========================================
            SUCCESS
        ======================================== */}

        {success && (

          <div className="notice success">

            {success}

          </div>

        )}


        {/* ========================================
            PROFILE PICTURE
        ======================================== */}

        <div className="profile-picture-section">


          <div className="profile-picture">

            {profile.profileImageUrl ? (

              <img
                src={
                  profile.profileImageUrl
                }
                alt="Profile"
                onClick={() =>
                  setShowImagePreview(
                    true
                  )
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

              <UserRound
                size={42}
              />

            )}

          </div>


          <div>

            <h3>
              Profile picture
            </h3>

            <p className="muted">
              Choose a picture or take a photo,
              then crop it.
            </p>


            <div className="profile-image-actions">


              {/* ==================================
                  CHOOSE IMAGE
              ================================== */}

              <label
                className="secondary-btn"
              >

                <Camera
                  size={17}
                />

                Choose image

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    selectImage
                  }
                  disabled={
                    uploading
                  }
                  hidden
                />

              </label>


              {/* ==================================
                  CAMERA
              ================================== */}

              <label
                className="secondary-btn"
              >

                <Camera
                  size={17}
                />

                Take photo

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={
                    selectImage
                  }
                  disabled={
                    uploading
                  }
                  hidden
                />

              </label>

            </div>

          </div>

        </div>


        {/* ========================================
            PROFILE FORM
        ======================================== */}

        <form
          onSubmit={saveProfile}
        >


          {/* FULL NAME */}

          <label>

            Full name

            <input
              type="text"
              value={name}
              onChange={e =>
                setName(
                  e.target.value
                )
              }
              placeholder="Your name"
              autoComplete="name"
              required
            />

          </label>


          {/* EMAIL */}

          <label>

            Email

            <input
              type="email"
              value={
                profile.email || ""
              }
              disabled
              autoComplete="email"
            />

            <small className="muted">
              Email is managed by Firebase.
            </small>

          </label>


          {/* PHONE */}

          <label>

            Phone number

            <input
              type="tel"
              value={phone}
              onChange={e =>
                setPhone(
                  e.target.value
                )
              }
              placeholder="Enter your phone number"
              autoComplete="tel"
            />

          </label>


          {/* SAVE BUTTON */}

          <button
            className="primary-btn full"
            type="submit"
            disabled={
              saving ||
              uploading
            }
          >

            <Save
              size={17}
            />

            {saving
              ? "Saving..."
              : "Save changes"}

          </button>

        </form>

      </div>


      {/* ==========================================
          CROP MODAL
      ========================================== */}

      {showCropper &&
        selectedImage && (

          <div
            className="profile-crop-overlay"
          >

            <div
              className="profile-crop-modal"
            >


              {/* HEADER */}

              <div
                className="profile-crop-header"
              >

                <h2>
                  Crop profile picture
                </h2>


                <button
                  type="button"
                  onClick={
                    cancelCrop
                  }
                  className="profile-crop-close"
                  disabled={
                    uploading
                  }
                  aria-label="Close cropper"
                >

                  <X
                    size={22}
                  />

                </button>

              </div>


              {/* CROP AREA */}

              <div
                className="profile-crop-area"
              >

                <Cropper

                  image={
                    selectedImage
                  }

                  crop={crop}

                  zoom={zoom}

                  aspect={1}

                  cropShape="round"

                  showGrid={false}

                  onCropChange={
                    setCrop
                  }

                  onZoomChange={
                    setZoom
                  }

                  onCropComplete={
                    onCropComplete
                  }

                />

              </div>


              {/* ZOOM */}

              <div
                className="profile-crop-controls"
              >

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
                    setZoom(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  disabled={
                    uploading
                  }
                />

              </div>


              {/* ACTIONS */}

              <div
                className="profile-crop-actions"
              >

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={
                    cancelCrop
                  }
                  disabled={
                    uploading
                  }
                >

                  Cancel

                </button>


                <button
                  type="button"
                  className="primary-btn"
                  onClick={
                    createCroppedImage
                  }
                  disabled={
                    uploading
                  }
                >

                  {uploading
                    ? "Uploading..."
                    : "Crop & Upload"}

                </button>

              </div>

            </div>

          </div>

        )}


      {/* ==========================================
          FULL IMAGE PREVIEW
      ========================================== */}

      {showImagePreview &&
        profile.profileImageUrl && (

          <div
            className="profile-image-preview-overlay"
            onClick={() =>
              setShowImagePreview(
                false
              )
            }
          >


            <button
              type="button"
              className="profile-image-preview-close"
              onClick={() =>
                setShowImagePreview(
                  false
                )
              }
              aria-label="Close image preview"
            >

              <X
                size={24}
              />

            </button>


            <img
              src={
                profile.profileImageUrl
              }
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
