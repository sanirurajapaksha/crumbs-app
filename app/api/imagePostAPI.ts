import * as FileSystem from "expo-file-system/legacy";

export async function imagePostAPI(imageUri: string) {
    try {
        const base64Image = await FileSystem.readAsStringAsync(imageUri, {
            encoding: "base64",
        });

        const formData = new FormData();
        formData.append("image", base64Image);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=59da31b78d8609df428fa1e64e9598c1`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Response error:", errorText);
            throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to post image:", error);
        throw error;
    }
}
