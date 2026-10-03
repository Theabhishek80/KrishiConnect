import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Auth from "./Auth";
import GoogleButton from "./GoogleButton";

import {
  signInWithEmailAndPassword
} from "firebase/auth";

import { auth } from "../../firebase";
import api from "../../api";
import { emitAuthChange } from "../../utils/auth";


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

      setError(
        e.code === "auth/invalid-credential"
          ? "Invalid email or password."
          : e.code === "auth/user-not-found"
            ? "No account found with this email."
            : e.code === "auth/wrong-password"
              ? "Incorrect password."
              : e.code === "auth/too-many-requests"
                ? "Too many attempts. Please wait a moment and try again."
                : e.code === "auth/network-request-failed"
                  ? "Network error. Please check your connection."
                  : e.response?.data?.error ||
                    "Login failed. Please try again."
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
