"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const CONTENT_PREFIX = "nausica_content_";

export function useContentDoc<T>(docId: string, defaults: T): T {
    const [data, setData] = useState<T>(defaults);

    // Apply cached data synchronously before first paint — no flash for returning visitors
    useLayoutEffect(() => {
        try {
            const cached = localStorage.getItem(CONTENT_PREFIX + docId);
            if (cached) setData({ ...defaults, ...JSON.parse(cached) } as T);
        } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [docId]);

    useEffect(() => {
        getDoc(doc(db, "siteContent", docId))
            .then((snap) => {
                if (snap.exists()) {
                    setData({ ...defaults, ...snap.data() as T });
                    localStorage.setItem(CONTENT_PREFIX + docId, JSON.stringify(snap.data()));
                }
            })
            .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [docId]);

    return data;
}
