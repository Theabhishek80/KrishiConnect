import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Auth from "./Auth";
import GoogleButton from "./GoogleButton";

import {
  signInWithEmailAndPassword
} from "firebase/auth";

import { auth } from "../../firebase";
import api from "../../api";


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

      const profile =
        await api.get(
          "/auth/firebase/me",
          {
            headers: {
              Authorization:
                `Bearer ${idToken}`
            }
          }
        );

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

      navigate("/");

      window.location.reload();

    } catch (e) {

      console.error(e);

      setError(
        e.code === "auth/invalid-credential"
          ? "Invalid email or password."
          : e.code === "auth/user-not-found"
            ? "No account found with this email."
            : e.code === "auth/wrong-password"
              ? "Incorrect password."
              : "Login failed. Please try again."
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
