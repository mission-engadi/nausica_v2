"use client";

import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const BRAND_KEY = "nausica_branding";

export default function BrandingProvider() {
    useEffect(() => {
        getDoc(doc(db, "siteContent", "branding"))
            .then((snap) => {
                if (!snap.exists()) return;
                const { primaryColor, secondaryColor } = snap.data() as {
                    primaryColor?: string;
                    secondaryColor?: string;
                };
                if (primaryColor) {
                    document.documentElement.style.setProperty("--navy", primaryColor);
                }
                if (secondaryColor) {
                    document.documentElement.style.setProperty("--secondary", secondaryColor);
                }
                localStorage.setItem(BRAND_KEY, JSON.stringify({ p: primaryColor, s: secondaryColor }));
            })
            .catch(() => {});
    }, []);

    return null;
}
