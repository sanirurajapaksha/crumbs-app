/**
 * Duplicate Detection API using Gemini AI
 * Intelligently identifies duplicate pantry items and suggests merge strategies
 */

import { PantryItem } from '../types';
import { AIProcessingError, ErrorType } from '../utils/errorHandling';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

if (!GOOGLE_API_KEY) {
    console.warn('GOOGLE_API_KEY environment variable is not set. Duplicate detection will use fallback logic.');
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface DuplicateMatch {
    existingItem: PantryItem;
    newItem: PantryItem;
    confidence: number; // 0-1, where 1 is definitely a duplicate
    reason: string; // Human-readable explanation
    suggestedAction: 'merge' | 'separate' | 'replace';
    mergedItem?: PantryItem; // Suggested merged item if action is 'merge'
}

export interface DuplicateCheckResult {
    hasDuplicates: boolean;
    matches: DuplicateMatch[];
    unmatchedNewItems: PantryItem[];
}

// ============================================================================
// Gemini-powered Duplicate Detection
// ============================================================================

/**
 * Build prompt for Gemini to analyze duplicates
 */
function buildDuplicateDetectionPrompt(
    existingItems: PantryItem[],
    newItems: PantryItem[]
): string {
    const existingList = existingItems.map((item, idx) => 
        `${idx + 1}. ${item.name} (${item.quantity || 'unknown quantity'}, ${item.category || 'no category'})`
    ).join('\n');

    const newList = newItems.map((item, idx) => 
        `${idx + 1}. ${item.name} (${item.quantity || 'unknown quantity'}, ${item.category || 'no category'})`
    ).join('\n');

    return `You are an intelligent pantry management assistant. Analyze the following items and identify duplicates or similar items that should be merged.

EXISTING PANTRY ITEMS:
${existingList}

NEW ITEMS TO ADD:
${newList}

RULES FOR DUPLICATE DETECTION:
1. Consider items as duplicates if they are the same food item (e.g., "tomatoes" and "tomato" are the same)
2. Consider singular/plural forms as duplicates (e.g., "onion" and "onions")
3. Consider different quantities of the same item as duplicates (e.g., "2 carrots" and "3 carrots")
4. Consider items with/without packaging descriptions as duplicates (e.g., "milk" and "1 bottle of milk")
5. Do NOT consider different forms as duplicates (e.g., "chicken breast" vs "ground chicken" are different)
6. Do NOT consider different varieties as duplicates (e.g., "red bell pepper" vs "green bell pepper" are different)

For each potential duplicate match, determine:
- confidence: 0.0 to 1.0 (1.0 = definitely duplicate, 0.7+ = likely duplicate, 0.5-0.7 = maybe duplicate)
- suggestedAction: 
  * "merge" - combine quantities (for same items with different quantities)
  * "replace" - replace old with new (for exact duplicates or when new has better info)
  * "separate" - keep as separate items (for items that seem similar but are different)
- mergedQuantity: suggested combined quantity if merging
- reason: brief explanation for your decision

Return ONLY valid JSON (no markdown, no code fences) in this structure:

{
  "matches": [
    {
      "existingItemIndex": 0,
      "newItemIndex": 0,
      "confidence": 0.95,
      "reason": "Same item, different quantities",
      "suggestedAction": "merge",
      "mergedQuantity": "5 units"
    }
  ],
  "unmatchedNewItemIndices": [1, 2]
}

CRITICAL: Return ONLY the JSON object. No explanations, no markdown, no code fences.`;
}

/**
 * Call Gemini API for duplicate detection
 */
async function callGeminiForDuplicateDetection(prompt: string): Promise<any> {
    if (!GOOGLE_API_KEY) {
        throw new AIProcessingError(
            ErrorType.API_QUOTA,
            'Google API key not configured',
            'Fallback to simple duplicate detection'
        );
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`;

    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.3, // Lower temperature for more consistent results
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 1024,
        }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new AIProcessingError(
                ErrorType.API_QUOTA,
                `Gemini API error: ${response.status}`,
                JSON.stringify(errorData)
            );
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
            throw new AIProcessingError(
                ErrorType.PROCESSING,
                'No response from Gemini',
                'API returned empty candidates array'
            );
        }

        const content = data.candidates[0].content.parts[0].text;
        
        // Parse JSON response
        let cleanedText = content.trim();
        if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        return JSON.parse(cleanedText);
    } catch (error) {
        if (error instanceof AIProcessingError) {
            throw error;
        }
        throw new AIProcessingError(
            ErrorType.API_QUOTA,
            'Failed to call Gemini API for duplicate detection',
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
}

// ============================================================================
// Fallback Simple Duplicate Detection
// ============================================================================

/**
 * Simple string-based duplicate detection (fallback when Gemini is unavailable)
 */
function simpleDuplicateDetection(
    existingItems: PantryItem[],
    newItems: PantryItem[]
): DuplicateCheckResult {
    const matches: DuplicateMatch[] = [];
    const unmatchedNewItems: PantryItem[] = [];

    for (const newItem of newItems) {
        const newNameNormalized = newItem.name.toLowerCase().trim()
            .replace(/s$/, '') // Remove plural 's'
            .replace(/[^a-z0-9]/g, ''); // Remove special characters

        let bestMatch: { item: PantryItem; score: number } | null = null;

        for (const existingItem of existingItems) {
            const existingNameNormalized = existingItem.name.toLowerCase().trim()
                .replace(/s$/, '')
                .replace(/[^a-z0-9]/g, '');

            // Exact match
            if (existingNameNormalized === newNameNormalized) {
                bestMatch = { item: existingItem, score: 1.0 };
                break;
            }

            // Substring match
            if (existingNameNormalized.includes(newNameNormalized) || 
                newNameNormalized.includes(existingNameNormalized)) {
                const score = Math.min(newNameNormalized.length, existingNameNormalized.length) /
                    Math.max(newNameNormalized.length, existingNameNormalized.length);
                if (!bestMatch || score > bestMatch.score) {
                    bestMatch = { item: existingItem, score };
                }
            }
        }

        if (bestMatch && bestMatch.score >= 0.8) {
            // High confidence match
            const mergedQuantity = combineQuantities(bestMatch.item.quantity, newItem.quantity);
            
            matches.push({
                existingItem: bestMatch.item,
                newItem: newItem,
                confidence: bestMatch.score,
                reason: bestMatch.score === 1.0 
                    ? 'Exact name match' 
                    : 'Very similar names',
                suggestedAction: 'merge',
                mergedItem: {
                    ...bestMatch.item,
                    quantity: mergedQuantity,
                    expiryDate: chooseBestExpiryDate(bestMatch.item.expiryDate, newItem.expiryDate),
                }
            });
        } else {
            unmatchedNewItems.push(newItem);
        }
    }

    return {
        hasDuplicates: matches.length > 0,
        matches,
        unmatchedNewItems
    };
}

/**
 * Combine quantities intelligently
 */
function combineQuantities(qty1?: string, qty2?: string): string {
    if (!qty1 && !qty2) return '';
    if (!qty1) return qty2 || '';
    if (!qty2) return qty1;

    // Try to parse numeric quantities
    const num1Match = qty1.match(/(\d+\.?\d*)/);
    const num2Match = qty2.match(/(\d+\.?\d*)/);
    const unit1 = qty1.replace(/[\d\.\s]/g, '').trim();
    const unit2 = qty2.replace(/[\d\.\s]/g, '').trim();

    if (num1Match && num2Match && (unit1 === unit2 || !unit1 || !unit2)) {
        const sum = parseFloat(num1Match[1]) + parseFloat(num2Match[1]);
        const unit = unit1 || unit2;
        return `${sum} ${unit}`.trim();
    }

    // Can't combine - return both
    return `${qty1} + ${qty2}`;
}

/**
 * Choose the best expiry date (earliest non-null date)
 */
function chooseBestExpiryDate(date1?: string | null, date2?: string | null): string | null | undefined {
    if (!date1 && !date2) return null;
    if (!date1) return date2;
    if (!date2) return date1;

    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    return d1 < d2 ? date1 : date2;
}

// ============================================================================
// Main Duplicate Detection Function
// ============================================================================

/**
 * Check for duplicates between new items and existing pantry items
 * Uses Gemini AI for intelligent detection, falls back to simple string matching
 */
export async function checkForDuplicates(
    existingItems: PantryItem[],
    newItems: PantryItem[]
): Promise<DuplicateCheckResult> {
    try {
        // If no existing items or no new items, nothing to check
        if (existingItems.length === 0 || newItems.length === 0) {
            return {
                hasDuplicates: false,
                matches: [],
                unmatchedNewItems: newItems
            };
        }

        console.log(`🔍 Checking ${newItems.length} new items against ${existingItems.length} existing items...`);

        // Try Gemini-powered detection first
        try {
            const prompt = buildDuplicateDetectionPrompt(existingItems, newItems);
            const geminiResult = await callGeminiForDuplicateDetection(prompt);

            // Parse Gemini response
            const matches: DuplicateMatch[] = geminiResult.matches.map((match: any) => {
                const existingItem = existingItems[match.existingItemIndex];
                const newItem = newItems[match.newItemIndex];

                return {
                    existingItem,
                    newItem,
                    confidence: match.confidence,
                    reason: match.reason,
                    suggestedAction: match.suggestedAction,
                    mergedItem: match.suggestedAction === 'merge' ? {
                        ...existingItem,
                        quantity: match.mergedQuantity,
                        expiryDate: chooseBestExpiryDate(existingItem.expiryDate, newItem.expiryDate),
                    } : undefined
                };
            });

            const matchedNewIndices = new Set(geminiResult.matches.map((m: any) => m.newItemIndex));
            const unmatchedNewItems = newItems.filter((_, idx) => !matchedNewIndices.has(idx));

            console.log(`✅ Gemini detected ${matches.length} potential duplicates`);

            return {
                hasDuplicates: matches.length > 0,
                matches,
                unmatchedNewItems
            };
        } catch (geminiError) {
            console.warn('⚠️  Gemini duplicate detection failed, using fallback:', geminiError);
            
            // Fallback to simple detection
            const fallbackResult = simpleDuplicateDetection(existingItems, newItems);
            console.log(`✅ Fallback detected ${fallbackResult.matches.length} potential duplicates`);
            return fallbackResult;
        }
    } catch (error) {
        console.error('❌ Duplicate detection failed:', error);
        
        // Return all as unmatched on critical error
        return {
            hasDuplicates: false,
            matches: [],
            unmatchedNewItems: newItems
        };
    }
}

/**
 * Merge two pantry items intelligently
 */
export function mergePantryItems(item1: PantryItem, item2: PantryItem): PantryItem {
    return {
        ...item1,
        quantity: combineQuantities(item1.quantity, item2.quantity),
        expiryDate: chooseBestExpiryDate(item1.expiryDate, item2.expiryDate),
        // Use more recent addedAt
        addedAt: item1.addedAt && item2.addedAt && new Date(item1.addedAt) > new Date(item2.addedAt)
            ? item1.addedAt
            : item2.addedAt || item1.addedAt,
        // Prefer non-empty values
        category: item1.category || item2.category,
        imageUrl: item1.imageUrl || item2.imageUrl,
    };
}

/**
 * Auto-resolve high-confidence duplicates (confidence >= 0.9)
 * Returns items that should be added and items that need user confirmation
 */
export function autoResolveDuplicates(result: DuplicateCheckResult): {
    autoMerged: DuplicateMatch[];
    needsConfirmation: DuplicateMatch[];
    safeToAdd: PantryItem[];
} {
    const autoMerged: DuplicateMatch[] = [];
    const needsConfirmation: DuplicateMatch[] = [];

    for (const match of result.matches) {
        if (match.confidence >= 0.9 && match.suggestedAction === 'merge') {
            autoMerged.push(match);
        } else {
            needsConfirmation.push(match);
        }
    }

    return {
        autoMerged,
        needsConfirmation,
        safeToAdd: result.unmatchedNewItems
    };
}
