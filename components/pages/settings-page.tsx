"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getPrices, updatePrices, resetPrices, Prices } from "@/lib/price-service";
import { useAuth } from "@/lib/auth-context";

export function SettingsPage() {
    const { uid, userName } = useAuth();

    const [prices, setPrices] = useState({
        shop: { soda: "10", colorSoda: "15", goliSoda: "20" },
        bar: { soda: "15", colorSoda: "20", goliSoda: "25" }
    });
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

            // Fetch immediately to confirm
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

            toast.success("Prices updated successfully ✅");
        } catch (error: any) {
            console.error("Error updating prices:", error);
            toast.error(`Failed to update prices: ${error.message || "Unknown error"}`);
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
