/**
 * Utility functions for generating and managing food item images
 */
import { EncodingType, getInfoAsync, readAsStringAsync } from 'expo-file-system/legacy';

/**
 * Converts an image URI to base64 string
 * @param imageUri - The local URI of the image
 * @returns Base64 string representation of the image
 */
export const convertImageToBase64 = async (imageUri: string): Promise<string> => {
    try {
        console.log('Converting image to base64:', imageUri);
        
        // Check if file exists
        const fileInfo = await getInfoAsync(imageUri);
        if (!fileInfo.exists) {
            throw new Error(`Image file does not exist at URI: ${imageUri}`);
        }
        
        const base64 = await readAsStringAsync(imageUri, {
            encoding: EncodingType.Base64,
        });
        
        console.log('Base64 conversion successful, length:', base64.length);
        return base64;
    } catch (error) {
        console.error('Error converting image to base64:', error);
        console.error('Image URI:', imageUri);
        throw new Error(`Failed to convert image to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Generates a Pollinations.ai image URL for a food item
 * @param itemName - The name of the food item
 * @param options - Optional parameters for image generation
 * @returns A URL string for the generated image
 */
export const generateFoodImage = (
    itemName: string, 
    options: {
        width?: number;
        height?: number;
        style?: string;
    } = {}
): string => {
    const { width = 300, height = 300, style = "photorealistic" } = options;
    
    // Clean the item name for better image generation
    const cleanName = itemName.toLowerCase().trim();
    
    // Create a descriptive prompt for better food images
    const prompt = `${style} photo of fresh ${cleanName}, high quality, food photography, clean background, professional lighting`;
    
    // Encode the prompt for URL
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Generate Pollinations.ai URL
    return `https://pollinations.ai/p/${encodedPrompt}?width=${width}&height=${height}&seed=${generateSeed(cleanName)}`;
};

/**
 * Generates a consistent seed based on the item name for reproducible images
 * @param itemName - The name of the food item
 * @returns A numeric seed value
 */
const generateSeed = (itemName: string): number => {
    let hash = 0;
    for (let i = 0; i < itemName.length; i++) {
        const char = itemName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
};

/**
 * Gets an image URL for a pantry item, generating one if not already available
 * @param itemName - The name of the food item
 * @param existingImageUrl - Optional existing image URL
 * @param forceRegenerate - Force generation of a new image URL
 * @returns Image URL string
 */
export const getPantryItemImage = (itemName: string, existingImageUrl?: string, forceRegenerate = false): string => {
    if (existingImageUrl && !forceRegenerate) {
        return existingImageUrl;
    }
    
    return generateFoodImage(itemName, {
        width: 200,
        height: 200,
        style: "photorealistic"
    });
};

/**
 * Regenerates an image URL with a different seed for variety
 * @param itemName - The name of the food item
 * @returns New image URL string
 */
export const regenerateFoodImage = (itemName: string): string => {
    const randomSeed = Math.floor(Math.random() * 10000);
    const cleanName = itemName.toLowerCase().trim();
    const prompt = `photorealistic photo of fresh ${cleanName}, high quality, food photography, clean background, professional lighting`;
    const encodedPrompt = encodeURIComponent(prompt);
    
    return `https://pollinations.ai/p/${encodedPrompt}?width=200&height=200&seed=${randomSeed}`;
};