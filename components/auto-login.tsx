"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AutoLoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const autoLogin = searchParams.get("autoLogin");
        const role = searchParams.get("role");
        const uid = searchParams.get("uid");
        const name = searchParams.get("name");

        if (autoLogin === "true" && role && uid) {
            localStorage.setItem("uid", uid);
            localStorage.setItem("role", role);
            localStorage.setItem("userName", name || "User");
            router.replace("/");
            window.location.reload();
        }
    }, [searchParams, router]);

    return null;
}

export function AutoLogin() {
    return (
        <Suspense fallback={null}>
            <AutoLoginContent />
        </Suspense>
    );
}
