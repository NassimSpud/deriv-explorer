const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Proxy endpoint to Deriv API
app.post('/api/deriv-earnings', async (req, res) => {
  try {
    const { api_key } = req.body;
    
    // Replace with actual Deriv API endpoint
    const derivResponse = await axios.get('https://api.deriv.com/partner/earnings', {
      headers: {
        'Authorization': `Bearer ${api_key}`
      }
    });
    
    // Process data to match our frontend expectations
    const processedData = {
      dates: derivResponse.data.dates,
      earnings: derivResponse.data.amounts,
      total: derivResponse.data.total,
      last30Days: derivResponse.data.last_30_days
    };
    
    res.json(processedData);
  } catch (error) {
    console.error('Error fetching from Deriv API:', error);
    res.status(500).json({ error: 'Failed to fetch earnings data' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});