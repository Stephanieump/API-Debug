require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

app.get('/api/weather', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM weather_logs');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/weather/update', async (req, res) => {
  try {
    const city = 'New York'; // Hardcoded for now; can be parameterized later
    const apiKey = process.env.API_KEY;
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    const response = await axios.get(url);
    const { main, weather } = response.data;
    const temperature = main.temp;
    const description = weather[0].description;

    await pool.query(
      'INSERT INTO weather_logs (city, temperature, description) VALUES ($1, $2, $3)',
      [city, temperature, description]
    );

    res.json({ city, temperature, description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));