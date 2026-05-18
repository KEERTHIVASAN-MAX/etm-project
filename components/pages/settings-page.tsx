"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getPrices, updatePrices, resetPrices, Prices } from "@/lib/price-service";
import { getSettings, updateSettings } from "@/lib/settings-service";
import { useAuth } from "@/lib/auth-context";
import { QrCode, Upload, X, Image as ImageIcon, CreditCard } from "lucide-react";

export function SettingsPage() {
    const { uid, userName } = useAuth();

    const [prices, setPrices] = useState({
        shop: { soda: "10", colorSoda: "15", goliSoda: "20" },
        bar: { soda: "15", colorSoda: "20", goliSoda: "25" }
    });
    const [qrCode1, setQrCode1] = useState<string | null>(null);
    const [qrCode2, setQrCode2] = useState<string | null>(null);
    const [defaultQr, setDefaultQr] = useState<"1" | "2" | "both" | "none">("1");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const fetched = await getPrices();

                // Handle migration from old structure to new structure
                let shopPrices, barPrices;

                if (fetched.shop && fetched.bar) {
                    // New structure exists
                    shopPrices = fetched.shop;
                    barPrices = fetched.bar;
                } else if ('soda' in fetched) {
                    // Old structure - use it for shop, calculate bar prices
                    const oldPrices = fetched as any;
                    shopPrices = {
                        soda: oldPrices.soda || 10,
                        colorSoda: oldPrices.colorSoda || 15,
                        goliSoda: oldPrices.goliSoda || 20
                    };
                    barPrices = {
                        soda: (oldPrices.soda || 10) + 5,
                        colorSoda: (oldPrices.colorSoda || 15) + 5,
                        goliSoda: (oldPrices.goliSoda || 20) + 5
                    };
                } else {
                    // Use defaults
                    shopPrices = { soda: 10, colorSoda: 15, goliSoda: 20 };
                    barPrices = { soda: 15, colorSoda: 20, goliSoda: 25 };
                }

                setPrices({
                    shop: {
                        soda: shopPrices.soda.toString(),
                        colorSoda: shopPrices.colorSoda.toString(),
                        goliSoda: shopPrices.goliSoda.toString(),
                    },
                    bar: {
                        soda: barPrices.soda.toString(),
                        colorSoda: barPrices.colorSoda.toString(),
                        goliSoda: barPrices.goliSoda.toString(),
                    }
                });
            } catch (error) {
                console.error("Error fetching prices:", error);
                toast.error("Failed to load prices");
            }
        };
        fetchPrices();

        const fetchSettings = async () => {
            try {
                const settings = await getSettings();
                if (settings.qrCode1) setQrCode1(settings.qrCode1);
                if (settings.qrCode2) setQrCode2(settings.qrCode2);
                if (settings.defaultQr) setDefaultQr(settings.defaultQr);
            } catch (error) {
                console.error("Error fetching settings:", error);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            const pricesToSave: Prices = {
                shop: {
                    soda: parseFloat(prices.shop.soda) || 0,
                    colorSoda: parseFloat(prices.shop.colorSoda) || 0,
                    goliSoda: parseFloat(prices.shop.goliSoda) || 0,
                },
                bar: {
                    soda: parseFloat(prices.bar.soda) || 0,
                    colorSoda: parseFloat(prices.bar.colorSoda) || 0,
                    goliSoda: parseFloat(prices.bar.goliSoda) || 0,
                }
            };

            console.log("Saving prices:", pricesToSave);
            await updatePrices(pricesToSave);

            // Save QR Codes and Default Settings
            await updateSettings({ 
                qrCode1: qrCode1 || "", 
                qrCode2: qrCode2 || "",
                defaultQr: defaultQr
            });

            // Fetch immediately to confirm prices
            const fetched = await getPrices();
            setPrices({
                shop: {
                    soda: fetched.shop.soda.toString(),
                    colorSoda: fetched.shop.colorSoda.toString(),
                    goliSoda: fetched.shop.goliSoda.toString(),
                },
                bar: {
                    soda: fetched.bar.soda.toString(),
                    colorSoda: fetched.bar.colorSoda.toString(),
                    goliSoda: fetched.bar.goliSoda.toString(),
                }
            });

            toast.success("Settings updated successfully ✅");
        } catch (error: any) {
            console.error("Error updating settings:", error);
            toast.error(`Failed to update settings: ${error.message || "Unknown error"}`);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        setLoading(true);
        try {
            await resetPrices();
            const fetched = await getPrices();
            setPrices({
                shop: {
                    soda: fetched.shop.soda.toString(),
                    colorSoda: fetched.shop.colorSoda.toString(),
                    goliSoda: fetched.shop.goliSoda.toString(),
                },
                bar: {
                    soda: fetched.bar.soda.toString(),
                    colorSoda: fetched.bar.colorSoda.toString(),
                    goliSoda: fetched.bar.goliSoda.toString(),
                }
            });
            toast.success("Prices reset to default ✅");
        } catch (error) {
            console.error("Error resetting prices:", error);
            toast.error("Failed to reset prices ❌");
        } finally {
            setLoading(false);
        }
    };

    const updatePrice = (category: 'shop' | 'bar', item: string, value: string) => {
        setPrices(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [item]: value
            }
        }));
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shop Prices */}
                <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Shop Prices</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Soda Price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                inputMode="decimal"
                                value={prices.shop.soda}
                                onChange={(e) => updatePrice('shop', 'soda', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="e.g., 10"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Color Soda Price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                inputMode="decimal"
                                value={prices.shop.colorSoda}
                                onChange={(e) => updatePrice('shop', 'colorSoda', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="e.g., 15"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Goli Soda Price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                inputMode="decimal"
                                value={prices.shop.goliSoda}
                                onChange={(e) => updatePrice('shop', 'goliSoda', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="e.g., 20"
                            />
                        </div>
                    </div>
                </Card>

                {/* Bar Prices */}
                <Card className="p-6">
                    <h2 className="text-xl font-bold mb-4">Bar Prices</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Soda Price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                inputMode="decimal"
                                value={prices.bar.soda}
                                onChange={(e) => updatePrice('bar', 'soda', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="e.g., 15"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Color Soda Price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                inputMode="decimal"
                                value={prices.bar.colorSoda}
                                onChange={(e) => updatePrice('bar', 'colorSoda', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="e.g., 20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Goli Soda Price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                inputMode="decimal"
                                value={prices.bar.goliSoda}
                                onChange={(e) => updatePrice('bar', 'goliSoda', e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg"
                                placeholder="e.g., 25"
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* QR Codes Section */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <QrCode className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-bold">Payment QR Codes</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* QR Code 1 */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">1</span>
                            Primary QR Code
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-6 items-center">
                            <div className="w-40 h-40 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center bg-gray-50 relative overflow-hidden group">
                                {qrCode1 ? (
                                    <>
                                        <img src={qrCode1} alt="QR 1" className="w-full h-full object-contain" />
                                        <button onClick={() => setQrCode1(null)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <ImageIcon size={40} className="text-gray-300" />
                                )}
                            </div>
                            <div className="flex-1 space-y-3 text-center sm:text-left">
                                <input type="file" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setQrCode1(reader.result as string);
                                        reader.readAsDataURL(file);
                                    }
                                }} className="hidden" id="qr1-upload" />
                                <label htmlFor="qr1-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-all border border-slate-200 text-sm">
                                    <Upload size={16} /> QR 1 from Gallery
                                </label>
                                <p className="text-[10px] text-slate-400">Main payment QR (e.g. GPay)</p>
                            </div>
                        </div>
                    </div>

                    {/* QR Code 2 */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">2</span>
                            Secondary QR Code
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-6 items-center">
                            <div className="w-40 h-40 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center bg-gray-50 relative overflow-hidden group">
                                {qrCode2 ? (
                                    <>
                                        <img src={qrCode2} alt="QR 2" className="w-full h-full object-contain" />
                                        <button onClick={() => setQrCode2(null)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <ImageIcon size={40} className="text-gray-300" />
                                )}
                            </div>
                            <div className="flex-1 space-y-3 text-center sm:text-left">
                                <input type="file" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setQrCode2(reader.result as string);
                                        reader.readAsDataURL(file);
                                    }
                                }} className="hidden" id="qr2-upload" />
                                <label htmlFor="qr2-upload" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-all border border-slate-200 text-sm">
                                    <Upload size={16} /> QR 2 from Gallery
                                </label>
                                <p className="text-[10px] text-slate-400">Extra payment QR (e.g. PhonePe)</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t flex flex-col items-center gap-6">
                    <div className="w-full max-w-md space-y-3">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2 justify-center">
                            Set Default QR for Billing
                        </label>
                        <div className="flex flex-wrap justify-center gap-2">
                            {[
                                { id: "1", label: "QR 1", color: "primary" },
                                { id: "2", label: "QR 2", color: "accent" },
                                { id: "both", label: "Both", color: "slate-800" },
                                { id: "none", label: "None", color: "slate-400" }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setDefaultQr(opt.id as any)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${defaultQr === opt.id ? `bg-${opt.color} text-white border-${opt.color} shadow-md` : "bg-slate-50 text-slate-500 border-slate-100"}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-center text-slate-400 italic">
                            This QR will be automatically selected when creating new bills.
                        </p>
                    </div>
                </div>
            </Card>

            <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button onClick={handleReset} variant="outline" disabled={loading}>
                    Reset to Default
                </Button>
            </div>

            <div className="text-center text-xs text-gray-400">
                System Status: <span className="text-green-500">● Online</span>
            </div>
        </div>
    );
}
