// --- DOM Elements ---
const inputTextarea = document.getElementById('input-text');
const inputDisplay = document.getElementById('input-display');
const outputContainer = document.getElementById('output-container');
const outputTextarea = document.getElementById('output-text');

const correctBtn = document.getElementById('correct-btn');
const correctBtnText = document.getElementById('correct-btn-text');
const clearBtn = document.getElementById('clear-btn');
const copyBtn = document.getElementById('copy-btn');
const copyMsg = document.getElementById('copy-msg');

const loader = document.getElementById('loader');
const checkIconBox = document.getElementById('check-icon-box'); 
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const particlesContainer = document.getElementById('particles-container');

const toneChangerContainer = document.getElementById('tone-changer-container');
const toneLoader = document.getElementById('tone-loader');
const btnProfessional = document.getElementById('btn-professional');
const btnFriendly = document.getElementById('btn-friendly');
const btnConcise = document.getElementById('btn-concise');


// --- API Configuration ---
// The API call is now made to our OWN backend function
// This path matches your 'api/correct.js' file structure
const apiFunctionUrl = '/api/correct';                                                                     
correctBtn.addEventListener('click', handleCorrect);
clearBtn.addEventListener('click', handleClear);
copyBtn.addEventListener('click', handleCopy);

btnProfessional.addEventListener('click', () => handleChangeTone('professional'));
btnFriendly.addEventListener('click', () => handleChangeTone('friendly'));
btnConcise.addEventListener('click', () => handleChangeTone('concise'));

document.addEventListener('DOMContentLoaded', () => {
    generateParticles(30); // Generate 30 particles
});

// ADD this variable near the top of your script
let errorHideTimeout; 

function showError(message) {
    // Clear any existing timeout to hide the message
    if (errorHideTimeout) {
        clearTimeout(errorHideTimeout);
    }
    
    errorMessage.classList.remove('hidden'); // <-- ADD THIS LINE
    errorText.textContent = message || "An unknown error occurred.";
    errorMessage.classList.add('show');

    // Set a new timeout to hide the message
    errorHideTimeout = setTimeout(() => {
        errorMessage.classList.remove('show');
        // errorMessage.classList.add('hidden'); // Optional: re-add hidden if needed after transition
        errorHideTimeout = null; // Clear the timeout reference
    }, 5000); // Hide after 5 seconds
}

function setLoading(isLoading) {
    if (isLoading) {
        loader.classList.remove('hidden');
        checkIconBox.classList.add('hidden'); 
        correctBtnText.textContent = 'Correcting...';
        correctBtn.disabled = true;
        clearBtn.disabled = true; 
    } else {
        loader.classList.add('hidden');
        checkIconBox.classList.remove('hidden'); 
        correctBtnText.textContent = 'Correct Text';
        correctBtn.disabled = false;
        clearBtn.disabled = false; 
    }
}

async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            // Try to parse error from our backend function
            const err = await response.json();
            throw new Error(err.error || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    } catch (error) {
        if (retries > 0) {
            await new Promise(res => setTimeout(res, delay));
            return fetchWithRetry(url, options, retries - 1, delay * 2);
        } else {
            // This will now catch the error from our backend
            throw error;
        }
    }
}

async function handleCorrect() {
    const inputText = inputTextarea.value;
    if (!inputText.trim()) {
        showError("Please enter some text to correct.");
        return;
    }

    setLoading(true);
    
    // This is the payload we send to OUR backend function
    const payload = {
        inputText: inputText
    };

    try {
        // Call our own Netlify function at /api/correct
        const result = await fetchWithRetry(apiFunctionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        // Our backend sends the data back in the format we need
        const { correctedText, wrongWords } = result;

        if (correctedText === undefined || wrongWords === undefined) {
             throw new Error("Invalid response structure from backend function.");
        }
        
        displayResults(correctedText, wrongWords);

    } catch (error) {
        console.error('Error during correction:', error);
        // Show the user the error message from our backend
        showError(`Failed to get correction: ${error.message}`);
        setLoading(false);
    }
}

function displayResults(correctedText, wrongWords) {
    outputTextarea.value = correctedText;

    const originalText = inputTextarea.value;
    
    let highlightedHtml = originalText
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    highlightedHtml = highlightedHtml.replace(/\n/g, "<br>");

    const uniqueWords = [...new Set(wrongWords)];

    for (const word of uniqueWords) {
        const safeWord = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(?!<mark>)\\b(${safeWord})\\b(?!<\\/mark>)`, 'gi');
        highlightedHtml = highlightedHtml.replace(regex, `<mark>$1</mark>`);
    }

    inputDisplay.innerHTML = highlightedHtml;

    setLoading(false);
    inputTextarea.classList.add('hidden');
    inputDisplay.classList.remove('hidden');
    
    outputContainer.classList.remove('hidden');
    copyBtn.classList.remove('hidden');
    clearBtn.classList.remove('hidden'); 
    correctBtn.classList.add('hidden'); 
    correctBtn.disabled = true; 
    clearBtn.disabled = false; 
    toneChangerContainer.classList.remove('hidden');
}

function handleClear() {
    // 1. Clear the content of text areas and the highlighted display
    inputTextarea.value = '';
    outputTextarea.value = '';
    inputDisplay.innerHTML = '';
    
    // 2. Reset UI visibility to the initial state
    inputTextarea.classList.remove('hidden'); // Show the input textarea
    inputDisplay.classList.add('hidden');     // Hide the highlighted display
    
    outputContainer.classList.add('hidden');  // Hide the entire output section
    copyBtn.classList.add('hidden');          // Hide the copy button
    clearBtn.classList.add('hidden');         // Hide the clear button
    correctBtn.classList.remove('hidden');    // Show the main correct button again
    
    // 3. Reset button states
    correctBtn.disabled = false;
    clearBtn.disabled = true; // Disable clear since there's nothing to clear

    // 4. Hide any active messages or secondary UI
    copyMsg.classList.add('hidden');
    if (errorHideTimeout) {
        clearTimeout(errorHideTimeout);
        errorHideTimeout = null;
    }
    errorMessage.classList.remove('show');
    toneChangerContainer.classList.add('hidden');
}

function handleCopy() {
    outputTextarea.select();
    document.execCommand('copy');
    window.getSelection().removeAllRanges();

    copyMsg.classList.remove('hidden');
    setTimeout(() => {
        copyMsg.classList.add('hidden');
    }, 2000);
}


// NEW: Particle generation functions
function generateParticles(numParticles) {
    for (let i = 0; i < numParticles; i++) {
        createParticle();
    }
}

function createParticle() {
    if (!particlesContainer) return; // Safety check
    
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particlesContainer.appendChild(particle);

    // Randomize size
    const size = Math.random() * 8 + 4; // 4px to 12px
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Randomize starting position
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.top = `${Math.random() * 100}vh`;

    // Randomize animation duration and delay
    const duration = Math.random() * 15 + 10; // 10s to 25s
    const delay = Math.random() * 10; // 0s to 10s
    const floatDistance = Math.random() * 50 + 20; // 20px to 70px

    particle.style.setProperty('--duration', `${duration}s`);
    particle.style.setProperty('--delay', `${delay}s`);
    particle.style.setProperty('--float-distance', `${floatDistance}px`);
    
    // Set animation delay
    particle.style.animationDelay = `${delay}s`;

    // Remove particle after animation ends to prevent memory leak and regenerate
    particle.addEventListener('animationend', (e) => {
        // Check if the event is the one we care about
        if (e.animationName === 'float-and-fade') {
            particle.remove();
            // Create a new particle to keep the loop going
            // Add a small delay to avoid instant re-creation
            setTimeout(createParticle, 50); 
        }
    });
}


function setToneLoading(isLoading) {
    // Disable buttons
    btnProfessional.disabled = isLoading;
    btnFriendly.disabled = isLoading;
    btnConcise.disabled = isLoading;

    // Show/hide loader
    if (isLoading) {
        toneLoader.classList.remove('hidden');
    } else {
        toneLoader.classList.add('hidden');
    }
}

async function handleChangeTone(tone) {
    const currentText = outputTextarea.value;
    if (!currentText.trim()) {
        showError("There is no text to change.");
        return;
    }

    setToneLoading(true);

    try {
        // We call a new, separate backend function for this
        const result = await fetchWithRetry('/api/changetone', { // <<< FIX: Match the lowercase filename 'changetone.js'
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                inputText: currentText,
                tone: tone
            })
        });
        
        // The backend function just returns the new text
        if (result.newText === undefined) { // Check for undefined specifically
            throw new Error("Invalid response from tone change function.");
        }

        // Update the corrected text box with the new tone!
        outputTextarea.value = result.newText.trim();

    } catch (error) {
        console.error('Error during tone change:', error);
        showError(`Failed to change tone: ${error.message}`);
    } finally {
        setToneLoading(false);
    }
}
