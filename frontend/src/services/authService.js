import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";

import { auth } from "../firebase";
import api from "../api";


// ============================================================
// EMAIL LOGIN
// ============================================================

export async function loginWithEmail(email, password) {
  const credential =
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  const firebaseUser = credential.user;

  if (!firebaseUser.emailVerified) {
    await signOut(auth);

    throw new Error(
      "Please verify your email before signing in."
    );
  }

  const idToken =
    await firebaseUser.getIdToken();

  const profile =
    await api.get(
      "/auth/firebase/me",
      {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      }
    );

  const sessionUser = {
    ...profile.data,
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName || ""
  };

  localStorage.setItem(
    "kc_access",
    idToken
  );

  localStorage.setItem(
    "kc_user",
    JSON.stringify(sessionUser)
  );

  return sessionUser;
}


// ============================================================
// GOOGLE LOGIN / SIGNUP
// ============================================================

export async function loginWithGoogle(role = "CONSUMER") {

  const provider =
    new GoogleAuthProvider();

  const result =
    await signInWithPopup(
      auth,
      provider
    );

  const firebaseUser =
    result.user;

  const idToken =
    await firebaseUser.getIdToken();

  const response =
    await api.post(
      "/auth/firebase/onboard",
      {
        name:
          firebaseUser.displayName ||
          firebaseUser.email,
        role
      },
      {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      }
    );

  localStorage.setItem(
    "kc_access",
    idToken
  );

  localStorage.setItem(
    "kc_user",
    JSON.stringify(
      response.data
    )
  );

  return response.data;
}


// ============================================================
// REGISTER
// ============================================================

export async function registerWithEmail({
  name,
  email,
  password,
  role
}) {

  const credential =
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

  const firebaseUser =
    credential.user;

  await updateProfile(
    firebaseUser,
    {
      displayName: name.trim()
    }
  );

  await sendEmailVerification(
    firebaseUser
  );

  const idToken =
    await firebaseUser.getIdToken();

  await api.post(
    "/auth/firebase/onboard",
    {
      name: name.trim(),
      role
    },
    {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    }
  );

  return firebaseUser;
}


// ============================================================
// RESEND EMAIL VERIFICATION
// ============================================================

export async function resendVerificationEmail() {

  const user =
    auth.currentUser;

  if (!user) {
    throw new Error(
      "Your verification session has expired. Please register again or sign in."
    );
  }

  await sendEmailVerification(user);
}


// ============================================================
// CHECK EMAIL VERIFICATION
// ============================================================

export async function checkEmailVerification() {

  const user =
    auth.currentUser;

  if (!user) {
    throw new Error(
      "Your verification session has expired. Please sign in again."
    );
  }

  await user.reload();

  return user.emailVerified;
}


// ============================================================
// FORGOT PASSWORD
// ============================================================

export async function sendPasswordReset(email) {

  await sendPasswordResetEmail(
    auth,
    email
  );
}


// ============================================================
// LOGOUT
// ============================================================

export async function logout() {

  await signOut(auth);

  localStorage.removeItem(
    "kc_access"
  );

  localStorage.removeItem(
    "kc_refresh"
  );

  localStorage.removeItem(
    "kc_user"
  );
}
