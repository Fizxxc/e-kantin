// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  getDatabase, ref, set, update, push, remove, onValue, get, child
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

import {
  getStorage, ref as SRef, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

export const app = initializeApp({
  apiKey: "AIzaSyAKF1eXOowCS35ylhonxvdy9QBiLYLmvzY",
  authDomain: "crht-proj.firebaseapp.com",
  databaseURL: "https://crht-proj-default-rtdb.firebaseio.com",
  projectId: "crht-proj",
  storageBucket: "crht-proj.firebasestorage.app",
  messagingSenderId: "957104910274",
  appId: "1:957104910274:web:5a7463a011d5f68583305b",
  measurementId: "G-4BTK874XF4"
});

export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

// ---------------------- MENU SECTION -------------------------

export async function uploadImage(file, folder="menu") {
  const name = `${folder}/${Date.now()}_${file.name}`;
  const storageRef = SRef(storage, name);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export async function addMenu(data) {
  const m = push(ref(db, "menu"));
  await set(m, data);
  return m.key;
}

export async function updateMenu(id, data) {
  return update(ref(db, "menu/" + id), data);
}

export async function deleteMenu(id) {
  return remove(ref(db, "menu/" + id));
}

export function listenMenu(cb) {
  onValue(ref(db, "menu"), (snap) => {
    const v = snap.val() || {};
    const arr = Object.keys(v).map(id => ({ id, ...v[id] }));
    cb(arr);
  });
}

// ---------------------- ORDER/QUEUE -------------------------

export async function placeOrder(userId, order) {
  const o = push(ref(db, "orders"));
  await set(o, {
    userId,
    queue: Math.floor(1000 + Math.random() * 9000),
    status: "pending",
    createdAt: Date.now(),
    ...order
  });
  return o.key;
}

export function listenOrders(cb) {
  onValue(ref(db, "orders"), snap => {
    const v = snap.val() || {};
    const arr = Object.keys(v).map(id => ({ id, ...v[id] }));
    cb(arr);
  });
}

export async function callQueue(orderId, queue) {
  await update(ref(db, "orders/" + orderId), { status: "calling" });
  return queue;
}

// ---------------------- AUTH HELPERS -------------------------

// register user & save to Realtime Database
export async function registerUser(email, pass) {
  const userCred = await createUserWithEmailAndPassword(auth, email, pass);
  const uid = userCred.user.uid;
  await set(ref(db, "users/" + uid), {
    email,
    createdAt: Date.now()
  });
  return userCred;
}

// register admin & save to Realtime Database
export async function registerAdmin(email, pass) {
  const userCred = await createUserWithEmailAndPassword(auth, email, pass);
  const uid = userCred.user.uid;
  await set(ref(db, "admins/" + uid), {
    email,
    createdAt: Date.now()
  });
  return userCred;
}

export const login = (email, pass) => signInWithEmailAndPassword(auth, email, pass);
export const logout = () => signOut(auth);
export const stateChanged = (cb) => onAuthStateChanged(auth, cb);

// helper to check if user is admin
export async function isAdmin(uid) {
  const snap = await get(ref(db, "admins/" + uid));
  return snap.exists();
}
