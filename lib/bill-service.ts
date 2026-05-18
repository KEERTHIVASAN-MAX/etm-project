import { db } from "./firebase-config";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp
} from "firebase/firestore";

export interface Bill {
    id?: string;
    billNumber?: string;
    customerName: string;
    customerPhone: string;
    items: Array<{
        type: string;
        quantity: number;
        price: number;
    }>;
    total: number;
    paidAmount: number;
    pendingAmount: number;
    advanceAmount?: number;
    selectedQr?: "1" | "2" | "both" | "none";
    status: "paid" | "pending" | "overdue";
    createdAt?: string;
    timestamp?: any;
    ownerId?: string;
    createdBy?: string;
    createdByName?: string;
    isDeleted?: boolean;
}

export async function addBill(billData: Omit<Bill, "id">): Promise<Bill> {
    try {
        const generatedBillNumber = billData.billNumber || `B${Date.now().toString().slice(-6)}`;
        const creatorId = localStorage.getItem("uid") || "unknown";
        const creatorName = localStorage.getItem("userName") || "System";
        
        const docRef = await addDoc(collection(db, "bills"), {
            ...billData,
            billNumber: generatedBillNumber,
            createdAt: new Date().toISOString(),
            timestamp: serverTimestamp(),
            ownerId: billData.ownerId || localStorage.getItem("ownerId") || "default",
            createdBy: creatorId,
            createdByName: creatorName,
        });

        return {
            id: docRef.id,
            ...billData,
            billNumber: generatedBillNumber,
            createdAt: new Date().toISOString(),
            createdBy: creatorId,
            createdByName: creatorName,
        };
    } catch (error) {
        console.error("Error adding bill:", error);
        throw new Error("Failed to add bill");
    }
}

export async function getBills(): Promise<Bill[]> {
    try {
        const q = query(collection(db, "bills"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Bill));
    } catch (error) {
        console.error("Error fetching bills:", error);
        return [];
    }
}

export async function deleteBill(billId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, "bills", billId));
    } catch (error) {
    }
}

export async function updateBillStatus(billId: string, status: "paid" | "pending" | "overdue"): Promise<void> {
    try {
        const { updateDoc } = await import("firebase/firestore");
        await updateDoc(doc(db, "bills", billId), { status });
    } catch (error) {
        console.error("Error updating bill status:", error);
        throw new Error("Failed to update bill status");
    }
}

export async function updateBill(billId: string, data: Partial<Bill>): Promise<void> {
    try {
        const { updateDoc } = await import("firebase/firestore");
        await updateDoc(doc(db, "bills", billId), data);
    } catch (error) {
        console.error("Error updating bill:", error);
        throw new Error("Failed to update bill");
    }
}

export async function exportBillsToCSV(bills: Bill[]) {
    if (!bills || bills.length === 0) {
        throw new Error("No bills available to export");
    }

    const headers = ["Bill Number", "Customer Name", "Phone", "Total", "Status", "Created At"];
    const rows = bills.map((bill) => [
        bill.billNumber || "-",
        bill.customerName,
        bill.customerPhone,
        bill.total,
        bill.status,
        bill.createdAt || new Date().toLocaleString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "spinz_bills.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
