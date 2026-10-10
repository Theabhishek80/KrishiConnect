import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signOut,
  updatePassword
} from "firebase/auth";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  UserRound
} from "lucide-react";

import api from "../../api";
import { auth } from "../../firebase";
import { clearStoredSession, emitAuthChange } from "../../utils/auth";
import { currentUser, errorMessage } from "../../utils/orderUtils";
import "../../styles/account.css";

function passwordError(error) {
  switch (error?.code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "Your current password is incorrect.";
    case "auth/weak-password":
      return "Choose a stronger password (at least 6 characters).";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/requires-recent-login":
      return "For security, please log out, sign in again and retry.";
    case "auth/network-request-failed":
      return "Network problem. Check your connection and try again.";
    default:
      return "Could not change your password. Please try again.";
  }
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = currentUser();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const [savedKey, setSavedKey] = useState("");

  // Firebase account type (password vs Google)
  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwDone, setPwDone] = useState(false);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateText, setDeactivateText] = useState("");
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setFirebaseUser);

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await api.get("/settings");

        if (!cancelled) setSettings(data);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Could not load your settings."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  const hasPasswordLogin = Boolean(
    firebaseUser?.providerData?.some(p => p.providerId === "password")
  );

  const isGoogle = Boolean(
    firebaseUser?.providerData?.some(p => p.providerId === "google.com")
  );

  const isAdmin = user.role === "ADMIN";

  /* ------------------------------ notification toggles ------------------------------ */

  const toggle = async key => {
    if (!settings || savingKey) return;

    const next = !settings[key];

    setSettings(prev => ({ ...prev, [key]: next }));
    setSavingKey(key);
    setSavedKey("");
    setError("");

    try {
      const { data } = await api.put("/settings", { [key]: next });

      setSettings(data);
      setSavedKey(key);

      setTimeout(() => setSavedKey(current => (current === key ? "" : current)), 2000);
    } catch (err) {
      setSettings(prev => ({ ...prev, [key]: !next }));
      setError(errorMessage(err, "Could not save your preference."));
    } finally {
      setSavingKey("");
    }
  };

  /* ------------------------------ password ------------------------------ */

  const changePassword = async event => {
    event.preventDefault();

    setPwError("");
    setPwDone(false);

    if (!pw.current) {
      setPwError("Enter your current password.");
      return;
    }

    if (pw.next.length < 6) {
      setPwError("The new password must be at least 6 characters.");
      return;
    }

    if (pw.next === pw.current) {
      setPwError("The new password must be different from the current one.");
      return;
    }

    if (pw.next !== pw.confirm) {
      setPwError("The new passwords do not match.");
      return;
    }

    setPwBusy(true);

    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, pw.current);

      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, pw.next);

      setPw({ current: "", next: "", confirm: "" });
      setPwDone(true);
    } catch (err) {
      setPwError(passwordError(err));
    } finally {
      setPwBusy(false);
    }
  };

  /* ------------------------------ deactivate ------------------------------ */

  const deactivate = async () => {
    setDeactivating(true);
    setDeactivateError("");

    try {
      await api.delete("/settings/account");

      try {
        await signOut(auth);
      } catch {
        /* the account is already disabled on the server */
      }

      clearStoredSession();
      emitAuthChange();
      navigate("/", { replace: true });
    } catch (err) {
      setDeactivateError(errorMessage(err, "Could not deactivate your account."));
      setDeactivating(false);
    }
  };

  return (
    <section className="ac-page narrow">
      <div className="ac-head">
        <div>
          <span className="ac-kicker">ACCOUNT</span>
          <h1>Settings</h1>
          <p>Manage your notifications, password and account.</p>
        </div>
      </div>

      {error && <div className="ac-alert error">{error}</div>}

      {loading ? (
        <div className="ac-state">
          <Loader2 size={30} className="ac-spin" />
          <p>Loading settings...</p>
        </div>
      ) : (
        <>
          {/* ---------------- ACCOUNT ---------------- */}
          <div className="ac-card">
            <h2><UserRound size={18} /> Account</h2>

            <div className="ac-row">
              <div>
                <strong>{settings?.name || user.name}</strong>
                <span className="sub">{settings?.email || user.email}</span>
              </div>

              <span className="ac-badge default">{settings?.role || user.role}</span>
            </div>

            <div className="ac-row">
              <div>
                <strong>Name, phone and photo</strong>
                <span className="sub">Edit them on your profile page.</span>
              </div>

              <Link className="ac-btn small" to="/profile">Edit profile</Link>
            </div>
          </div>

          {/* ---------------- NOTIFICATIONS ---------------- */}
          {!isAdmin && settings && (
            <div className="ac-card">
              <h2><Bell size={18} /> Notifications</h2>

              <div className="ac-row">
                <div>
                  <strong>Order updates in the app</strong>
                  <span className="sub">
                    {user.role === "FARMER"
                      ? "Show new orders and cancellations in the bell."
                      : "Show order confirmed, shipped and delivered updates in the bell."}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {savedKey === "notifyOrders" && (
                    <CheckCircle2 size={16} color="#23904e" aria-label="Saved" />
                  )}

                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.notifyOrders}
                    aria-label="Order updates in the app"
                    className={`ac-switch ${settings.notifyOrders ? "on" : ""}`}
                    disabled={savingKey === "notifyOrders"}
                    onClick={() => toggle("notifyOrders")}
                  />
                </div>
              </div>

              <div className="ac-row">
                <div>
                  <strong><Mail size={14} style={{ verticalAlign: "-2px" }} /> Order updates by email</strong>
                  <span className="sub">We'll also email you at {settings.email}.</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {savedKey === "notifyEmail" && (
                    <CheckCircle2 size={16} color="#23904e" aria-label="Saved" />
                  )}

                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.notifyEmail}
                    aria-label="Order updates by email"
                    className={`ac-switch ${settings.notifyEmail ? "on" : ""}`}
                    disabled={savingKey === "notifyEmail"}
                    onClick={() => toggle("notifyEmail")}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ---------------- SECURITY ---------------- */}
          {!isAdmin && (
            <div className="ac-card">
              <h2><KeyRound size={18} /> Password</h2>

              {hasPasswordLogin ? (
                <form className="ac-pw" onSubmit={changePassword} noValidate>
                  {pwError && <div className="ac-alert error" style={{ margin: 0 }}>{pwError}</div>}

                  {pwDone && (
                    <div className="ac-alert success" style={{ margin: 0 }}>
                      <CheckCircle2 size={18} /> <span>Your password has been changed.</span>
                    </div>
                  )}

                  <div className="ac-field">
                    <label htmlFor="pw-current">Current password</label>
                    <input
                      id="pw-current"
                      type="password"
                      autoComplete="current-password"
                      value={pw.current}
                      onChange={event => setPw(prev => ({ ...prev, current: event.target.value }))}
                    />
                  </div>

                  <div className="ac-field">
                    <label htmlFor="pw-new">New password</label>
                    <input
                      id="pw-new"
                      type="password"
                      autoComplete="new-password"
                      value={pw.next}
                      onChange={event => setPw(prev => ({ ...prev, next: event.target.value }))}
                    />
                  </div>

                  <div className="ac-field">
                    <label htmlFor="pw-confirm">Confirm new password</label>
                    <input
                      id="pw-confirm"
                      type="password"
                      autoComplete="new-password"
                      value={pw.confirm}
                      onChange={event => setPw(prev => ({ ...prev, confirm: event.target.value }))}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <button type="submit" className="ac-btn primary" disabled={pwBusy}>
                      {pwBusy ? <Loader2 size={16} className="ac-spin" /> : null}
                      Change password
                    </button>

                    <Link
                      to="/forgot-password"
                      style={{ color: "var(--green)", fontWeight: 700, fontSize: ".86rem" }}
                    >
                      Forgot current password?
                    </Link>
                  </div>
                </form>
              ) : (
                <div className="ac-alert info" style={{ margin: 0 }}>
                  <span>
                    {isGoogle
                      ? "You sign in with Google, so your password is managed in your Google account."
                      : "Password changes are not available for this sign-in method."}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ---------------- DANGER ---------------- */}
          {!isAdmin && (
            <div className="ac-card ac-danger-card">
              <h2><AlertTriangle size={18} /> Deactivate account</h2>

              <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: ".9rem" }}>
                You will be signed out and won't be able to log in. Your past orders stay visible to the
                people you traded with. You can only deactivate when you have no orders in progress.
              </p>

              <button
                type="button"
                className="ac-btn danger"
                onClick={() => {
                  setDeactivateText("");
                  setDeactivateError("");
                  setDeactivateOpen(true);
                }}
              >
                Deactivate my account
              </button>
            </div>
          )}
        </>
      )}

      {deactivateOpen && (
        <div className="ac-overlay" onClick={() => !deactivating && setDeactivateOpen(false)}>
          <div className="ac-modal small" onClick={event => event.stopPropagation()}>
            <div className="ac-modal-icon"><AlertTriangle size={24} /></div>
            <h3>Deactivate your account?</h3>
            <p>Type <strong>DEACTIVATE</strong> to confirm.</p>

            {deactivateError && <div className="ac-alert error" style={{ textAlign: "left" }}>{deactivateError}</div>}

            <div className="ac-field" style={{ textAlign: "left" }}>
              <input
                value={deactivateText}
                onChange={event => setDeactivateText(event.target.value)}
                placeholder="DEACTIVATE"
                autoFocus
              />
            </div>

            <div className="ac-modal-actions">
              <button
                type="button"
                className="ac-btn"
                disabled={deactivating}
                onClick={() => setDeactivateOpen(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="ac-btn danger-solid"
                disabled={deactivating || deactivateText.trim() !== "DEACTIVATE"}
                onClick={deactivate}
              >
                {deactivating ? <Loader2 size={16} className="ac-spin" /> : null}
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
