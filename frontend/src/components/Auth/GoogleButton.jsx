import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import api from "../../api";
import { auth } from "../../firebase";

export default function GoogleButton({ role = "CONSUMER" }) {
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const continueWithGoogle = async () => {
    setBusy(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(
        auth,
        provider
      );

      const firebaseUser = result.user;

      // Google accounts are already verified
      const idToken =
        await firebaseUser.getIdToken();

      // Create/find application profile
      const response = await api.post(
        "/auth/firebase/onboard",
        {
          name:
            firebaseUser.displayName ||
            firebaseUser.email,
          role
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        }
      );

      localStorage.setItem(
        "kc_access",
        idToken
      );

      localStorage.setItem(
        "kc_user",
        JSON.stringify(response.data)
      );

      navigate("/");

      window.location.reload();

    } catch (e) {
      console.error(e);

      if (
        e.code ===
        "auth/popup-closed-by-user"
      ) {
        setError(
          "Google sign-in was cancelled."
        );

      } else if (
        e.code ===
        "auth/account-exists-with-different-credential"
      ) {
        setError(
          "An account already exists with this email using another sign-in method. Please use email/password login."
        );

      } else {
        setError(
          "Google sign-in failed. Please try again."
        );
      }

    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {error && (
        <div className="notice error">
          {error}
        </div>
      )}

      <button
        type="button"
        className="google-btn full"
        onClick={continueWithGoogle}
        disabled={busy}
      >
        <svg
          className="google-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M21.35 12.27c0-.71-.06-1.4-.18-2.05H12v3.88h5.23a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.92-4.18 2.92-7.19z"
          />

          <path
            fill="#34A853"
            d="M12 21.7c2.63 0 4.84-.87 6.45-2.34l-3.14-2.43c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.5A9.74 9.74 0 0 0 12 21.7z"
          />

          <path
            fill="#FBBC05"
            d="M6.54 13.83a5.86 5.86 0 0 1 0-3.66v-2.5H3.3a9.75 9.75 0 0 0 0 8.66l3.24-2.5z"
          />

          <path
            fill="#EA4335"
            d="M12 6.14c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.19 14.63 2.3 12 2.3a9.74 9.74 0 0 0-8.7 5.37l3.24 2.5C7.31 7.86 9.46 6.14 12 6.14z"
          />
        </svg>

        <span>
          {busy
            ? "Connecting to Google…"
            : "Sign in with Google"}
        </span>
      </button>
    </>
  );
}
