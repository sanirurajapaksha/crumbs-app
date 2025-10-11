import { db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { CommunityPost } from "../types";

export async function postCommunityPost(uid: string, post: CommunityPost) {
    try {
        const userRef = doc(db, "users", uid, "communityPosts", post.id);
        await setDoc(userRef, post, { merge: true });
        return post;
    } catch (error) {
        console.error("Error posting community post:", error);
    }
}

export async function getCommunityPosts(): Promise<CommunityPost[]> {
    // This function would typically fetch posts from a backend or database.
    // Here, we return an empty array as a placeholder.
    return [];
}
