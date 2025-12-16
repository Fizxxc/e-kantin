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
  remove,
  runTransaction
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
// AUTH STATE
// ============================
export function authState(cb) {
  return onAuthStateChanged(auth, cb);
}

export function logout() {
  return signOut(auth);
}



// ============================
// USER LOGIN (FIX EXPORT NAME)
// ============================
export async function loginUser(email, pass) {
  return await signInWithEmailAndPassword(auth, email, pass);
}

export async function registerUser(email, pass) {
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

export async function deleteOrder(orderId) {
  return await remove(ref(db, "orders/" + orderId));
}



// ============================
// TEMPAT ORDER USER (FINAL FIX)
// ============================
export async function placeOrder(userId, order) {
  const counterRef = ref(db, "queueCounter/current");

  // 🔒 atomic increment (AMAN walau ramai)
  const queueNumber = await runTransaction(counterRef, current => {
    return (current || 0) + 1;
  });

  const id = push(ref(db, "orders")).key;

  const data = {
    id,
    userId,
    queue: queueNumber.snapshot.val(), // ⬅️ REALTIME
    items: order.items,
    total: order.total,
    status: "pending",
    payment: order.payment,
    createdAt: Date.now(),
    called: false
  };

  await set(ref(db, "orders/" + id), data);
  return id;
}




// ============================
// QUEUE CALL SYSTEM
// ============================
export async function callQueue(orderId, queueNumber){
  await update(ref(db, "orders/" + orderId), {
    status: "called",
    called: queueNumber,   // nomor antrian
    calledAt: Date.now()
  });
}



// ============================
// GET ORDER BY ID
// ============================
export async function getOrderById(orderId) {
  const snap = await get(ref(db, "orders/" + orderId));
  return snap.exists() ? snap.val() : null;
}



// ============================
// USER PROFILE
// ============================
export async function getUserProfile(uid) {
  const snap = await get(ref(db, "users/" + uid));
  return snap.exists() ? snap.val() : null;
}



// ============================
// QR ENCODE / DECODE
// ============================
export function createQR(orderId) {
  return JSON.stringify({ type: "order", orderId });
}

export async function scanOrderQR(decoded) {
  try {
    const obj = JSON.parse(decoded);
    if (obj.type === "order") {
      return await getOrderById(obj.orderId);
    }
  } catch (e) {
    return null;
  }
  return null;
}


// ============================
// CHECK ADMIN
// ============================
export async function isAdmin(uid) {
  const snap = await get(ref(db, "admins/" + uid));
  return snap.exists();
}
// ============================

// ============================
// MARK ORDER PAID
// ============================
export async function markOrderPaid(orderId) {
  return await update(ref(db, "orders/" + orderId), {
    payment: {
      status: "paid",
      method: "qris"
    },
    status: "paid",
    paidAt: Date.now()
  });
}
