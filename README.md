# AI Autocorrect & Tone Changer Tool

A sleek, modern web application that leverages the power of the Google Gemini API to provide real-time grammar and spelling correction, as well as the ability to rewrite text in different tones. The project features a responsive, animated UI and a secure, serverless backend built with Netlify Functions.

![Project Screenshot](IMAGE/previewof.png) <!-- TODO: Add a screenshot of the app to an 'assets' folder -->
 
**[➡️ View Live Demo](arpcorrect.netlify.app)** <!-- TODO: Replace with your deployed site URL -->

## ✨ Features

*   **AI-Powered Correction**: Corrects grammar, spelling, and punctuation mistakes in user-provided text.
*   **Error Highlighting**: Visually identifies and highlights the specific words that were corrected in the original text.
*   **Tone Changer**: Rewrites the corrected text into different tones:
    *   💼 **Professional**: For formal business communication.
    *   😊 **Friendly**: For more casual and warm correspondence.
    *   ✂️ **Concise**: To make the text as clear and brief as possible.
*   **Secure API Calls**: All communication with the Google Gemini API is handled by a serverless backend, keeping the API key safe.
*   **Modern UI**: A clean, responsive, and aesthetically pleasing interface with subtle animations and a dynamic gradient background.
*   **Copy to Clipboard**: Easily copy the corrected text with a single click.

## 🛠️ Technologies Used

*   **Frontend**:
    *   HTML5
    *   CSS3 (with animations and responsive design)
    *   JavaScript (ES6+, `async/await`, `fetch`)
*   **Backend**:
    *   Netlify Functions (Serverless Node.js)
*   **AI**:
    *   Google Gemini API (specifically `gemini-2.5-flash`)

## 📂 Project Structure

```
AUTOCORRECT_TOOL/
├── api/
│   ├── correct.js        # Netlify function for text correction
│   └── changetone.js     # Netlify function for changing text tone
├── index.html            # Main HTML file
├── script.js             # Frontend JavaScript for DOM manipulation and API calls
├── style.css             # All CSS styles and animations
└── README.md             # You are here!
```

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

1.  **Node.js**: Make sure you have Node.js installed.
2.  **Netlify Account**: You will need a free Netlify account to deploy and run the serverless functions.
3.  **Google Gemini API Key**:
    *   Go to the Google AI for Developers website.
    *   Click on "Get API key in Google AI Studio" and create a new API key.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

4.  **Set Environment Variable:**
    You need to set your Google Gemini API key as an environment variable in Netlify. This keeps it secure and out of the frontend code.

    Run the following command in your terminal:
    ```bash
    netlify env:set GEMINI_API_KEY YOUR_API_KEY_HERE
    ```
    Replace `YOUR_API_KEY_HERE` with the actual key you obtained from Google AI Studio.

## ⚙️ How It Works

1.  The user enters text into the input textarea on the `index.html` page.
2.  When the "Correct Text" button is clicked, `script.js` sends the text to the backend serverless function at `/api/correct`.
3.  The `api/correct.js` function receives the request. It securely adds the `GEMINI_API_KEY` and calls the Google Gemini API with a detailed system prompt, asking for the corrected text and a list of incorrect words in a specific JSON format.
4.  The Gemini API processes the text and returns the structured JSON data.
5.  The Netlify function parses the response and sends the `correctedText` and `wrongWords` array back to the frontend.
6.  `script.js` receives the data, displays the corrected text, and uses the `wrongWords` array to highlight the mistakes in the original input.
7.  The "Change Tone" buttons work similarly, calling the `/api/changeTone` function with the current text and the desired tone.

## ✒️ Author

*   Designed by **Arpan®**
