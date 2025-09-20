/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Type } from '@google/genai';

// --- DOM Elements ---
const form = document.getElementById('score-form') as HTMLFormElement;
const input = document.getElementById('score-input') as HTMLInputElement;
const frequencyInput = document.getElementById('frequency-input') as HTMLSelectElement;
const ageInput = document.getElementById('age-input') as HTMLInputElement;
const familiarityInput = document.getElementById('familiarity-input') as HTMLInputElement;
const familiarityOutput = document.getElementById('familiarity-output') as HTMLOutputElement;
const bestClubInput = document.getElementById('best-club-input') as HTMLSelectElement;
const worstClubInput = document.getElementById('worst-club-input') as HTMLSelectElement;
const button = document.getElementById('analyze-button') as HTMLButtonElement;
const resultContainer = document.getElementById('result-container') as HTMLElement;
const spinner = button.querySelector('.spinner') as HTMLElement;
const buttonText = button.querySelector('.button-text') as HTMLElement;

// --- State Management ---
const setLoading = (isLoading: boolean) => {
  button.disabled = isLoading;
  if (isLoading) {
    spinner.style.display = 'block';
    buttonText.style.display = 'none';
  } else {
    spinner.style.display = 'none';
    buttonText.style.display = 'block';
  }
};

// --- API Initialization ---
// Ensure you have your API_KEY in your environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const golfLevelSchema = {
  type: Type.OBJECT,
  properties: {
    level: {
      type: Type.STRING,
      description: 'The golfer\'s skill level (e.g., Beginner, High-Handicapper, Mid-Handicapper, Low-Handicapper, Scratch Golfer, Professional).',
    },
    description: {
      type: Type.STRING,
      description: 'A brief, encouraging description of this skill level.',
    },
    tips: {
      type: Type.ARRAY,
      description: 'An array of 2-3 actionable, concise tips for improvement tailored to this level, playing frequency, best club, and worst club.',
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ['level', 'description', 'tips'],
};

// --- Main Logic ---
const analyzeScore = async (score: number, frequency: string, age: number, familiarity: number, bestClub: string, worstClub: string) => {
  setLoading(true);
  resultContainer.innerHTML = '';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `My average 18-hole score is ${score}, I play ${frequency} per month, I started playing at age ${age}, my familiarity with golf is a ${familiarity} out of 10. My best club is ${bestClub} and my worst club is ${worstClub}.`,
      config: {
        systemInstruction: `You are a friendly and encouraging golf coach for women. Your task is to analyze a woman's golf details: average 18-hole score, playing frequency, starting age, golf familiarity (1-10), best club, and worst club. Based on all this information, determine her skill level. You must provide the level, a brief description, and 2-3 actionable tips for improvement. The tips must be highly personalized, directly referencing her best and worst clubs. For example, give specific drills for her worst club and suggest ways to leverage her best club. Adjust the complexity of your advice based on her familiarity score. Always respond in a supportive and positive tone. Your response must be in JSON format.`,
        responseMimeType: 'application/json',
        responseSchema: golfLevelSchema,
      },
    });

    const result = JSON.parse(response.text);
    renderResult(result);

  } catch (error) {
    console.error('Error analyzing score:', error);
    renderError('Sorry, something went wrong while analyzing your score. Please try again.');
  } finally {
    setLoading(false);
  }
};

// --- Rendering Functions ---
const renderResult = (result: { level: string; description: string; tips: string[] }) => {
  const { level, description, tips } = result;

  const card = document.createElement('div');
  card.className = 'result-card';

  const levelEl = document.createElement('h2');
  levelEl.textContent = level;
  card.appendChild(levelEl);

  const descriptionEl = document.createElement('p');
  descriptionEl.textContent = description;
  card.appendChild(descriptionEl);

  if (tips && tips.length > 0) {
    const tipsTitle = document.createElement('h3');
    tipsTitle.textContent = 'Tips for Your Next Round:';
    card.appendChild(tipsTitle);

    const tipsList = document.createElement('ul');
    tips.forEach(tipText => {
      const listItem = document.createElement('li');
      listItem.textContent = tipText;
      tipsList.appendChild(listItem);
    });
    card.appendChild(tipsList);
  }

  resultContainer.appendChild(card);
};

const renderError = (message: string) => {
    const errorCard = document.createElement('div');
    errorCard.className = 'result-card error';
    errorCard.textContent = message;
    resultContainer.appendChild(errorCard);
};

// --- Event Listeners ---
familiarityInput.addEventListener('input', () => {
  familiarityOutput.value = familiarityInput.value;
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const score = parseInt(input.value, 10);
  const frequency = frequencyInput.value;
  const age = parseInt(ageInput.value, 10);
  const familiarity = parseInt(familiarityInput.value, 10);
  const bestClub = bestClubInput.value;
  const worstClub = worstClubInput.value;

  if (!isNaN(score) && !isNaN(age)) {
    analyzeScore(score, frequency, age, familiarity, bestClub, worstClub);
  } else {
    renderError('Please enter a valid number for your score and age.');
  }
});

// Initial state
const setInitialState = () => {
    setLoading(false);
    familiarityOutput.value = familiarityInput.value;
}

setInitialState();