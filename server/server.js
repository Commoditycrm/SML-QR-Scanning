const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const oauthUrl = process.env.URL;

app.get("/", (req, res) => {
  res.send("QR Token API is running");
});

app.post('/get-token', async (req, res) => {
  try {
    if (!oauthUrl) {
      return res.status(500).json({ error: 'OAuth URL not configured' });
    }

    const response = await axios.post(oauthUrl);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching token from Salesforce:', error.message);
    res.status(500).json({ error: 'Failed to get token from Salesforce' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
