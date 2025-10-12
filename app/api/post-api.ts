import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { CommunityPost } from "../types";

export async function postCommunityPost(uid: string, post: CommunityPost) {
    try {
        const userRef = doc(db, "users", uid, "communityPosts", post.id);
        await setDoc(userRef, post, { merge: true }).then(() => postCommunityPostToWall(post));
        return post;
    } catch (error) {
        console.error("Error posting community post:", error);
    }
}

export async function updateCommunityPost(uid: string, postId: string, updates: Partial<CommunityPost>) {
    try {
        // Update in user's personal posts
        const userRef = doc(db, "users", uid, "communityPosts", postId);
        await updateDoc(userRef, updates);
        
        // Update in public wall
        const wallRef = doc(db, "postWall", postId);
        await updateDoc(wallRef, updates);
        
        return true;
    } catch (error) {
        console.error("Error updating community post:", error);
        throw error;
    }
}

export async function deleteCommunityPost(uid: string, postId: string) {
    try {
        // Delete from user's personal posts
        const userRef = doc(db, "users", uid, "communityPosts", postId);
        await deleteDoc(userRef);
        
        // Delete from public wall
        const wallRef = doc(db, "postWall", postId);
        await deleteDoc(wallRef);
        
        return true;
    } catch (error) {
        console.error("Error deleting community post:", error);
        throw error;
    }
}

async function postCommunityPostToWall(post: CommunityPost) {
    try {
        await setDoc(doc(db, "postWall", post.id), post, { merge: true });
        return post;
    } catch (error) {
        console.error("Error posting community post to wall:", error);
    }
}

export async function getCommunityPosts(): Promise<CommunityPost[]> {
    const posts: CommunityPost[] = [];
    try {
        const snapshot = await getDocs(collection(db, "postWall"));
        snapshot.forEach((doc) => {
            const post = { ...doc.data() } as CommunityPost;
            posts.push(post);
        });
    } catch (error) {
        console.error("Error fetching community posts:", error);
    }
    return posts;
}

export async function getUserCommunityPosts(uid: string): Promise<CommunityPost[]> {
    const posts: CommunityPost[] = [];
    try {
        const snapshot = await getDocs(collection(db, "users", uid, "communityPosts"));
        snapshot.forEach((doc) => {
            const post = { ...doc.data() } as CommunityPost;
            posts.push(post);
        });
        // Sort by creation date (newest first)
        posts.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    } catch (error) {
        console.error("Error fetching user community posts:", error);
    }
    return posts;
}

export async function postComment(postId: string, comment: string, authorName: string, avatarUrl: string) {
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const commentRef = doc(db, "postWall", postId, "comments", commentId);
        await setDoc(
            commentRef,
            {
                id: commentId,
                text: comment,
                createdAt: new Date().toISOString(),
                authorName: authorName,
                avatarUrl: avatarUrl,
            },
            { merge: true }
        );
    } catch (error) {
        console.error("Error posting comment:", error);
        throw error; // Re-throw to handle in UI
    }
}

export async function getAllComments(postId: string) {
    const comments: { id: string; authorName: string; text: string; createdAt: string; avatarUrl?: string }[] = [];
    try {
        const snapshot = await getDocs(collection(db, "postWall", postId, "comments"));
        snapshot.forEach((doc) => {
            const commentData = doc.data();
            const comment = {
                id: doc.id,
                authorName: commentData.authorName || commentData.author || "Unknown", // Handle both field names
                text: commentData.text || "",
                createdAt: commentData.createdAt || new Date().toISOString(),
                avatarUrl: commentData.avatarUrl || "",
            };
            comments.push(comment);
        });

        // Sort comments by creation time (newest first)
        comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
        console.error("Error fetching comments:", error);
        throw error; // Re-throw to handle in UI
    }
    return comments;
}
