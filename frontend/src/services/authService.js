import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  signOut
} from "firebase/auth";
import { auth } from "../firebase";
import api from "../api";

function saveSession(profile, accessToken, refreshToken = "") {
  localStorage.setItem("kc_access", accessToken);
  if (refreshToken) localStorage.setItem("kc_refresh", refreshToken);
  localStorage.setItem("kc_user", JSON.stringify(profile));
}

async function onboardFirebaseUser(firebaseUser, role = "CONSUMER") {
  const idToken = await firebaseUser.getIdToken(true);
  const response = await api.post(
    "/auth/firebase/onboard",
    { name: firebaseUser.displayName || firebaseUser.email, role },
    { headers: { Authorization: `Bearer ${idToken}` } }
  );
  const data = response.data;
  // New backend versions can return an application JWT. Older deployments still work with Firebase ID tokens.
  saveSession(data, data.accessToken || idToken, data.refreshToken || "");
  return data;
}

export async function loginWithEmail(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    if (!user.emailVerified) {
      await signOut(auth);
      throw new Error("Please verify your email before signing in.");
    }
    return onboardFirebaseUser(user, "CONSUMER");
  } catch (firebaseError) {
    if (firebaseError?.message === "Please verify your email before signing in.") {
      throw firebaseError;
    }
    // Admin/native accounts are not required to exist in Firebase.
    try {
      const response = await api.post("/auth/login", { email, password });
      const data = response.data;
      saveSession({
        id: data.userId,
        name: data.name,
        email,
        role: data.role,
        emailVerified: true
      }, data.accessToken, data.refreshToken);
      return { ...data, id: data.userId, email };
    } catch {
      throw firebaseError;
    }
  }
}

export async function loginWithGoogle(role = "CONSUMER") {
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return onboardFirebaseUser(result.user, role);
}

export async function registerWithEmail({ name, email, password, role }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name.trim() });
  await sendEmailVerification(credential.user);
  await onboardFirebaseUser(credential.user, role);
  localStorage.removeItem("kc_access");
  localStorage.removeItem("kc_refresh");
  localStorage.removeItem("kc_user");
  return credential.user;
}

export async function resendVerificationEmail() {
  if (!auth.currentUser) throw new Error("Your verification session has expired. Please sign in again.");
  await sendEmailVerification(auth.currentUser);
}

export async function checkEmailVerification() {
  if (!auth.currentUser) throw new Error("Your verification session has expired. Please sign in again.");
  await auth.currentUser.reload();
  return auth.currentUser.emailVerified;
}

export async function sendPasswordReset(email) {
  const results = await Promise.allSettled([
    sendPasswordResetEmail(auth, email),
    api.post("/auth/forgot-password", { email })
  ]);
  if (results.every(r => r.status === "rejected")) {
    throw results[0].reason || new Error("Could not start password recovery.");
  }
}

export async function confirmFirebasePasswordReset(code, password) {
  await confirmPasswordReset(auth, code, password);
}

export async function logout() {
  await signOut(auth).catch(() => {});
  ["kc_access", "kc_refresh", "kc_user"].forEach(k => localStorage.removeItem(k));
}

export function currentUser() {
  try { return JSON.parse(localStorage.getItem("kc_user") || "null"); }
  catch { return null; }
}
