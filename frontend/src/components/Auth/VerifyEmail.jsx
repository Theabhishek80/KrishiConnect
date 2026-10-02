import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Mail } from "lucide-react";

import Auth from "./Auth";

import {
  sendEmailVerification,
  signOut
} from "firebase/auth";

import { auth } from "../../firebase";


export default function VerifyEmail() {

  const location = useLocation();
  const navigate = useNavigate();

  const email =
    location.state?.email ||
    auth.currentUser?.email ||
    "";

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);


  const resend = async () => {

    setBusy(true);
    setMessage("");
    setError("");

    try {

      const user = auth.currentUser;

      if (!user) {
        setError(
          "Your verification session has expired. Please register again or sign in."
        );
        return;
      }

      await sendEmailVerification(user);

      setMessage(
        "Verification email sent again. Please check your inbox and spam folder."
      );

    } catch (e) {

      console.error(e);

      if (e.code === "auth/too-many-requests") {

        setError(
          "Too many verification emails requested. Please wait a little before trying again."
        );

      } else {

        setError(
          "Could not resend the verification email. Please try again."
        );
      }

    } finally {

      setBusy(false);
    }
  };


  const checkVerification = async () => {

    setBusy(true);
    setMessage("");
    setError("");

    try {

      const user = auth.currentUser;

      if (!user) {
        setError(
          "Your verification session has expired. Please sign in again."
        );
        return;
      }

      await user.reload();

      if (!user.emailVerified) {

        setError(
          "Your email is not verified yet. Please click the verification link in your email."
        );

        return;
      }

      await signOut(auth);

      navigate("/login");

    } catch (e) {

      console.error(e);

      setError(
        "Could not check verification status. Please try again."
      );

    } finally {

      setBusy(false);
    }
  };


  return (

    <Auth
      title="Verify your email"
      subtitle="One more step before you can sign in."
    >

      <div className="success-box">

        <Mail size={34} />

        <h3>
          Check your inbox
        </h3>

        <p>
          We've sent a verification link to:
        </p>

        <strong>
          {email}
        </strong>

        <p>
          Click the link in the email to verify
          your account. Also check your spam or
          junk folder if you don't see it.
        </p>

      </div>


      {message && (
        <div className="notice success">
          {message}
        </div>
      )}


      {error && (
        <div className="notice error">
          {error}
        </div>
      )}


      <button
        className="primary-btn full"
        onClick={checkVerification}
        disabled={busy}
      >
        {busy
          ? "Checking…"
          : "I've verified my email"}
      </button>


      <button
        className="secondary-btn full"
        onClick={resend}
        disabled={busy}
        style={{ marginTop: "10px" }}
      >
        Resend verification email
      </button>


      <button
        className="secondary-btn full"
        onClick={async () => {
          await signOut(auth);
          navigate("/login");
        }}
        disabled={busy}
        style={{ marginTop: "10px" }}
      >
        Go to login
      </button>

    </Auth>
  );
}
