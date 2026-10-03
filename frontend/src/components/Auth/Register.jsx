import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Auth from "./Auth";
import GoogleButton from "./GoogleButton";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
} from "firebase/auth";

import { auth } from "../../firebase";
import api from "../../api";


export default function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CONSUMER"
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async e => {

    e.preventDefault();

    setBusy(true);
    setError("");

    try {

      // 1. Create Firebase account
      const credential =
        await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password
        );

      const firebaseUser = credential.user;

      // 2. Save user's name in Firebase
      await updateProfile(
        firebaseUser,
        {
          displayName: form.name.trim()
        }
      );

      // 3. Send verification email
      await sendEmailVerification(
        firebaseUser
      );

      // 4. Get Firebase ID token
      const idToken =
        await firebaseUser.getIdToken();

      // Remember the chosen role so login can recover if onboarding
      // fails (e.g. the server was waking up).
      localStorage.setItem("kc_pending_role", form.role);

      // 5. Create application profile
      await api.post(
        "/auth/firebase/onboard",
        {
          name: form.name.trim(),
          role: form.role
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        }
      );

      /*
       * IMPORTANT:
       * Do not save the login session yet.
       * User must verify email first.
       */

      // Go to verification screen
      navigate("/verify-email", {
        state: {
          email: firebaseUser.email
        }
      });

    } catch (e) {

      console.error(e);

      if (
        e.code ===
        "auth/email-already-in-use"
      ) {

        setError(
          "An account already exists with this email."
        );

      } else if (
        e.code ===
        "auth/weak-password"
      ) {

        setError(
          "Password should be at least 6 characters."
        );

      } else if (
        e.code ===
        "auth/invalid-email"
      ) {

        setError(
          "Please enter a valid email address."
        );

      } else if (
        e.response?.data?.message
      ) {

        setError(
          e.response.data.message
        );

      } else {

        setError(
          "Registration failed. Please try again."
        );
      }

    } finally {

      setBusy(false);

    }
  };


  return (

    <Auth
      title="Create your account"
      subtitle="Choose how you want to use KrishiConnect."
    >

      <form onSubmit={submit}>

        <label>
          Full name

          <input
            placeholder="Your name"
            value={form.name}
            onChange={e =>
              setForm({
                ...form,
                name: e.target.value
              })
            }
            required
          />
        </label>


        <label>
          Email

          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e =>
              setForm({
                ...form,
                email: e.target.value
              })
            }
            required
          />
        </label>


        <label>
          Password

          <input
            type="password"
            minLength="8"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={e =>
              setForm({
                ...form,
                password: e.target.value
              })
            }
            required
          />
        </label>


        <label>
          Account type

          <select
            value={form.role}
            onChange={e =>
              setForm({
                ...form,
                role: e.target.value
              })
            }
          >

            <option value="CONSUMER">
              Consumer — buy produce
            </option>

            <option value="FARMER">
              Farmer — sell produce
            </option>

          </select>
        </label>


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
            ? "Creating…"
            : "Create account"}
        </button>

      </form>


      <div className="auth-divider">
        <span>OR</span>
      </div>


      <GoogleButton
        role={form.role}
      />


      <p className="auth-switch">
        Already have an account?{" "}

        <Link to="/login">
          Sign in
        </Link>
      </p>

    </Auth>
  );
}
