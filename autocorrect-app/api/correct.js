// api/correct.js

// FIX: Using a more specific and stable model name for the v1beta API.
const GEMINI_MODEL = 'gemini-2.5-flash-preview-05-20';

// This is an ES Module handler, standard for modern Netlify functions.
export default async (req) => {
    // 1. We only accept POST requests
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // 2. Get the user's text and prompt from the request body
        const { text, systemPrompt } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY; // 3. Securely get the API key

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key is not configured.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        if (!text || !systemPrompt) {
            return new Response(JSON.stringify({ error: 'Both "text" and "systemPrompt" are required.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: text }] }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        // 4. Call the Gemini API from the secure backend
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error("API Error:", result);
            throw new Error(result.error?.message || `API request failed with status ${apiResponse.status}`);
        }
        
        const candidate = result.candidates?.[0];

        if (candidate?.finishReason === 'SAFETY') {
             return new Response(JSON.stringify({ error: 'The request was blocked due to safety concerns. Please modify your input.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (candidate && candidate.content?.parts?.[0]?.text) {
            const generatedText = candidate.content.parts[0].text;
            const sources = [];
            
            // 5. Send the clean, expected object back
            return new Response(JSON.stringify({ text: generatedText.trim(), sources }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            console.error("Unexpected API response structure:", result);
            return new Response(JSON.stringify({ error: "Invalid response structure from the AI API." }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

    } catch (error) {
        console.error('Internal Server Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'An internal error occurred.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};