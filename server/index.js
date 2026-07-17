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

app.get('/api/players', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM player');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});
   
app.post('/api/players', async (req, res) => {
    try {
        const { name, jersey_number, position } = req.body;
        const result = await pool.query(
        'INSERT INTO player (name, jersey_number, position) VALUES ($1, $2, $3) RETURNING *', [name, jersey_number, position]
        );
    res.status(201).json(result.rows[0]);
} catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
}
});

app.post('/api/matches/:matchId/sets', async (req, res) => {
    try {
        const { matchId } = req.params;
        const { set_number } = req.body;
        const result = await pool.query(
            'INSERT INTO set (match_id, set_number) VALUES ($1, $2) RETURNING *', [matchId, set_number]
        );
        res.status(201).json(result.rows[0]);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get('/api/matches/:matchId/sets', async (req, res) => {
    try {
        const { matchId } = req.params;
        const result = await pool.query(
            'SELECT * FROM set WHERE match_id = $1', [matchId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong'});
    }
});

app.post('/api/sets/:setId/actions', async (req, res) => {
    try {
        const { setId } = req.params;
        const { player_id, team, action_type, result: actionResult } = req.body;
        const result = await pool.query(
            'INSERT INTO action (set_id, player_id, team, action_type, result) VALUES ($1, $2, $3, $4, $5) RETURNING *', [setId, player_id || null, team, action_type, actionResult]
    );
    res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get('/api/sets/:setId/actions', async (req, res) => {
    try {
        const { setId } = req.params;
        const result = await pool.query(
            'SELECT * FROM action WHERE set_id = $1 ORDER BY created_at ASC', [setId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get('/api/hello', (req, res) => { //test 
    res.json({ message: 'hello from server' });
});

app.listen(PORT, () => {
    console.log('Server running on http://localhost:${PORT}');
});
