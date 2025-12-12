// ============================
// FIREBASE INIT
// ============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  push,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

import {
  getStorage,
  ref as sRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-storage.js";

// ==== CONFIG ====
const firebaseConfig = {
  apiKey: "AIzaSyAKF1eXOowCS35ylhonxvdy9QBiLYLmvzY",
  authDomain: "crht-proj.firebaseapp.com",
  databaseURL: "https://crht-proj-default-rtdb.firebaseio.com",
  projectId: "crht-proj",
  storageBucket: "crht-proj.appspot.com",
  messagingSenderId: "1089938075641",
  appId: "1:1089938075641:web:xxxxxxxx"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

// ============================
// EXPORT UTAMA
// ============================

export function authState(cb) {
  return onAuthStateChanged(auth, cb);
}

export function logout() {
  return signOut(auth);
}

// ============================
// ADMIN CHECK
// ============================
export async function isAdmin(uid) {
  const snap = await get(ref(db, "admins/" + uid));
  return snap.exists();
}

// ============================
// USER LOGIN
// ============================
export async function userLogin(email, pass) {
  return await signInWithEmailAndPassword(auth, email, pass);
}

export async function userRegister(email, pass) {
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  await set(ref(db, "users/" + res.user.uid), {
    email,
    createdAt: Date.now()
  });
  return res;
}

// ============================
// ADMIN LOGIN
// ============================
export async function adminRegister(email, pass) {
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  await set(ref(db, "admins/" + res.user.uid), {
    email,
    createdAt: Date.now()
  });
  return res;
}

export async function adminLogin(email, pass) {
  return await signInWithEmailAndPassword(auth, email, pass);
}

// ============================
// MENU SYSTEM
// ============================

export function listenMenu(cb) {
  onValue(ref(db, "menu"), snap => {
    const val = snap.val() || {};
    const arr = Object.keys(val).map(id => ({ id, ...val[id] }));
    cb(arr);
  });
}

export async function addMenu(data) {
  const id = push(ref(db, "menu")).key;
  await set(ref(db, "menu/" + id), {
    id,
    ...data,
    createdAt: Date.now()
  });
  return id;
}

export async function updateMenu(id, data) {
  return await update(ref(db, "menu/" + id), data);
}

export async function deleteMenu(id) {
  return await remove(ref(db, "menu/" + id));
}

// ============================
// IMAGE UPLOAD
// ============================
export async function uploadImage(file, folder) {
  const path = `${folder}/${Date.now()}-${file.name}`;
  const storageRef = sRef(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// ============================
// ORDER SYSTEM
// ============================

export function listenOrders(cb) {
  onValue(ref(db, "orders"), snap => {
    const val = snap.val() || {};
    const arr = Object.keys(val).map(id => ({ id, ...val[id] }));
    cb(arr);
  });
}

export async function updateOrder(id, data) {
  return await update(ref(db, "orders/" + id), data);
}

// ============================
// CALL QUEUE (Fix error)
// ============================
export async function callQueue(orderId, queueNumber) {
  await update(ref(db, "orders/" + orderId), {
    called: queueNumber,
    calledAt: Date.now(),
    status: "called"
  });
}
