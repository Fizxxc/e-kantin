// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  getDatabase, ref, set, update, remove, push, get, onValue
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

import {
  getStorage, ref as SRef, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAKF1eXOowCS35ylhonxvdy9QBiLYLmvzY",
  authDomain: "crht-proj.firebaseapp.com",
  databaseURL: "https://crht-proj-default-rtdb.firebaseio.com",
  projectId: "crht-proj",
  storageBucket: "crht-proj.firebasestorage.app",
  messagingSenderId: "957104910274",
  appId: "1:957104910274:web:5a7463a011d5f68583305b",
  measurementId: "G-4BTK874XF4"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

/* ---------------------------
   MENU (storage + realtime)
   --------------------------- */
export async function uploadImage(file, folder = "menu") {
  const name = `${folder}/${Date.now()}_${file.name}`;
  const sref = SRef(storage, name);
  await uploadBytes(sref, file);
  return await getDownloadURL(sref);
}

export async function addMenu(data) {
  const node = push(ref(db, "menu"));
  await set(node, data);
  return node.key;
}

export async function updateMenu(id, data) {
  return update(ref(db, `menu/${id}`), data);
}

export async function deleteMenu(id) {
  return remove(ref(db, `menu/${id}`));
}

export function listenMenu(cb) {
  onValue(ref(db, "menu"), snap => {
    const v = snap.val() || {};
    const arr = Object.keys(v).map(k => ({ id: k, ...v[k] }));
    cb(arr);
  });
}

/* ---------------------------
   ORDERS / QUEUE
   --------------------------- */
export async function placeOrder(userId, order) {
  const node = push(ref(db, "orders"));
  const payload = {
    userId,
    queue: Math.floor(1000 + Math.random() * 9000),
    status: "pending",
    called: false,
    createdAt: Date.now(),
    ...order
  };
  await set(node, payload);
  return node.key;
}

export function listenOrders(cb) {
  onValue(ref(db, "orders"), snap => {
    const v = snap.val() || {};
    const arr = Object.keys(v).map(k => ({ id: k, ...v[k] }));
    cb(arr);
  });
}

/** Admin calls queue: set called=true, status, and queue number (optional override) */
export async function callQueue(orderId, queueNumber = null) {
  const patch = { status: "calling", called: true };
  if (queueNumber) patch.queue = queueNumber;
  await update(ref(db, `orders/${orderId}`), patch);
  return true;
}

export async function updateOrder(orderId, data) {
  return update(ref(db, `orders/${orderId}`), data);
}

/* ---------------------------
   AUTH Helpers (auth + db users/admins)
   --------------------------- */

/** Register normal user and create /users/{uid} record */
export async function registerUser(email, pass) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const uid = cred.user.uid;
  await set(ref(db, `users/${uid}`), { email, role: "user", createdAt: Date.now() });
  return cred;
}

/** Register admin and create /admins/{uid} record
 *  WARNING: protect this action in production (or register admins via console)
 */
export async function registerAdmin(email, pass) {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const uid = cred.user.uid;
  await set(ref(db, `admins/${uid}`), { email, role: "admin", createdAt: Date.now() });
  return cred;
}


// ------------------- ORDER HELPERS (NEW) ---------------------

export async function verifyOrder(orderId) {
  return update(ref(db, "orders/" + orderId), {
    status: "verified"
  });
}

export async function confirmOrder(orderId, queueNumber) {
  const now = Date.now();
  await update(ref(db, "orders/" + orderId), {
    status: "confirmed",
    queue: queueNumber,
    notifyAt: now
  });

  // simpan ke akun user
  const snap = await get(ref(db, "orders/" + orderId));
  const userId = snap.val().userId;
  if (userId) {
    await update(ref(db, "users/" + userId), {
      lastQueue: queueNumber,
      queueTime: now
    });
  }
}

/** Login user (same as auth sign-in) */
export function loginUser(email, pass) {
  return signInWithEmailAndPassword(auth, email, pass);
}

/** Login admin (sign in then check admins node from caller page) */
export function loginAdmin(email, pass) {
  return signInWithEmailAndPassword(auth, email, pass);
}

/** Check if uid exists in /admins */
export async function isAdmin(uid) {
  const snap = await get(ref(db, `admins/${uid}`));
  return snap.exists();
}

/** Auth state observer */
export function authState(cb) {
  return onAuthStateChanged(auth, cb);
}

/** Logout */
export function logout() {
  return signOut(auth);
}
