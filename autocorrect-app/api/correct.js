// api/correct.js

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
        if (!text) {
            return res.status(400).json({ error: 'Text to process is required.' });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

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
            throw new Error(`API request failed with status ${apiResponse.status}`);
        }

        const result = await apiResponse.json();
        const candidate = result.candidates?.[0];

        // --- THIS IS THE IMPORTANT CHANGE ---
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
        res.status(500).json({ error: 'An internal error occurred.' });
    }
}