import { PantryItem } from '../types';
import { AIProcessingError, ErrorType } from '../utils/errorHandling';
import { convertImageToBase64 } from '../utils/imageUtils';
import { analyzeImageForPantryItems, convertToPantryItems, DetectedItem, transcribeAudioForPantryItems } from './groqApi';

export interface AnalysisResult {
    success: boolean;
    items: PantryItem[];
    detectedItems: DetectedItem[];
    rawResponse?: string;
    error?: string;
}

/**
 * Analyze an image to detect pantry items
 * @param imageUri - URI of the captured image
 * @param userId - Optional user ID to associate with items
 * @returns Analysis result with detected pantry items
 */
export async function analyzePantryItemsFromImage(imageUri: string, userId?: string): Promise<AnalysisResult> {
    try {
        // Validate image URI
        if (!imageUri) {
            throw new AIProcessingError(
                ErrorType.VALIDATION,
                'Invalid image provided',
                'Image URI is empty or undefined'
            );
        }

        // Convert image to base64
        const base64Image = await convertImageToBase64(imageUri);
        
        if (!base64Image) {
            throw new AIProcessingError(
                ErrorType.PROCESSING,
                'Failed to process image',
                'Could not convert image to base64 format'
            );
        }
        
        // Analyze with Groq LLaVA model
        const result = await analyzeImageForPantryItems(base64Image);
        
        // Convert to pantry items
        const pantryItems = convertToPantryItems(result.items, userId);
        
        return {
            success: true,
            items: pantryItems,
            detectedItems: result.items,
            rawResponse: result.rawResponse
        };
    } catch (error) {
        console.error('Error analyzing image for pantry items:', error);
        
        if (error instanceof AIProcessingError) {
            return {
                success: false,
                items: [],
                detectedItems: [],
                error: error.message
            };
        }
        
        return {
            success: false,
            items: [],
            detectedItems: [],
            error: error instanceof Error ? error.message : 'Failed to analyze image for pantry items'
        };
    }
}

/**
 * Analyze audio input to detect mentioned pantry items
 * @param audioUri - URI of the recorded audio
 * @param userId - Optional user ID to associate with items
 * @returns Analysis result with detected pantry items
 */
export async function analyzePantryItemsFromAudio(audioUri: string, userId?: string): Promise<AnalysisResult & { transcription?: string }> {
    try {
        // Validate audio URI
        if (!audioUri) {
            throw new AIProcessingError(
                ErrorType.VALIDATION,
                'Invalid audio provided',
                'Audio URI is empty or undefined'
            );
        }

        // Transcribe and analyze with Groq
        const result = await transcribeAudioForPantryItems(audioUri);
        
        // Convert to pantry items
        const pantryItems = convertToPantryItems(result.items, userId);
        
        return {
            success: true,
            items: pantryItems,
            detectedItems: result.items,
            transcription: result.text
        };
    } catch (error) {
        console.error('Error analyzing audio for pantry items:', error);
        
        if (error instanceof AIProcessingError) {
            return {
                success: false,
                items: [],
                detectedItems: [],
                error: error.message
            };
        }
        
        return {
            success: false,
            items: [],
            detectedItems: [],
            error: error instanceof Error ? error.message : 'Failed to analyze audio for pantry items'
        };
    }
}

/**
 * Process and validate detected items before adding to pantry
 * @param detectedItems - Items detected from image or audio
 * @param existingItems - Current pantry items to avoid duplicates
 * @returns Filtered and validated pantry items
 */
export function processDetectedItems(detectedItems: DetectedItem[], existingItems: PantryItem[]): DetectedItem[] {
    const existingNames = new Set(existingItems.map(item => item.name.toLowerCase()));
    
    return detectedItems.filter(item => {
        // Filter out items that already exist in pantry
        const itemNameLower = item.name.toLowerCase();
        if (existingNames.has(itemNameLower)) {
            return false;
        }
        
        // Filter out items with very low confidence
        if (item.confidence && item.confidence < 0.5) {
            return false;
        }
        
        // Filter out generic or unclear items
        const genericTerms = ['item', 'food', 'ingredient', 'product', 'thing'];
        if (genericTerms.some(term => itemNameLower.includes(term))) {
            return false;
        }
        
        return true;
    });
}