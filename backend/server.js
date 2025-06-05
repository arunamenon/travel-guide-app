const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { getTravelAdvice } = require('./services/geminiService'); // Import the service

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Load environment variables (e.g., for GEMINI_API_KEY)
// You would typically use a library like dotenv for this: require('dotenv').config();
// For this subtask, we assume process.env.GEMINI_API_KEY is set externally.
if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY environment variable is not set. AI features will be limited/mocked.');
}

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.post('/api/travel-recommendation', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const recommendation = await getTravelAdvice(message);
    res.json(recommendation); // Send the response from Gemini service
  } catch (error) {
    // The service itself logs detailed errors.
    // The service now returns an error object, so this catch might be redundant
    // if the service handles all errors and returns a valid JSON response.
    // However, keeping it for unexpected issues within this route handler itself.
    console.error('Error in /api/travel-recommendation route:', error);
    res.status(500).json({ error: 'Failed to process your request on the server.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Make sure GEMINI_API_KEY is set in your environment for full functionality.');
  console.log('Example: export GEMINI_API_KEY="YOUR_API_KEY"');
});
