import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, initializeAuth } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBtw4Qf1e8jPlLXQGNBb-wwaV4y3k4adYs",
    authDomain: "etm-spinz-soda.firebaseapp.com",
    projectId: "etm-spinz-soda",
    storageBucket: "etm-spinz-soda.firebasestorage.app",
    messagingSenderId: "692144829228",
    appId: "1:692144829228:web:d1c9d6388ff94fe857b289",
    measurementId: "G-575RG8SNFP",
};

if (!firebaseConfig.apiKey) {
    console.error("🔥 Firebase API Key is missing!");
} else {
    console.log("✅ Firebase Config Loaded (Hardcoded)");
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let auth = getAuth(app);
let db = getFirestore(app);

// Enable Offline Persistence for Firestore
if (typeof window !== "undefined") {
    try {
        enableMultiTabIndexedDbPersistence(db).catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn("Multiple tabs open, offline persistence can only be enabled in one tab at a time.");
            } else if (err.code === 'unimplemented') {
                console.warn("The current browser does not support all of the features required to enable offline persistence.");
            }
        });
    } catch (e) {
        console.error("Error enabling offline persistence", e);
    }

    setPersistence(auth, browserLocalPersistence).catch((error) => {
        console.error("Failed to set auth persistence:", error);
    });
}

let analytics;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, auth, db, analytics };
