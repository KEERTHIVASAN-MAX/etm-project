import { db } from "./firebase-config";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where
} from "firebase/firestore";

export interface StaffMember {
  id: string
  name: string
  phone: string
  password: string
  createdAt: string
}

export async function getStaffMembers(): Promise<StaffMember[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "staff"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as StaffMember));
  } catch (error) {
    console.error("Error fetching staff:", error);
    return [];
  }
}

export async function addStaffMember(name: string, phone: string, password: string): Promise<StaffMember> {
  try {
    const newStaff = {
      name,
      phone,
      password,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "staff"), newStaff);

    return {
      id: docRef.id,
      ...newStaff
    };
  } catch (error) {
    console.error("Error adding staff:", error);
    throw error;
  }
}

export async function updateStaffMember(staffId: string, updates: Partial<StaffMember>) {
  try {
    const staffRef = doc(db, "staff", staffId);
    await updateDoc(staffRef, updates);
  } catch (error) {
    console.error("Error updating staff:", error);
    throw error;
  }
}

export async function deleteStaffMember(staffId: string) {
  try {
    await deleteDoc(doc(db, "staff", staffId));
  } catch (error) {
    console.error("Error deleting staff:", error);
    throw error;
  }
}

export async function verifyStaffCredentials(phone: string, password: string): Promise<StaffMember | null> {
  try {
    const q = query(collection(db, "staff"), where("phone", "==", phone), where("password", "==", password));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as StaffMember;
    }
    return null;
  } catch (error) {
    console.error("Error verifying staff:", error);
    return null;
  }
}
