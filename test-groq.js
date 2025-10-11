import { analyzeImageForPantryItems } from './app/api/groqApi';

// Simple test function to verify API connectivity
async function testGroqAPI() {
    try {
        // Test with a simple base64 image (a small 1x1 pixel PNG)
        const simpleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        
        console.log('Testing Groq API connection...');
        const result = await analyzeImageForPantryItems(simpleBase64);
        console.log('API test successful:', result);
        return true;
    } catch (error) {
        console.error('API test failed:', error);
        return false;
    }
}

testGroqAPI();