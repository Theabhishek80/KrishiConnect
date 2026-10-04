import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Auth from "./Auth";
import GoogleButton from "./GoogleButton";

import {
  signInWithEmailAndPassword
} from "firebase/auth";

import { auth } from "../../firebase";
import api from "../../api";
import { emitAuthChange, saveLegacySession } from "../../utils/auth";


export default function Login() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async e => {

    e.preventDefault();

    setBusy(true);
    setError("");

    try {

      const credential =
        await signInWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );

      const firebaseUser = credential.user;

      if (!firebaseUser.emailVerified) {

        setError(
          "Please verify your email before signing in."
        );

        await auth.signOut();

        return;
      }

      const idToken =
        await firebaseUser.getIdToken();

      let profile;

      try {

        profile =
          await api.get(
            "/auth/firebase/me",
            {
              headers: {
                Authorization:
                  `Bearer ${idToken}`
              }
            }
          );

      } catch (profileError) {

        // The Firebase account exists but its application profile was
        // never created (e.g. onboarding failed during registration).
        // Create it now instead of leaving the user locked out.
        if (
          profileError.response?.status === 404 ||
          profileError.response?.data?.code ===
            "PROFILE_NOT_FOUND"
        ) {

          profile =
            await api.post(
              "/auth/firebase/onboard",
              {
                name:
                  firebaseUser.displayName ||
                  firebaseUser.email,
                role:
                  localStorage.getItem(
                    "kc_pending_role"
                  ) || "CONSUMER"
              },
              {
                headers: {
                  Authorization:
                    `Bearer ${idToken}`
                }
              }
            );

        } else {

          throw profileError;

        }
      }

      localStorage.removeItem("kc_pending_role");

      localStorage.setItem(
        "kc_access",
        idToken
      );

      localStorage.setItem(
        "kc_user",
        JSON.stringify({
          ...profile.data,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name:
            firebaseUser.displayName || ""
        })
      );

      emitAuthChange();

      navigate("/");

    } catch (e) {

      console.error(e);

      // The admin account (created from ADMIN_EMAIL / ADMIN_PASSWORD) has no
      // Firebase account, so when Firebase rejects the credentials try the
      // backend login before giving up.
      const credentialProblem = [
        "auth/invalid-credential",
        "auth/user-not-found",
        "auth/wrong-password",
        "auth/invalid-login-credentials"
      ].includes(e.code);

      if (credentialProblem) {
        try {
          const { data } = await api.post("/auth/login", {
            email: form.email.trim(),
            password: form.password
          });

          saveLegacySession(data, form.email.trim().toLowerCase());
          navigate("/");
          return;
        } catch (legacyError) {
          // Not an admin / legacy account either - show the normal message.
          console.debug("Backend login failed", legacyError?.response?.status);
        }
      }

      setError(
        e.code === "auth/invalid-credential" ||
        e.code === "auth/invalid-login-credentials"
          ? "Invalid email or password."
          : e.code === "auth/user-not-found"
            ? "No account found with this email."
            : e.code === "auth/wrong-password"
              ? "Incorrect password."
              : e.code === "auth/too-many-requests"
                ? "Too many attempts. Please wait a moment and try again."
                : e.code === "auth/network-request-failed"
                  ? "Network error. Please check your connection."
                  : e.code === "auth/invalid-api-key" ||
                    e.code === "auth/configuration-not-found" ||
                    e.code === "auth/operation-not-allowed"
                    ? "Sign-in is not configured correctly (Firebase settings). Please contact support."
                    : e.response?.status === 401
                      ? "The server could not verify your sign-in. Please try again."
                      : e.response?.data?.error ||
                        (e.response
                          ? "The server had a problem. Please try again in a moment."
                          : "Could not reach the server. Please check your connection.")
      );

    } finally {

      setBusy(false);

    }
  };


  return (

    <Auth
      title="Welcome back"
      subtitle="Sign in to continue to your marketplace."
    >

      <form onSubmit={submit}>

        <label>
          Email

          <input
            type="email"
            value={form.email}
            onChange={e =>
              setForm({
                ...form,
                email: e.target.value
              })
            }
            placeholder="you@example.com"
            required
          />

        </label>


        <label>
          Password

          <input
            type="password"
            value={form.password}
            onChange={e =>
              setForm({
                ...form,
                password: e.target.value
              })
            }
            placeholder="Your password"
            required
          />

        </label>


        <div className="form-links">

          <span></span>

          <Link to="/forgot-password">
            Forgot password?
          </Link>

        </div>


        {error && (
          <div className="notice error">
            {error}
          </div>
        )}


        <button
          className="primary-btn full"
          disabled={busy}
          type="submit"
        >
          {busy
            ? "Signing in…"
            : "Sign in"}
        </button>

      </form>


      <div className="auth-divider">
        <span>OR</span>
      </div>


      <GoogleButton />


      <p className="auth-switch">
        New here?{" "}

        <Link to="/register">
          Create an account
        </Link>
      </p>

    </Auth>
  );
}
