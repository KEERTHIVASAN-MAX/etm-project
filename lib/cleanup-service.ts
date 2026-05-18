import { db } from "./firebase-config";
import { collection, getDocs, deleteDoc, doc, query, where, Timestamp } from "firebase/firestore";

/**
 * Deletes bills older than the specified number of days
 * @param daysOld Number of days after which bills should be deleted (default: 15)
 */
export async function deleteOldBills(daysOld: number = 15): Promise<number> {
    try {
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - daysOld);

        const billsRef = collection(db, "bills");
        const q = query(billsRef, where("timestamp", "<", Timestamp.fromDate(fifteenDaysAgo)));

        const querySnapshot = await getDocs(q);

        let deletedCount = 0;
        const deletePromises = querySnapshot.docs.map(async (docSnapshot) => {
            await deleteDoc(doc(db, "bills", docSnapshot.id));
            deletedCount++;
        });

        await Promise.all(deletePromises);

        console.log(`✅ Cleanup: Deleted ${deletedCount} bills older than ${daysOld} days`);
        return deletedCount;
    } catch (error) {
        console.error("Error deleting old bills:", error);
        return 0;
    }
}

/**
 * Deletes bills in recycle bin older than the specified number of days
 * @param daysOld Number of days after which deleted bills should be erased (default: 3)
 */
export async function cleanupRecycleBin(daysOld: number = 3): Promise<number> {
    try {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - daysOld);

        const billsRef = collection(db, "bills");
        // Fetch bills marked as deleted
        const q = query(billsRef, where("isDeleted", "==", true));
        const querySnapshot = await getDocs(q);

        let deletedCount = 0;
        const deletePromises = querySnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            const timestamp = data.timestamp;
            
            // If bill is older than threshold, erase it permanently
            if (timestamp && timestamp.toDate() < thresholdDate) {
                await deleteDoc(doc(db, "bills", docSnapshot.id));
                deletedCount++;
            }
        });

        await Promise.all(deletePromises);

        if (deletedCount > 0) {
            console.log(`✅ Bin Cleanup: Erased ${deletedCount} bills older than ${daysOld} days`);
        }
        return deletedCount;
    } catch (error) {
        console.error("Error cleaning up recycle bin:", error);
        return 0;
    }
}

/**
 * Checks if cleanup should run (once per day max)
 */
export function shouldRunCleanup(): boolean {
    const lastCleanup = localStorage.getItem("lastBillCleanup");

    if (!lastCleanup) {
        return true;
    }

    const lastCleanupDate = new Date(lastCleanup);
    const now = new Date();
    const hoursSinceLastCleanup = (now.getTime() - lastCleanupDate.getTime()) / (1000 * 60 * 60);

    // Run cleanup once every 24 hours
    return hoursSinceLastCleanup >= 24;
}

/**
 * Marks that cleanup has been run
 */
export function markCleanupComplete(): void {
    localStorage.setItem("lastBillCleanup", new Date().toISOString());
}

/**
 * Main cleanup function - call this on app start
 */
export async function runAutoCleanup(): Promise<void> {
    if (shouldRunCleanup()) {
        console.log("🧹 Running automatic bill cleanup...");
        
        // 1. Erase Recycle Bin items older than 3 days
        const binDeleted = await cleanupRecycleBin(3);
        
        // 2. Erase all bills older than 30 days (general maintenance)
        const oldBillsDeleted = await deleteOldBills(30);

        if (binDeleted > 0 || oldBillsDeleted > 0) {
            console.log(`🗑️ Total cleanup: ${binDeleted} from bin, ${oldBillsDeleted} old records.`);
        }

        markCleanupComplete();
    }
}
