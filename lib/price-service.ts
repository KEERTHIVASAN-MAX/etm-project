import { db } from "./firebase-config";
import { doc, getDoc, setDoc, getDocFromServer } from "firebase/firestore";

export interface Rate {
  soda: number
  colorSoda: number
  goliSoda: number
}

export interface Prices {
  shop: Rate
  bar: Rate
}

const DEFAULT_PRICES: Prices = {
  shop: {
    soda: 10,
    colorSoda: 15,
    goliSoda: 20,
  },
  bar: {
    soda: 15,
    colorSoda: 20,
    goliSoda: 25,
  },
}

export async function getPrices(): Promise<Prices> {
  try {
    const docRef = doc(db, "settings", "prices");
    // Use getDocFromServer to bypass local cache and ensure we get the latest data
    const docSnap = await getDocFromServer(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as Prices;
    } else {
      await setDoc(docRef, DEFAULT_PRICES);
      return DEFAULT_PRICES;
    }
  } catch (error) {
    console.error("Error fetching prices:", error);
    return DEFAULT_PRICES;
  }
}

export async function updatePrices(prices: Prices) {
  try {
    const docRef = doc(db, "settings", "prices");
    await setDoc(docRef, prices, { merge: true });
  } catch (error) {
    console.error("Error updating prices:", error);
    throw error;
  }
}

export async function resetPrices() {
  try {
    const docRef = doc(db, "settings", "prices");
    await setDoc(docRef, DEFAULT_PRICES);
  } catch (error) {
    console.error("Error resetting prices:", error);
    throw error;
  }
}
