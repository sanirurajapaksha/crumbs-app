import { FirebaseError } from "firebase/app";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    sendPasswordResetEmail,
    User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../firebase/config";
import type { User } from "../types";

// Map Firebase User to app User shape
const toAppUser = (fb: FirebaseUser): User => ({
    id: fb.uid,
    name: fb.displayName ?? fb.email?.split("@")[0] ?? "User",
    email: fb.email ?? "",
    createdAt: fb.metadata?.creationTime ?? undefined,
});

// Normalize Firebase auth errors into user-friendly messages
const mapAuthError = (err: unknown): Error => {
    if (err && typeof err === "object" && (err as any).code) {
        const code = (err as FirebaseError).code;
        switch (code) {
            case "auth/invalid-email":
                return new Error("Invalid email address.");
            case "auth/user-disabled":
                return new Error("This account has been disabled.");
            case "auth/user-not-found":
            case "auth/wrong-password":
                return new Error("Invalid email or password.");
            case "auth/email-already-in-use":
                return new Error("Email is already in use.");
            case "auth/weak-password":
                return new Error("Password should be at least 6 characters.");
            case "auth/invalid-credential":
                return new Error("Invalid authentication credential.");
            case "auth/requires-recent-login":
                return new Error("Please log out and log back in before changing your password.");
            case "auth/too-many-requests":
                return new Error("Too many attempts. Please try again later.");
            default:
                return new Error((err as FirebaseError).message || "Authentication error.");
        }
    }
    return new Error("Unexpected authentication error.");
};

export type LoginParams = { email: string; password: string };
export type SignupParams = { name: string; email: string; password: string };

export async function loginWithEmail({ email, password }: LoginParams): Promise<User> {
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return toAppUser(cred.user);
    } catch (e) {
        throw mapAuthError(e);
    }
}

export async function signupWithEmail({ name, email, password }: SignupParams): Promise<User> {
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Set displayName immediately after account creation
        if (name?.trim()) {
            await updateProfile(cred.user, { displayName: name.trim() });
        }
        return toAppUser(cred.user);
    } catch (e) {
        throw mapAuthError(e);
    }
}

export async function logout(): Promise<void> {
    try {
        await signOut(auth);
    } catch (e) {
        throw mapAuthError(e);
    }
}

// Optional: Observe auth state and map to app User
export function subscribeToAuth(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, (fbUser) => {
        callback(fbUser ? toAppUser(fbUser) : null);
    });
}

// Change password with reauthentication
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
        const user = auth.currentUser;
        if (!user || !user.email) {
            throw new Error("No user is currently logged in.");
        }

        // Reauthenticate user with current password
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Update password
        await updatePassword(user, newPassword);
    } catch (e) {
        throw mapAuthError(e);
    }
}

// Send password reset email
export async function sendPasswordReset(email: string): Promise<void> {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (e) {
        throw mapAuthError(e);
    }
}
