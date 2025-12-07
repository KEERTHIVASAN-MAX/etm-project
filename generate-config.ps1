$lines = Get-Content .env
$config = @{}
foreach ($line in $lines) {
    if ($line -match "([^=]+)=(.*)") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $config[$key] = $value
    }
}

$fileContent = @"
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "$($config['NEXT_PUBLIC_FIREBASE_API_KEY'])",
    authDomain: "$($config['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'])",
    projectId: "$($config['NEXT_PUBLIC_FIREBASE_PROJECT_ID'])",
    storageBucket: "$($config['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'])",
    messagingSenderId: "$($config['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'])",
    appId: "$($config['NEXT_PUBLIC_FIREBASE_APP_ID'])",
    measurementId: "$($config['NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'])",
};

if (!firebaseConfig.apiKey) {
    console.error("🔥 Firebase API Key is missing!");
} else {
    console.log("✅ Firebase Config Loaded (Hardcoded)");
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

let analytics;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
}

export { app, auth, db, analytics };
"@

Set-Content -Path "lib/firebase-config.ts" -Value $fileContent -Encoding UTF8
Write-Host "Successfully generated lib/firebase-config.ts with hardcoded values."
