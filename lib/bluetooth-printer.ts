let globalPrinterDevice: any = null;
let globalPrinterChar: any = null;

export const connectBluetoothPrinter = async () => {
    try {
        const nav = navigator as any;
        const device = await nav.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', '0000fee7-0000-1000-8000-00805f9b34fb']
        });

        const server = await device.gatt.connect();
        const services = await server.getPrimaryServices();
        let char = null;
        for (const s of services) {
            const chars = await s.getCharacteristics();
            for (const c of chars) {
                if (c.properties.write || c.properties.writeWithoutResponse) { char = c; break; }
            }
            if (char) break;
        }

        if (!char) throw new Error("No compatible characteristic found on printer");

        globalPrinterDevice = device;
        globalPrinterChar = char;

        // Auto cleanup on disconnect
        device.addEventListener('gattserverdisconnected', () => {
            console.log("Bluetooth printer disconnected");
            globalPrinterDevice = null;
            globalPrinterChar = null;
        });

        return { device, char };
    } catch (error) {
        console.error("Bluetooth printer connection error:", error);
        throw error;
    }
};

export const getConnectedPrinter = () => {
    return {
        device: globalPrinterDevice,
        char: globalPrinterChar
    };
};

export const printToBluetooth = async (text: string) => {
    if (!globalPrinterChar || !globalPrinterDevice?.gatt?.connected) {
        throw new Error("Printer not connected");
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    for (let i = 0; i < data.length; i += 100) {
        await globalPrinterChar.writeValue(data.slice(i, i + 100));
        await new Promise(r => setTimeout(r, 50));
    }
};
