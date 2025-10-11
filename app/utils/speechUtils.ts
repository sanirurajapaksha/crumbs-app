import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

export interface SpeechRecognitionResult {
    transcript: string;
    confidence: number;
}

/**
 * Initialize speech recognition permissions
 */
export async function initializeSpeechRecognition(): Promise<boolean> {
    try {
        const { granted } = await Audio.requestPermissionsAsync();

        if (!granted) {
            return false;
        }

        // Set audio mode for recording
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });

        return true;
    } catch (error) {
        console.error("Error initializing speech recognition:", error);
        return false;
    }
}

/**
 * Start voice recording for speech recognition
 */
export async function startVoiceRecording(): Promise<Audio.Recording | null> {
    try {
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
            android: {
                extension: ".m4a",
                outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                audioEncoder: Audio.AndroidAudioEncoder.AAC,
                sampleRate: 16000,
                numberOfChannels: 1,
                bitRate: 128000,
            },
            ios: {
                extension: ".m4a",
                audioQuality: Audio.IOSAudioQuality.HIGH,
                sampleRate: 16000,
                numberOfChannels: 1,
                bitRate: 128000,
                linearPCMBitDepth: 16,
                linearPCMIsBigEndian: false,
                linearPCMIsFloat: false,
            },
            web: {
                mimeType: "audio/webm",
                bitsPerSecond: 128000,
            },
        });
        await recording.startAsync();
        return recording;
    } catch (error) {
        console.error("Error starting voice recording:", error);
        return null;
    }
}

/**
 * Stop voice recording and return the URI
 */
export async function stopVoiceRecording(recording: Audio.Recording): Promise<string | null> {
    try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        return uri;
    } catch (error) {
        console.error("Error stopping voice recording:", error);
        return null;
    }
}

/**
 * Convert speech to text using Groq Whisper API
 */
export async function transcribeAudio(audioUri: string): Promise<SpeechRecognitionResult> {
    try {
        const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

        if (!apiKey) {
            throw new Error("GROQ API key not configured");
        }

        // Create FormData with the file URI directly
        const formData = createFormData(audioUri);

        // Send to Groq API
        const response = await fetch(`https://api.groq.com/openai/v1/audio/transcriptions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Transcription API error:", errorText);
            throw new Error(`Transcription failed: ${response.status}`);
        }

        const data = await response.json();

        return {
            transcript: data.text || "",
            confidence: 0.9, // Groq doesn't provide confidence scores
        };
    } catch (error) {
        console.error("Error transcribing audio:", error);
        throw error;
    }
}

/**
 * Helper to create FormData for audio upload
 * React Native's FormData can accept file URIs directly
 */
function createFormData(audioUri: string): FormData {
    const formData = new FormData();

    // Get file extension
    const extension = audioUri.split(".").pop() || "m4a";
    const mimeType = extension === "m4a" ? "audio/m4a" : "audio/webm";

    // React Native FormData accepts URI directly as a file
    // @ts-ignore - React Native FormData type doesn't match web FormData
    formData.append("file", {
        uri: audioUri,
        type: mimeType,
        name: `audio.${extension}`,
    });
    formData.append("model", "whisper-large-v3");
    formData.append("language", "en");
    formData.append("response_format", "json");

    return formData;
}

/**
 * Web Speech API implementation (for web platform)
 */
export function useWebSpeechRecognition(
    onResult: (transcript: string) => void,
    onError: (error: string) => void
): {
    startListening: () => void;
    stopListening: () => void;
    isSupported: boolean;
} {
    if (Platform.OS !== "web") {
        return {
            startListening: () => {},
            stopListening: () => {},
            isSupported: false,
        };
    }

    // @ts-ignore - Web Speech API types
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        return {
            startListening: () => onError("Speech recognition not supported"),
            stopListening: () => {},
            isSupported: false,
        };
    }

    let recognition: any = null;

    const startListening = () => {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
        };

        recognition.onerror = (event: any) => {
            onError(event.error);
        };

        recognition.start();
    };

    const stopListening = () => {
        if (recognition) {
            recognition.stop();
            recognition = null;
        }
    };

    return {
        startListening,
        stopListening,
        isSupported: true,
    };
}

/**
 * Clean up audio file after transcription
 */
export async function cleanupAudioFile(uri: string): Promise<void> {
    try {
        const file = new FileSystem.File(uri);
        if (file.exists) {
            await file.delete();
        }
    } catch (error) {
        console.error("Error cleaning up audio file:", error);
    }
}

/**
 * Common non-food words to filter out
 */
const NON_FOOD_WORDS = [
    // Articles & pronouns
    "a",
    "an",
    "the",
    "this",
    "that",
    "these",
    "those",
    "my",
    "your",
    "our",
    "their",
    "i",
    "you",
    "we",
    "they",
    // Actions & verbs
    "add",
    "remove",
    "delete",
    "buy",
    "get",
    "need",
    "want",
    "have",
    "got",
    "please",
    "can",
    "could",
    "would",
    "should",
    // Quantities that are alone (when they're part of ingredient they'll stay)
    "some",
    "more",
    "less",
    "few",
    "many",
    // Prepositions
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "from",
    "of",
    "and",
    "or",
    // Other common words
    "item",
    "items",
    "ingredient",
    "ingredients",
    "food",
    "pantry",
    "list",
];

/**
 * Process transcript to extract only food ingredients
 * - Filters out non-food words
 * - Removes duplicates (case-insensitive)
 * - Cleans up formatting
 */
export function processFoodIngredients(transcript: string): string[] {
    if (!transcript || !transcript.trim()) {
        return [];
    }

    // Split by common separators: comma, "and", newlines, or multiple spaces
    const items = transcript
        .toLowerCase()
        .split(/,|\sand\s|\n|;/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

    // Process each item
    const processedItems: string[] = [];
    const seenItems = new Set<string>();

    for (let item of items) {
        // Remove common quantity prefixes if they're standalone
        item = item.replace(/^\d+\s*(kg|g|lb|oz|ml|l|cups?|tbsp|tsp|pieces?|items?)?\s*/i, "").trim();

        // Split by spaces and filter out non-food words
        const words = item.split(/\s+/);
        const filteredWords = words.filter((word) => {
            const cleanWord = word.replace(/[^a-z0-9]/gi, "").toLowerCase();
            return cleanWord.length > 1 && !NON_FOOD_WORDS.includes(cleanWord);
        });

        // Rejoin the filtered words
        const cleanedItem = filteredWords.join(" ").trim();

        // Only add if it's not empty and not a duplicate
        if (cleanedItem.length > 1) {
            const normalizedItem = cleanedItem.toLowerCase();
            if (!seenItems.has(normalizedItem)) {
                seenItems.add(normalizedItem);
                // Capitalize first letter of each word
                processedItems.push(
                    cleanedItem
                        .split(" ")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")
                );
            }
        }
    }

    return processedItems;
}

/**
 * Process transcript and merge with existing items, avoiding duplicates
 */
export function mergeIngredients(existingItems: string[], newTranscript: string): string[] {
    const newItems = processFoodIngredients(newTranscript);

    // Create a set of normalized existing items for comparison
    const existingNormalized = new Set(existingItems.map((item) => item.toLowerCase().trim()));

    // Filter out duplicates from new items
    const uniqueNewItems = newItems.filter((item) => !existingNormalized.has(item.toLowerCase().trim()));

    return [...existingItems, ...uniqueNewItems];
}
