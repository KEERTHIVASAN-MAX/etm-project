"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  MessageCircle,
  Trash2,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCustomers,
  addOrUpdateCustomer,
  deleteCustomer,
  type Customer,
} from "@/lib/customer-service";
import { useRouter } from "next/navigation";

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState<Customer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 🧾 Load Customers on Mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const loadedCustomers = await getCustomers(); // ✅ Correct function
        setCustomers(loadedCustomers);
      } catch (error) {
        console.error("Error loading customers:", error);
        toast.error("Failed to load customers");
      }
    };
    fetchCustomers();
  }, []);

  // ➕ Add Customer
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      await addOrUpdateCustomer(name, phone);
      // Refresh list
      const updatedList = await getCustomers();
      setCustomers(updatedList);

      setName("");
      setPhone("");
      setShowForm(false);
      toast.success("Customer added successfully");
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error("Failed to add customer");
    } finally {
      setLoading(false);
    }
  };

  // 🗑 Delete Customer
  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await deleteCustomer(customerId);
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      toast.success("Customer deleted");
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    }
  };

  // 💬 Send WhatsApp Message
  const handleSendMessage = (phone: string, name: string) => {
    const message = 'Hi ${name}, thank you for your business at Spinz Soda!';
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };
  // 🧾 Create Order for Customer
  const handleCreateOrder = (customer: Customer) => {
    localStorage.setItem("selectedCustomer", JSON.stringify(customer));
    router.push("/create-bill"); // ✅ correct route path
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-foreground/60 mt-1">
            {customers.length} total customers
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-accent hover:bg-accent-light text-primary-dark flex items-center gap-2"
        >
          <Plus size={18} />
          Add Customer
        </Button>
      </div>

      {/* Add Customer Form */}
      {showForm && (
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Add New Customer</h2>
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <input
              type="text"
              placeholder="Customer Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent"
            />
            <input
              type="tel"
              placeholder="Phone Number (10 digits)"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-accent"
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-accent hover:bg-accent-light text-primary-dark"
              >
                {loading ? "Adding..." : "Save Customer"}
              </Button>
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-border hover:bg-border text-foreground"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Customer List */}
      <Card className="p-6">
        {customers.length === 0 ? (
          <div className="text-center py-8 text-foreground/60">
            No customers yet. Add one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
                onClick={() => setShowDetails(customer)}
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {customer.name}
                  </p>
                  <p className="text-sm text-foreground/60">{customer.phone}</p>
                  <p className="text-xs text-foreground/40 mt-1">
                    Joined on{" "}
                    {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-IN") : "-"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendMessage(customer.phone, customer.name);
                    }}
                    className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
                    title="Send WhatsApp message"
                  >
                    <MessageCircle size={18} className="text-accent" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomer(customer.id!);
                    }}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete customer"
                  >
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Customer Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <Card className="p-8 w-[90%] max-w-md space-y-4 relative">
            <button
              onClick={() => setShowDetails(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <XCircle size={22} />
            </button>

            <h2 className="text-xl font-bold">{showDetails.name}</h2>
            <p className="text-sm text-foreground/60">
              Phone: {showDetails.phone}
            </p>
            <p className="text-sm text-foreground/60">
              Joined:{" "}
              {showDetails.createdAt ? new Date(showDetails.createdAt).toLocaleDateString("en-IN") : "-"}
            </p>
            <p className="text-sm text-foreground/60">
              Total Visits: {showDetails.visitCount || 0}
            </p>
            <p className="text-sm text-foreground/60">
              Last Visit:{" "}
              {showDetails.lastVisit
                ? new Date(showDetails.lastVisit).toLocaleDateString("en-IN")
                : "No visits yet"}
            </p>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => handleCreateOrder(showDetails)}
                className="flex-1 bg-accent hover:bg-accent-light text-primary-dark flex items-center gap-2"
              >
                <ShoppingCart size={18} />
                Create Order

              </Button>
              <Button
                onClick={() => setShowDetails(null)}
                className="flex-1 bg-border hover:bg-border text-foreground"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}