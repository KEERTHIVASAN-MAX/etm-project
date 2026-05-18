import { db } from "./firebase-config";
import { doc, getDoc, setDoc, getDocFromServer } from "firebase/firestore";

export interface Settings {
    qrCode1?: string; // Base64 string for QR 1
    qrCode2?: string; // Base64 string for QR 2
    defaultQr?: "1" | "2" | "both" | "none";
}

export async function getSettings(): Promise<Settings> {
    try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDocFromServer(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as Settings;
        }
        return {};
    } catch (error) {
        console.error("Error fetching settings:", error);
        return {};
    }
}

export async function updateSettings(settings: Partial<Settings>) {
    try {
        const docRef = doc(db, "settings", "general");
        await setDoc(docRef, settings, { merge: true });
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
}
