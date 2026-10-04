import { useState } from "react";
import {
  useLocation,
  useNavigate
} from "react-router-dom";

import { CheckCircle2 } from "lucide-react";

import Auth from "./Auth";

import api from "../../api";


export default function ResetPassword() {

  const token =
    new URLSearchParams(
      useLocation().search
    ).get("token") || "";

  const navigate = useNavigate();

  const [password, setPassword] =
    useState("");

  const [confirm, setConfirm] =
    useState("");

  const [done, setDone] =
    useState(false);

  const [error, setError] =
    useState("");

  const [busy, setBusy] =
    useState(false);


  const submit = async e => {

    e.preventDefault();

    if (password !== confirm) {
      return setError(
        "Passwords do not match."
      );
    }

    setBusy(true);
    setError("");

    try {

      await api.post(
        "/auth/reset-password",
        {
          token,
          password
        }
      );

      setDone(true);

    } catch (e) {

      setError(
        e.response?.data?.error ||
        "Reset link is invalid or expired."
      );

    } finally {

      setBusy(false);

    }
  };


  return (

    <Auth
      title="Set a new password"
      subtitle="Choose a strong password you haven’t used before."
    >

      {done ? (

        <div className="success-box">

          <CheckCircle2 size={32} />

          <h3>
            Password updated
          </h3>

          <p>
            Your password has been changed successfully.
          </p>

          <button
            className="primary-btn full"
            onClick={() => navigate("/login")}
          >
            Sign in
          </button>

        </div>

      ) : (

        <form onSubmit={submit}>

          <label>
            New password

            <input
              type="password"
              minLength="8"
              value={password}
              onChange={e =>
                setPassword(e.target.value)
              }
              required
            />

          </label>


          <label>
            Confirm password

            <input
              type="password"
              minLength="8"
              value={confirm}
              onChange={e =>
                setConfirm(e.target.value)
              }
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
            disabled={busy || !token}
          >
            {busy
              ? "Updating…"
              : "Update password"}
          </button>

        </form>

      )}

    </Auth>
  );
}
