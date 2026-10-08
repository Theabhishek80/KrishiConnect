// Small helpers so every part of the UI stays in sync with the login state.
// (The browser "storage" event does NOT fire in the tab that made the change,
//  which is why the navbar / logout button used to go stale until a reload.)

export const AUTH_EVENT = "kc-auth-changed";

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("kc_user") || "null");
  } catch {
    return null;
  }
}

export function emitAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearStoredSession() {
  localStorage.removeItem("kc_access");
  localStorage.removeItem("kc_refresh");
  localStorage.removeItem("kc_user");
}

/* ------------------------------------------------------------------
   "Legacy" session = backend-issued JWT (POST /api/auth/login).
   This is how the ADMIN account created from ADMIN_EMAIL/ADMIN_PASSWORD
   signs in: it has no Firebase account.
------------------------------------------------------------------ */

export function isLegacySession() {
  return !!getStoredUser()?.legacy;
}

export function getLegacyToken() {
  return isLegacySession() ? localStorage.getItem("kc_access") : null;
}

export function saveLegacySession(data, email) {
  localStorage.setItem("kc_access", data.accessToken);
  localStorage.setItem("kc_refresh", data.refreshToken || "");
  localStorage.setItem(
    "kc_user",
    JSON.stringify({
      id: data.userId,
      name: data.name,
      email,
      role: data.role,
      legacy: true
    })
  );
  emitAuthChange();
}
