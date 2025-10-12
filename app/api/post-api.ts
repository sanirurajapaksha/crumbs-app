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

/**
 * Like a post - adds user to likes subcollection and updates like count
 */
export async function likePost(userId: string, postId: string) {
    try {
        // Add user to post's likes subcollection
        const likeRef = doc(db, "postWall", postId, "likes", userId);
        await setDoc(likeRef, {
            userId,
            likedAt: new Date().toISOString(),
        });

        // Get current like count
        const postRef = doc(db, "postWall", postId);
        const likesSnapshot = await getDocs(collection(db, "postWall", postId, "likes"));
        const likeCount = likesSnapshot.size;

        // Update post like count
        await updateDoc(postRef, { likeCount });

        return true;
    } catch (error) {
        console.error("Error liking post:", error);
        throw error;
    }
}

/**
 * Unlike a post - removes user from likes subcollection and updates like count
 */
export async function unlikePost(userId: string, postId: string) {
    try {
        // Remove user from post's likes subcollection
        const likeRef = doc(db, "postWall", postId, "likes", userId);
        await deleteDoc(likeRef);

        // Get current like count
        const postRef = doc(db, "postWall", postId);
        const likesSnapshot = await getDocs(collection(db, "postWall", postId, "likes"));
        const likeCount = likesSnapshot.size;

        // Update post like count
        await updateDoc(postRef, { likeCount });

        return true;
    } catch (error) {
        console.error("Error unliking post:", error);
        throw error;
    }
}

/**
 * Check if user has liked a post
 */
export async function hasUserLikedPost(userId: string, postId: string): Promise<boolean> {
    try {
        const likeRef = doc(db, "postWall", postId, "likes", userId);
        const likeDoc = await getDocs(collection(db, "postWall", postId, "likes"));
        return likeDoc.docs.some(doc => doc.id === userId);
    } catch (error) {
        console.error("Error checking if user liked post:", error);
        return false;
    }
}

/**
 * Get all posts liked by a user
 */
export async function getUserLikedPosts(userId: string): Promise<CommunityPost[]> {
    const likedPosts: CommunityPost[] = [];
    try {
        // Get all posts from postWall
        const postsSnapshot = await getDocs(collection(db, "postWall"));
        
        // Check each post to see if user has liked it
        for (const postDoc of postsSnapshot.docs) {
            const likeRef = doc(db, "postWall", postDoc.id, "likes", userId);
            const likesSnapshot = await getDocs(collection(db, "postWall", postDoc.id, "likes"));
            const hasLiked = likesSnapshot.docs.some(doc => doc.id === userId);
            
            if (hasLiked) {
                likedPosts.push({ ...postDoc.data() } as CommunityPost);
            }
        }

        // Sort by creation date (newest first)
        likedPosts.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    } catch (error) {
        console.error("Error fetching user liked posts:", error);
    }
    return likedPosts;
}
