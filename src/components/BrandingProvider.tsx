"use client";

import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
            })
            .catch(() => {});
    }, []);

    return null;
}
