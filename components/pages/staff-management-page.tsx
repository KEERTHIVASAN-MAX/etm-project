"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getStaffMembers, addStaffMember, deleteStaffMember, StaffMember } from "@/lib/staff-service";
import { Trash2 } from "lucide-react";

export function StaffManagementPage() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        try {
            const staffData = await getStaffMembers();
            setStaff(staffData);
        } catch (error) {
            console.error("Error loading staff:", error);
            setStaff([]);
        }
    };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !phone || !password) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            await addStaffMember(name, phone, password);
            toast.success("Staff member added successfully");
            setName("");
            setPhone("");
            setPassword("");
            await loadStaff();
        } catch (error) {
            toast.error("Failed to add staff member");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteStaffMember(id);
            toast.success("Staff member deleted");
            await loadStaff();
        } catch (error) {
            toast.error("Failed to delete staff member");
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>

            <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Add New Staff</h2>
                <form onSubmit={handleAddStaff} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="Enter staff name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Phone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="Enter phone number"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="Enter password"
                        />
                    </div>

                    <Button type="submit" className="w-full">Add Staff Member</Button>
                </form>
            </Card>

            <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Staff List ({staff.length})</h2>
                <div className="space-y-3">
                    {staff.length === 0 ? (
                        <p className="text-foreground/60 text-center py-4">No staff members yet</p>
                    ) : (
                        staff.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-semibold">{member.name}</p>
                                    <p className="text-sm text-foreground/60">{member.phone}</p>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(member.id)}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
