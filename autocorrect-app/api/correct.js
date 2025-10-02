// api/correct.js

const GEMINI_MODEL = 'gemini-1.5-flash-latest'; // Use a stable, updated model

export default async function handler(req, res) {
    // 1. We only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // 2. Get the user's text and prompt from the request body
        const { text, systemPrompt } = req.body;
        const apiKey = process.env.GEMINI_API_KEY; // 3. Securely get the API key

        if (!apiKey) {
            return res.status(500).json({ error: 'API key is not configured.' });
        }
        // Validate both required inputs
        if (!text || !systemPrompt) {
            return res.status(400).json({ error: 'Both "text" and "systemPrompt" are required.' });
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

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.json();
            console.error("API Error:", errorBody);
            // Propagate the specific error message from the API
            throw new Error(errorBody.error?.message || `API request failed with status ${apiResponse.status}`);
        }

        const result = await apiResponse.json();
        const candidate = result.candidates?.[0];

        // --- THIS IS THE IMPORTANT CHANGE ---
        // Handle cases where the response was blocked for safety reasons
        if (candidate?.finishReason === 'SAFETY') {
            return res.status(400).json({ error: 'The request was blocked due to safety concerns. Please modify your input.' });
        }

        // 5. Process the response and send a clean object to the frontend
        if (candidate && candidate.content?.parts?.[0]?.text) {
            const generatedText = candidate.content.parts[0].text;
            // For now, we are not using sources, so we send an empty array
            const sources = [];
            
            // Send the clean, expected object back
            res.status(200).json({ text: generatedText.trim(), sources });
        } else {
            // If the structure is unexpected, send an error
            console.error("Unexpected API response structure:", result);
            res.status(500).json({ error: "Invalid response structure from the AI API." });
        }

    } catch (error) {
        console.error('Internal Server Error:', error);
        // Return the specific error message for better client-side debugging
        res.status(500).json({ error: error.message || 'An internal error occurred.' });
    }
}