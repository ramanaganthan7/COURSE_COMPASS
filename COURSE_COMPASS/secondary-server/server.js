const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const dotenv = require('dotenv').config();


const app = express();
const port = process.env.PORT || 4000;
app.use(express.json());
const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.API_KEY;



let chatHistory = [
  {
    role: "model",
    parts: [{ text: "Hi, I am EDU BOT. How can I assist you today?" }],
  }
  ,{
    role: "model",
    parts: [{ text: "Hi, I am EDU BOT. How can I assist you today?" }],
  }
];

async function runChat(userInput) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 1000,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    // ... other safety settings
  ];

  const chat = model.startChat({
    generationConfig,
    safetySettings,
    history: chatHistory,
  });

  if (userInput.toLowerCase() === "bye") {
    return "Chat session ended. Have a great day!";
  }

  const result = await chat.sendMessage(userInput);
  const response = result.response;

  chatHistory.push({
    role: "user",
    parts: [{ text: userInput }],
  });
  chatHistory.push({
    role: "model",
    parts: [{ text: response.text() }],
  });

  const points = response.text().split('.').map(point => point.trim()).filter(point => point.length > 0);
  const limitedPoints = points.slice(0, 2).map(point => `• ${point}`).join('\n');

  return limitedPoints || "• No relevant points found.";
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/loader.gif', async (req, res) => {
  res.sendFile(__dirname + '/think8.gif');
});

app.post('/chat', async (req, res) => {
  try {
    const userInput = req.body?.userInput;
    console.log('Incoming /chat request:', userInput);
    if (!userInput) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const response = await runChat(userInput);
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
