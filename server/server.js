const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');
dotenv.config();

app.use(cors()); 

app.use(express.json()); 

const oauthUrl = process.env.URL;

app.post('/get-token', async (req, res) => {
  try {
    const response = await axios.post(oauthUrl);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching token from Salesforce:', error);
    res.status(500).json({ error: 'Failed to get token from Salesforce' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
