"use client";

import { Card } from "@/components/ui/card";

export default function InvoiceDetailsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Invoice Details</h1>

            <Card className="p-6">
                <p className="text-foreground/60 text-center py-8">
                    Select an invoice to view details
                </p>
            </Card>
        </div>
    );
}
