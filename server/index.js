const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001; 
const pool = require('./db');

app.use(cors({
    origin: 'http://localhost:5173'
})); 

app.use(express.json()); //allows express to read the body of incoming requests 

app.get('/api/matches', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM match');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Something went wrong' });
    }
    });

app.post('/api/matches', async (req, res) => {
    try {
        const { opponent, date } = req.body;
        const result = await pool.query(
            'INSERT INTO match (opponent, date) VALUES ($1, $2) RETURNING *',
            [opponent, date]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});
    
app.get('/api/hello', (req, res) => {
    res.json({ message: 'hello from server' });
});

app.listen(PORT, () => {
    console.log('Server running on http://localhost:${PORT}');
});
