// ================================
// Firebase Config & Init
// ================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  get,
  child,
  update
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// ==== CONFIG (ISI PUNYA KAMU DI SINI) ====
const firebaseConfig = {
  apiKey: "AIzaSyAKF1eXOowCS35ylhonxvdy9QBiLYLmvzY",
  authDomain: "crht-proj.firebaseapp.com",
  databaseURL: "https://crht-proj-default-rtdb.firebaseio.com",
  projectId: "crht-proj",
  storageBucket: "crht-proj.appspot.com",
  messagingSenderId: "87240245144",
  appId: "1:87240245144:web:afd8c8c0bd8ed7cbaa483d"
};

// Inisialisasi
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);


// =======================================================
// USER REGISTER
// =======================================================
export async function registerUser(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  // simpan data user ke realtime database
  await set(ref(db, "users/" + uid), {
    email: email,
    uid: uid,
    role: "user",
    createdAt: Date.now()
  });

  return cred;
}


// =======================================================
// USER LOGIN
// =======================================================
export async function loginUser(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}


// =======================================================
// ADMIN REGISTER
// =======================================================
export async function registerAdmin(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  // tandai di database sebagai admin
  await set(ref(db, "admins/" + uid), {
    email: email,
    uid: uid,
    role: "admin",
    createdAt: Date.now()
  });

  return cred;
}


// =======================================================
// ADMIN LOGIN
// =======================================================
export async function loginAdmin(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}


// =======================================================
// CEK ADMIN ROLE
// =======================================================
export async function isAdmin(uid) {
  const snapshot = await get(child(ref(db), "admins/" + uid));
  return snapshot.exists();
}


// =======================================================
// LOGOUT (Admin/User)
// =======================================================
export async function logout() {
  return await signOut(auth);
}


// =======================================================
// EXPORT INSTANCE (untuk modul lain seperti admin-confirm, dashboard, dsb)
// =======================================================
export {
  auth,
  db,
  ref,
  set,
  get,
  child,
  update
};
