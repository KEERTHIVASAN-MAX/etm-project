"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";

export function AutoLoginLinkGenerator() {
    const [baseUrl, setBaseUrl] = useState("");
    const [ownerLink, setOwnerLink] = useState("");

    useEffect(() => {
        // Get base URL from window
        if (typeof window !== "undefined") {
            const url = window.location.origin;
            setBaseUrl(url);

            // Get owner info from localStorage
            const uid = localStorage.getItem("uid") || "owner123";
            const name = localStorage.getItem("userName") || "Owner";

            // Generate auto-login link for owner
            const link = `${url}/?autoLogin=true&role=owner&uid=${uid}&name=${encodeURIComponent(name)}`;
            setOwnerLink(link);
        }
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Link copied to clipboard! 📋");
    };

    const openLink = (url: string) => {
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Auto-Login Link</h1>

            <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Owner Auto-Login Link</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Share this link or bookmark it to login automatically as Owner without entering credentials.
                </p>

                <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg border break-all text-sm">
                        {ownerLink || "Generating link..."}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={() => copyToClipboard(ownerLink)}
                            className="flex-1 flex items-center gap-2"
                            disabled={!ownerLink}
                        >
                            <Copy size={16} />
                            Copy Link
                        </Button>
                        <Button
                            onClick={() => openLink(ownerLink)}
                            variant="outline"
                            className="flex items-center gap-2"
                            disabled={!ownerLink}
                        >
                            <ExternalLink size={16} />
                            Test Link
                        </Button>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">💡 How to Use:</h3>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Copy the link above</li>
                        <li>Bookmark it in your browser or save it</li>
                        <li>When you open the link, you'll be logged in automatically</li>
                        <li>Works great with PWA - add to home screen!</li>
                    </ol>
                </div>
            </Card>
        </div>
    );
}
