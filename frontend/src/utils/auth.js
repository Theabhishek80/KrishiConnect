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
