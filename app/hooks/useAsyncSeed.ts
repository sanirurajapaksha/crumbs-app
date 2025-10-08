// Hook to seed demo data on first mount.
// It loads community posts and optionally pre-populates pantry if empty.

import { useEffect, useRef } from "react";
import { useStore, StoreState } from "../store/useStore";
import { seedMockData } from "../api/mockApi";

export function useAsyncSeed() {
    const seeded = useRef(false);
    const pantryItems = useStore((s: StoreState) => s.pantryItems);
    const addPantryItem = useStore((s: StoreState) => s.addPantryItem);
    const loadPosts = useStore((s: StoreState) => s.loadPosts);

    useEffect(() => {
        if (seeded.current) return;
        seeded.current = true;
        const { pantry } = seedMockData();
        if (pantryItems.length === 0) {
            pantry.forEach((p) => addPantryItem({ ...p }));
        }
        loadPosts();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
