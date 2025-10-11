/**
 * Simple test script to verify Gemini recipe generation and Pollinations.AI image generation
 * Run with: node test-ai-integration.js
 */

// Load environment variables
require('dotenv').config();

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

console.log('\n🧪 Testing AI Recipe Integration\n');
console.log('================================\n');

// Test 1: Check API Key
console.log('1️⃣ Checking Google API Key...');
if (!GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_API_KEY not found in .env file');
    process.exit(1);
}
console.log(`✅ Google API Key found: ${GOOGLE_API_KEY.substring(0, 10)}...${GOOGLE_API_KEY.substring(GOOGLE_API_KEY.length - 5)}`);

// Test 2: Test Gemini API
async function testGeminiAPI() {
    console.log('\n2️⃣ Testing Gemini API Connection...');
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: 'Generate a simple JSON recipe with chicken and rice. Return only JSON with fields: recipe_name, ingredients (array), instructions (array). Keep it brief.'
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
        }
    };

    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Gemini API Error:', response.status, errorData);
            return false;
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0) {
            const content = data.candidates[0].content.parts[0].text;
            console.log('✅ Gemini API is working!');
            console.log('📝 Sample response preview:');
            console.log(content.substring(0, 200) + '...\n');
            return true;
        } else {
            console.error('❌ Gemini API returned empty response');
            return false;
        }
    } catch (error) {
        console.error('❌ Error calling Gemini API:', error.message);
        return false;
    }
}

// Test 3: Test Pollinations.AI Image Generation
async function testPollinationsAI() {
    console.log('3️⃣ Testing Pollinations.AI Image Generation...');
    
    const recipeName = 'Delicious Chicken Rice Bowl';
    const prompt = encodeURIComponent(
        `Professional food photography of ${recipeName}, high resolution, appetizing, natural lighting`
    );
    
    const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=400&height=300&nologo=true&seed=${Date.now()}`;
    
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(imageUrl, { method: 'HEAD' });
        
        if (response.ok) {
            console.log('✅ Pollinations.AI is working!');
            console.log('🖼️  Test image URL:', imageUrl.substring(0, 100) + '...\n');
            return true;
        } else {
            console.error('❌ Pollinations.AI returned error:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Error testing Pollinations.AI:', error.message);
        return false;
    }
}

// Test 4: Test Full Recipe Generation Flow
async function testFullRecipeGeneration() {
    console.log('4️⃣ Testing Full Recipe Generation Flow...');
    
    const prompt = `You are a professional chef. Create a detailed recipe using these ingredients: chicken breast, rice, garlic, olive oil.

Generate a complete recipe. Return ONLY valid JSON (no markdown, no code fences) in this EXACT structure:

{
  "recipe_name": "Recipe Name",
  "description": "Brief description",
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "total_time_minutes": 45,
  "servings": 2,
  "difficulty_level": "Easy",
  "ingredients": [
    {"name": "chicken breast", "amount": "500g"}
  ],
  "instructions": [
    {"step_number": 1, "instruction": "Step text", "duration_minutes": 5}
  ],
  "nutritional_info": {
    "calories_kcal": 400,
    "protein_g": 30,
    "carbs_g": 45,
    "fat_g": 12
  },
  "tags": ["quick", "healthy"],
  "cooking_tips": ["Tip 1"]
}

CRITICAL: Return ONLY the JSON object.`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
        }
    };

    try {
        const fetch = (await import('node-fetch')).default;
        
        console.log('   📡 Calling Gemini API...');
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ API Error:', response.status, errorData);
            return false;
        }

        const data = await response.json();
        let responseText = data.candidates[0].content.parts[0].text;
        
        console.log('   📥 Response received, parsing...');
        
        // Clean markdown code fences
        if (responseText.startsWith('```json')) {
            responseText = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (responseText.startsWith('```')) {
            responseText = responseText.replace(/^```\n/, '').replace(/\n```$/, '');
        }
        
        const recipe = JSON.parse(responseText.trim());
        
        console.log('✅ Recipe generated successfully!');
        console.log('📋 Recipe:', recipe.recipe_name);
        console.log('⏱️  Time:', recipe.total_time_minutes, 'minutes');
        console.log('🔥 Calories:', recipe.nutritional_info.calories_kcal, 'kcal');
        console.log('🥩 Protein:', recipe.nutritional_info.protein_g, 'g');
        console.log('📝 Ingredients:', recipe.ingredients.length);
        console.log('👨‍🍳 Steps:', recipe.instructions.length);
        
        // Test image generation for this recipe
        console.log('\n   🎨 Generating image for recipe...');
        const imagePrompt = encodeURIComponent(
            `Professional food photography of ${recipe.recipe_name}, high resolution, appetizing, natural lighting`
        );
        const imageUrl = `https://image.pollinations.ai/prompt/${imagePrompt}?width=1024&height=768&nologo=true&seed=${Date.now()}`;
        
        const imageResponse = await fetch(imageUrl, { method: 'HEAD' });
        if (imageResponse.ok) {
            console.log('   ✅ Image generated successfully!');
            console.log('   🖼️  Image URL:', imageUrl.substring(0, 80) + '...');
        }
        
        console.log('\n✅ Full recipe generation flow working!\n');
        return true;
    } catch (error) {
        console.error('❌ Error in full recipe generation:', error.message);
        if (error.message.includes('JSON')) {
            console.error('   Parse error - Gemini may have returned malformed JSON');
        }
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('Starting tests...\n');
    
    let allPassed = true;
    
    // Test Gemini
    const geminiResult = await testGeminiAPI();
    allPassed = allPassed && geminiResult;
    
    // Test Pollinations
    const pollinationsResult = await testPollinationsAI();
    allPassed = allPassed && pollinationsResult;
    
    // Test full flow
    const fullFlowResult = await testFullRecipeGeneration();
    allPassed = allPassed && fullFlowResult;
    
    console.log('================================\n');
    if (allPassed) {
        console.log('🎉 All tests passed! Your AI integration is working correctly.\n');
        console.log('✅ Gemini API: Working');
        console.log('✅ Pollinations.AI: Working');
        console.log('✅ Recipe Generation: Working');
        console.log('\nYou can now use the AI recipe generation in your app! 🚀\n');
    } else {
        console.log('❌ Some tests failed. Please check the errors above.\n');
        process.exit(1);
    }
}

// Check if node-fetch is available
(async () => {
    try {
        await import('node-fetch');
    } catch (error) {
        console.log('\n📦 Installing required dependency: node-fetch...\n');
        const { execSync } = require('child_process');
        execSync('npm install node-fetch@2', { stdio: 'inherit' });
        console.log('\n✅ Dependency installed. Running tests...\n');
    }
    
    await runAllTests();
})();
