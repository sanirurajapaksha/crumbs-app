import Groq from "groq-sdk";
import { PantryItem } from "../types";

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY environment variable is required");
}

// Initialize Groq client
const groq = new Groq({
    apiKey: GROQ_API_KEY,
});

export interface DetectedItem {
    name: string;
    category?: string;
    confidence?: number;
    quantity?: string;
}

export interface VisionAnalysisResult {
    items: DetectedItem[];
    rawResponse: string;
}

export interface AudioTranscriptionResult {
    text: string;
    items: DetectedItem[];
}

// Analyze image using LLaVA-v1.5-7b-4096 model
export async function analyzeImageForPantryItems(base64Image: string): Promise<VisionAnalysisResult> {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analyze this image and identify all food items, ingredients, and pantry items visible.
                            For each item, provide:
                            1. The specific name of the item
                            2. The category - choose from: vegetables, fruits, dairy & eggs, meat & poultry, seafood, grains & cereals, legumes & nuts, spices & herbs, oils & condiments, beverages, baking & desserts, frozen foods, or canned goods
                            3. If visible, estimate the quantity or amount

                            Return the response in this exact JSON format:
                            {
                                "items": [
                                    {
                                        "name": "item name",
                                        "category": "category from the list above",
                                        "quantity": "estimated quantity or amount",
                                        "confidence": 0.95
                                    }
                                ]
                            }

                            IMPORTANT: Always assign a specific category from the list. Do not use "other" or generic categories.
                            Focus on identifying actual food items and ingredients, not packaging or containers unless they clearly indicate the contents.`,
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.3,
            max_completion_tokens: 1024,
        });

        const response = completion.choices[0]?.message?.content || "";

        // Try to parse JSON from response
        let items: DetectedItem[] = [];
        try {
            // Extract JSON from response if it's wrapped in other text
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                items = parsed.items || [];
            }
        } catch (parseError) {
            console.log("JSON parsing failed, extracting items manually from:", response, parseError);
            // Fallback: extract items manually from text response
            items = extractItemsFromText(response);
        }

        return {
            items,
            rawResponse: response,
        };
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw new Error("Failed to analyze image for pantry items");
    }
}

// Transcribe audio and extract pantry items mentioned
export async function transcribeAudioForPantryItems(audioUri: string): Promise<AudioTranscriptionResult> {
    try {
        // For now, we'll skip audio transcription and return a mock result
        // Audio transcription in React Native requires more complex setup
        console.log("Audio transcription requested for:", audioUri);

        // Mock transcription for demonstration
        const mockText = "I have apples, bananas, and milk in my pantry";

        // Extract items from mock text
        const itemCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: `Analyze this speech transcription and extract all food items, ingredients, and pantry items mentioned.

                    Transcription: "${mockText}"

                    For each food item mentioned, provide:
                    1. The specific name of the item
                    2. The category - choose from: vegetables, fruits, dairy & eggs, meat & poultry, seafood, grains & cereals, legumes & nuts, spices & herbs, oils & condiments, beverages, baking & desserts, frozen foods, or canned goods
                    3. Any quantity mentioned (if available)

                    Return the response in this exact JSON format:
                    {
                        "items": [
                            {
                                "name": "item name",
                                "category": "category from the list above",
                                "quantity": "mentioned quantity",
                                "confidence": 0.95
                            }
                        ]
                    }

                    IMPORTANT: Always assign a specific category from the list. Do not use "other" or generic categories.
                    Only include actual food items and ingredients, not cooking actions or other non-food mentions.`,
                },
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.3,
            max_completion_tokens: 1024,
        });

        const responseText = itemCompletion.choices[0]?.message?.content || "";

        // Try to parse JSON from response
        let items: DetectedItem[] = [];
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                items = parsed.items || [];
            }
        } catch (parseError) {
            console.log("JSON parsing failed, extracting items manually from:", responseText, parseError);
            items = extractItemsFromText(responseText);
        }

        return {
            text: mockText,
            items,
        };
    } catch (error) {
        console.error("Error transcribing audio:", error);
        throw new Error("Failed to transcribe audio for pantry items");
    }
}

// Fallback function to extract items from text response when JSON parsing fails
function extractItemsFromText(text: string): DetectedItem[] {
    const items: DetectedItem[] = [];
    const lines = text.split("\n");

    for (const line of lines) {
        // Look for lines that might contain item information
        const itemMatch = line.match(/(?:name|item):\s*([^,\n]+)/i);
        const categoryMatch = line.match(/category:\s*([^,\n]+)/i);
        const quantityMatch = line.match(/(?:quantity|amount):\s*([^,\n]+)/i);

        if (itemMatch) {
            const item: DetectedItem = {
                name: itemMatch[1].trim(),
                confidence: 0.8,
            };

            if (categoryMatch) {
                item.category = categoryMatch[1].trim();
            }

            if (quantityMatch) {
                item.quantity = quantityMatch[1].trim();
            }

            items.push(item);
        }
    }

    return items;
}

// Categorize a single ingredient using AI
export async function categorizeIngredient(ingredientName: string): Promise<string> {
    console.log(`[categorizeIngredient] Starting categorization for: "${ingredientName}"`);

    try {
        if (!GROQ_API_KEY) {
            console.error("[categorizeIngredient] GROQ_API_KEY is not set");
            return "other";
        }

        console.log("[categorizeIngredient] Calling Groq API...");
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: `You are a food categorization assistant. Categorize the following food item into EXACTLY ONE of these categories:

vegetables
fruits
dairy & eggs
meat & poultry
seafood
grains & cereals
legumes & nuts
spices & herbs
oils & condiments
beverages
baking & desserts
frozen foods
canned goods

Food item: "${ingredientName}"

RULES:
1. Respond with ONLY the category name, nothing else
2. Use lowercase
3. Match the exact category name from the list above
4. Do not add explanations, punctuation, or extra words

Examples:
tomato → vegetables
chicken → meat & poultry
chicken breast → meat & poultry
olive oil → oils & condiments
flour → baking & desserts
rice → grains & cereals`,
                },
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.1,
            max_completion_tokens: 50,
        });

        const rawCategory = completion.choices[0]?.message?.content;

        // Clean up the response - remove any extra whitespace, newlines, quotes, etc.
        const cleanedCategory = rawCategory
            ?.trim()
            .toLowerCase()
            .replace(/^["']|["']$/g, "") // Remove quotes
            .replace(/\n.*/g, "") // Remove everything after first newline
            .replace(/→/g, "") // Remove arrow if present
            .trim();

        console.log("Categorization Debug:", {
            ingredientName,
            rawCategory,
            cleanedCategory,
        });

        // Validate the category is one of our accepted categories
        const validCategories = [
            "vegetables",
            "fruits",
            "dairy & eggs",
            "meat & poultry",
            "seafood",
            "grains & cereals",
            "legumes & nuts",
            "spices & herbs",
            "oils & condiments",
            "beverages",
            "baking & desserts",
            "frozen foods",
            "canned goods",
        ];

        // Check if the cleaned category is valid
        const result = cleanedCategory && validCategories.includes(cleanedCategory) ? cleanedCategory : "other";

        console.log("Final category result:", result);
        return result;
    } catch (error) {
        console.error("[categorizeIngredient] Error categorizing ingredient:", error);
        console.error("[categorizeIngredient] Error details:", {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return "other"; // Default fallback category
    }
}

// Convert detected items to PantryItem format with AI categorization
export async function convertToPantryItems(detectedItems: DetectedItem[], userId?: string): Promise<PantryItem[]> {
    // Map each item and ensure it has a proper category using AI if needed
    const itemPromises = detectedItems.map(async (item) => {
        let category = item.category;

        // If no category or category is "Other", use AI to categorize
        if (!category || category.toLowerCase() === "other") {
            try {
                category = await categorizeIngredient(item.name);
            } catch (error) {
                console.error(`Failed to categorize ${item.name}, using fallback:`, error);
                category = "other";
            }
        }

        return {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId,
            name: item.name,
            category: category,
            quantity: item.quantity || "1",
            addedAt: new Date().toISOString(),
        };
    });

    return Promise.all(itemPromises);
}
