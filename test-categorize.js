import { categorizeIngredient } from "./app/api/groqApi.js";

async function testCategorization() {
    console.log('Testing categorization for "chicken"...\n');

    try {
        const result = await categorizeIngredient("chicken");
        console.log("Result:", result);
        console.log("Type:", typeof result);
        console.log("Length:", result.length);
        console.log("Trimmed:", result.trim());
        console.log("Lowercase:", result.toLowerCase());
    } catch (error) {
        console.error("Error:", error);
    }
}

testCategorization();
