import { db } from "./firebase-config";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    where,
    updateDoc,
    serverTimestamp
} from "firebase/firestore";

export interface Customer {
    id?: string;
    name: string;
    phone: string;
    totalSpent: number;
    lastVisit: string;
    visitCount: number;
    createdAt?: string;
}

export async function getCustomers(): Promise<Customer[]> {
    try {
        const querySnapshot = await getDocs(collection(db, "customers"));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Customer));
    } catch (error) {
        console.error("Error fetching customers:", error);
        return [];
    }
}

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
    try {
        const q = query(collection(db, "customers"), where("phone", "==", phone));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Customer;
        }
        return null;
    } catch (error) {
        console.error("Error finding customer:", error);
        return null;
    }
}

export async function addOrUpdateCustomer(name: string, phone: string): Promise<void> {
    try {
        if (phone && phone.length === 10) {
            // Try to find and update existing customer by phone
            const existingCustomer = await getCustomerByPhone(phone);
            if (existingCustomer && existingCustomer.id) {
                const customerRef = doc(db, "customers", existingCustomer.id);
                await updateDoc(customerRef, {
                    name: name,
                    lastVisit: new Date().toISOString(),
                    visitCount: (existingCustomer.visitCount || 0) + 1,
                });
                return;
            }
        }

        // No phone or customer not found — create new record
        await addDoc(collection(db, "customers"), {
            name,
            phone: phone || "",
            totalSpent: 0,
            lastVisit: new Date().toISOString(),
            visitCount: 1,
            createdAt: new Date().toISOString(),
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating customer:", error);
        throw new Error("Failed to update customer");
    }
}


export async function deleteCustomer(customerId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "customers", customerId));
    } catch (error) {
        console.error("Error deleting customer:", error);
        throw new Error("Failed to delete customer");
    }
}
