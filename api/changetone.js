/**
 * NEW NETLIFY FUNCTION
 * File: /api/changeTone.js
 *
 * This function securely calls the Gemini API to rewrite text based on a given tone.
 */

exports.handler = async (event, context) => {
    // 1. Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        // 2. Get data from the frontend
        const { inputText, tone } = JSON.parse(event.body);
        if (!inputText || !tone) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'inputText and tone are required' }),
            };
        }

        // 3. SECURELY get the API key
        // This relies on you setting GEMINI_API_KEY in your Netlify dashboard
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('API key is missing from environment variables');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error' }),
            };
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

        // 4. Create the correct System Prompt based on the tone
        let systemPrompt = "You are an expert writing assistant. Please rewrite the following text.";
        switch (tone) {
            case 'professional':
                systemPrompt = "You are an expert editor. Rewrite the following text to be more formal, polite, and suitable for a professional business setting. Do not add any extra commentary, just provide the rewritten text.";
                break;
            case 'friendly':
                systemPrompt = "You are an expert editor. Rewrite the following text to be more casual, warm, and friendly, as if speaking to a colleague. Use contractions and simpler language. Do not add any extra commentary, just provide the rewritten text.";
                break;
            case 'concise':
                systemPrompt = "You are an expert editor. Rewrite the following text to be as clear and concise as possible. Remove all filler words, repetition, and unnecessary phrases. Do not add any extra commentary, just provide the rewritten text.";
                break;
            // Add other tones here if needed
            default:
                console.warn(`Unknown tone received: ${tone}`);
                // Use a generic prompt if tone is unrecognized
                systemPrompt = `You are an expert writing assistant. Please rewrite the following text in a ${tone} tone.`; 
                break;
        }

        // 5. Construct the payload for Gemini
        const payload = {
            contents: [{
                parts: [{ text: inputText }]
            }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            }
            // Note: We are asking for plain text, so we DON'T use responseSchema
        };

        // 6. Call the real Gemini API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error('Gemini API Error:', errorBody);
            throw new Error(errorBody.error?.message || `Gemini API failed with status ${response.status}`);
        }

        const result = await response.json();

        // 7. Parse the Gemini response (plain text)
        const newText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (newText === undefined) { // Check specifically for undefined
            console.error("Gemini response missing text:", result);
            throw new Error("Invalid response structure from Gemini API (missing text).");
        }

        // 8. Send the clean data back to the frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ newText: newText.trim() }) // Send the rewritten text
        };

    } catch (error) {
        console.error('Error in changeTone function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'An unknown server error occurred' })
        };
    }
};