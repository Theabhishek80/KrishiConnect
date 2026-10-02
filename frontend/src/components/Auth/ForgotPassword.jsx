import { useState } from "react";
import { Link } from "react-router-dom";

import { Mail } from "lucide-react";

import Auth from "./Auth";

import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";


export default function ForgotPassword() {

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");


  const submit = async e => {

    e.preventDefault();

    setBusy(true);
    setError("");

    try {

      await sendPasswordResetEmail(
        auth,
        email
      );

      setSent(true);

    } catch (e) {

      console.error(e);

      if (e.code === "auth/user-not-found") {

        setError(
          "No account found with this email."
        );

      } else if (e.code === "auth/invalid-email") {

        setError(
          "Please enter a valid email address."
        );

      } else if (e.code === "auth/too-many-requests") {

        setError(
          "Too many attempts. Please try again later."
        );

      } else {

        setError(
          "Could not send reset email. Please try again."
        );

      }

    } finally {

      setBusy(false);

    }
  };


  return (

    <Auth
      title="Reset your password"
      subtitle="Enter your account email and we'll send a secure reset link."
    >

      {sent ? (

        <div className="success-box">

          <Mail size={30} />

          <h3>
            Check your inbox
          </h3>

          <p>
            If an account exists for that email,
            a password reset link has been sent.
          </p>

          <Link
            className="primary-btn full"
            to="/login"
          >
            Back to sign in
          </Link>

        </div>

      ) : (

        <form onSubmit={submit}>

          <label>

            Email

            <input
              type="email"
              value={email}
              onChange={e =>
                setEmail(e.target.value)
              }
              placeholder="you@example.com"
              required
            />

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
              ? "Sending…"
              : "Send reset link"}

          </button>


          <p className="auth-switch">

            <Link to="/login">
              ← Back to sign in
            </Link>

          </p>

        </form>

      )}

    </Auth>
  );
}
