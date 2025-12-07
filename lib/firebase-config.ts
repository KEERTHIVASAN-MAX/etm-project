import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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
    console.error("ðŸ”¥ Firebase API Key is missing!");
} else {
    console.log("âœ… Firebase Config Loaded (Hardcoded)");
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Set auth persistence to LOCAL for mobile compatibility
if (typeof window !== "undefined") {
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
