"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useContentDoc<T>(docId: string, defaults: T): T {
    const [data, setData] = useState<T>(defaults);

    useEffect(() => {
        getDoc(doc(db, "siteContent", docId))
            .then((snap) => {
                if (snap.exists()) {
                    setData({ ...defaults, ...snap.data() as T });
                }
            })
            .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [docId]);

    return data;
}
