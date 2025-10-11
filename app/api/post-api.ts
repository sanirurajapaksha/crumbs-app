import { db } from "../firebase/config";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
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
