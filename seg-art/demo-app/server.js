// Simple Express proxy server for Replicate API to avoid CORS issues
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3030;

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

const REPLICATE_API_KEY = process.env.VITE_REPLICATE_API_KEY;
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

if (!REPLICATE_API_KEY) {
  console.error('❌ VITE_REPLICATE_API_KEY not found in .env file');
  process.exit(1);
}

// Proxy endpoint for creating Replicate predictions
app.post('/api/replicate/predictions', async (req, res) => {
  try {
    console.log('📤 Forwarding prediction request to Replicate...');

    const response = await fetch(REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Replicate API error:', data);
      return res.status(response.status).json(data);
    }

    console.log('✅ Prediction created:', data.id);
    res.json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for checking prediction status
app.get('/api/replicate/predictions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`${REPLICATE_API_URL}/${id}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Replicate API error:', data);
      return res.status(response.status).json(data);
    }

    // Log status updates
    if (data.status === 'succeeded') {
      console.log('✅ Prediction succeeded:', id);
    } else if (data.status === 'failed') {
      console.log('❌ Prediction failed:', id);
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Replicate Proxy Server running on http://localhost:${PORT}`);
  console.log(`✅ CORS enabled for frontend on ports 3000-3002`);
  console.log(`🔑 Using Replicate API key: ${REPLICATE_API_KEY.substring(0, 8)}...`);
  console.log(`\n📡 Proxy endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/replicate/predictions`);
  console.log(`   GET  http://localhost:${PORT}/api/replicate/predictions/:id\n`);
});
