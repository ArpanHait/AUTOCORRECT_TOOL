// --- Gemini API Configuration ---
// These definitions are now secure on the backend
const SYSTEM_INSTRUCTION = `You are an expert proofreader. Your task is to correct grammar, spelling, and punctuation errors in the provided text.
You MUST respond in the requested JSON format.
Your response must include:
1.  'correctedText': The full, corrected version of the text.
2.  'wrongWords': An array of strings. Each string must be an *exact* word or phrase from the *original* text that you identified as incorrect (e.g., 'mispelled', 'grammer', 'their are'). Only include words that were actually changed.`;
        
const RESPONSE_SCHEMA = {
    type: "OBJECT",
    properties: {
        "correctedText": { "type": "STRING" },
        "wrongWords": {
            "type": "ARRAY",
            "items": { "type": "STRING" }
        }
    },
    required: ["correctedText", "wrongWords"]
};

// The main Netlify Function handler
// Netlify automatically knows 'exports.handler' is the function to run
exports.handler = async (event, context) => {
    // 1. Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        // 2. Get the user's text from the frontend's request
        const { inputText } = JSON.parse(event.body);
        if (!inputText) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'inputText is required' }),
            };
        }

        // 3. SECURELY get the API key from Netlify Environment Variables
        // You must set GEMINI_API_KEY in your Netlify dashboard
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            // This error will only show in your Netlify logs, not to the user
            console.error('API key is missing from environment variables');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error' }),
            };
        }
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

        // 4. Construct the payload to send to Gemini
        const payload = {
            contents: [{
                parts: [{ text: inputText }]
            }],
            systemInstruction: {
                parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA
            }
        };

        // 5. Call the real Gemini API
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

        // 6. Parse the Gemini response
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error("Invalid response structure from Gemini API.");
        }

        const parsedJson = JSON.parse(text);
        const correctedText = parsedJson.correctedText || "";
        const wrongWords = parsedJson.wrongWords || [];

        // 7. Send the clean data back to the frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ correctedText, wrongWords })
        };

    } catch (error) {
        console.error('Error in Netlify function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || 'An unknown server error occurred' })
        };
    }
};