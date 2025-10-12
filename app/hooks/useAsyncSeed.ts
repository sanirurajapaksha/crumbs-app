// Hook to seed demo data on first mount.
// It loads community posts only. Pantry items are now managed through Firebase.

import { useEffect, useRef } from "react";
import { seedMockData } from "../api/mockApi";
import { StoreState, useStore } from "../store/useStore";

export function useAsyncSeed() {
    const seeded = useRef(false);
    const loadPosts = useStore((s: StoreState) => s.loadPosts);

    useEffect(() => {
        if (seeded.current) return;
        seeded.current = true;
        // Only seed community posts, not pantry items
        seedMockData();
        loadPosts();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
