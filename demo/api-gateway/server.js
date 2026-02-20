const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cors());

app.get('/users', async (req, res) => {
  try {
    const response = await axios.get('http://user-service:5000/users');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'User service unavailable' });
  }
});

app.post('/users', async (req, res) => {
  try {
    const response = await axios.post(
      'http://user-service:5000/users',
      req.body
    );
    res.status(201).json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'User service unavailable' });
  }
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});