const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'active',
    message: 'Deriv Broker Commissions API',
    timestamp: new Date().toISOString()
  });
});

// Commission data endpoint
app.post('/api/deriv-commissions', async (req, res) => {
  try {
    const { token, date_from, date_to } = req.body;
    
    // Validate input
    if (!token) {
      return res.status(400).json({ 
        error: 'Missing required field',
        details: 'API token is required'
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if ((date_from && !dateRegex.test(date_from)) || (date_to && !dateRegex.test(date_to))) {
      return res.status(400).json({
        error: 'Invalid date format',
        details: 'Use YYYY-MM-DD format for dates'
      });
    }

    // Get statement from Deriv API
    const statementResponse = await axios.post(
      `${process.env.DERIV_API_URL || 'https://api.deriv.com'}/statement`,
      {
        statement: 1,
        description: 1,
        date_from: date_from || getDefaultDate(-30),
        date_to: date_to || getDefaultDate(0),
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Process commission data
    const transactions = statementResponse.data.statement.transactions || [];
    const commissions = transactions
      .filter(t => t.action_type === 'commission')
      .map(t => ({
        date: t.transaction_time,
        amount: Math.abs(parseFloat(t.amount)),
        description: t.longcode || t.action_type,
        currency: t.currency || 'USD',
        reference: t.transaction_id
      }));

    // Calculate summary
    const summary = {
      total: commissions.reduce((sum, t) => sum + t.amount, 0),
      count: commissions.length,
      date_range: {
        start: date_from || getDefaultDate(-30),
        end: date_to || getDefaultDate(0)
      }
    };

    res.json({
      success: true,
      data: {
        commissions,
        summary
      }
    });

  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || 'Failed to fetch commission data';
    
    res.status(status).json({
      success: false,
      error: message,
      details: error.response?.data || null
    });
  }
});

// Helper function for default dates
function getDefaultDate(daysOffset) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : null
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation:`);
  console.log(`- POST /api/deriv-commissions`);
  console.log(`- Required body: { token: string, date_from?: string, date_to?: string }`);
});