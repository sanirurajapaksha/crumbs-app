/**
 * Firebase API for pantry item management
 * Handles CRUD operations for pantry items in Firestore
 */

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    Unsubscribe,
    updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { PantryItem } from '../types';

/**
 * Load all pantry items for a user from Firestore
 */
export async function loadUserPantryItems(userId: string): Promise<PantryItem[]> {
    try {
        const pantryRef = collection(db, 'users', userId, 'pantryItems');
        const q = query(pantryRef, orderBy('addedAt', 'desc'));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as PantryItem[];
    } catch (error) {
        console.error('Error loading pantry items:', error);
        throw new Error('Failed to load pantry items');
    }
}

/**
 * Add a new pantry item to Firestore
 */
export async function addPantryItemToFirebase(userId: string, item: Omit<PantryItem, 'id'>): Promise<PantryItem> {
    try {
        const pantryRef = collection(db, 'users', userId, 'pantryItems');
        const docRef = await addDoc(pantryRef, {
            ...item,
            addedAt: item.addedAt || new Date().toISOString()
        });
        
        return {
            id: docRef.id,
            ...item
        };
    } catch (error) {
        console.error('Error adding pantry item:', error);
        throw new Error('Failed to add pantry item');
    }
}

/**
 * Update an existing pantry item in Firestore
 */
export async function updatePantryItemInFirebase(
    userId: string, 
    itemId: string, 
    updates: Partial<Omit<PantryItem, 'id'>>
): Promise<void> {
    try {
        const itemRef = doc(db, 'users', userId, 'pantryItems', itemId);
        await updateDoc(itemRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating pantry item:', error);
        throw new Error('Failed to update pantry item');
    }
}

/**
 * Delete a pantry item from Firestore
 */
export async function deletePantryItemFromFirebase(userId: string, itemId: string): Promise<void> {
    try {
        const itemRef = doc(db, 'users', userId, 'pantryItems', itemId);
        await deleteDoc(itemRef);
    } catch (error) {
        console.error('Error deleting pantry item:', error);
        throw new Error('Failed to delete pantry item');
    }
}

/**
 * Subscribe to real-time updates of user's pantry items
 */
export function subscribeToPantryItems(
    userId: string, 
    onUpdate: (items: PantryItem[]) => void
): Unsubscribe {
    const pantryRef = collection(db, 'users', userId, 'pantryItems');
    const q = query(pantryRef, orderBy('addedAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as PantryItem[];
        
        onUpdate(items);
    }, (error) => {
        console.error('Error in pantry items subscription:', error);
    });
}

/**
 * Clear all pantry items for a user (useful for testing/reset)
 */
export async function clearUserPantryItems(userId: string): Promise<void> {
    try {
        const pantryRef = collection(db, 'users', userId, 'pantryItems');
        const snapshot = await getDocs(pantryRef);
        
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
    } catch (error) {
        console.error('Error clearing pantry items:', error);
        throw new Error('Failed to clear pantry items');
    }
}