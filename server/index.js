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
        const { opponent, date, sets_to_win } = req.body;
        const result = await pool.query(
            'INSERT INTO match (opponent, date, sets_to_win) VALUES ($1, $2, $3) RETURNING *',
            [opponent, date, sets_to_win || 3]
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

        const actionRow = await pool.query(
            'INSERT INTO action (set_id, player_id, team, action_type, result) VALUES ($1, $2, $3, $4, $5) RETURNING *', [setId, player_id || null, team, action_type, actionResult]
    );
    const scoringResults = ['kill', 'ace', 'block', 'error'];
    if (scoringResults.includes(actionResult)) {
        const errorResults = ['error'];
        const pointGoesToUs = errorResults.includes(actionResult)
        ? team !== 'us'
        : team === 'us';

        const scoreColumn = pointGoesToUs ? 'our_score' : 'opponent_score';

        const updatedSet = await pool.query(
            `UPDATE "set" SET ${scoreColumn} = ${scoreColumn} + 1 WHERE id = $1 RETURNING *`, [setId]
        );

    const { our_score, opponent_score, match_id } = updatedSet.rows[0];
    const scoreDiff = Math.abs(our_score - opponent_score);
    const setIsOver = (our_score >= 25 || opponent_score >= 25) && scoreDiff >= 2;

    if (setIsOver) {
        const winner = our_score > opponent_score ? 'us' : 'opponent';

        await pool.query(
            `UPDATE "set" SET status = 'completed' WHERE id = $1`, [setId]
        );

        const matchColumn = winner === 'us' ? 'our_sets_won' : 'opponent_sets_won';
        const updatedMatch = await pool.query(
            `UPDATE match SET ${matchColumn} = ${matchColumn} + 1 WHERE id = $1 RETURNING *`, [match_id]
        );

        const { our_sets_won, opponent_sets_won, sets_to_win } = updatedMatch.rows[0];
        const matchIsOver = our_sets_won >= sets_to_win || opponent_sets_won >= sets_to_win;

        if (matchIsOver) {
            await pool.query(
                `UPDATE match SET status = 'completed' WHERE id = $1`, [match_id]
            );
        }
    }
}


    res.status(201).json(actionRow.rows[0]);
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

app.get('/api/players/:playerId/stats', async (req, res) => {     // career stats
    try {
        const { playerId } = req.params;

        const result = await pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE action_type = 'attack') AS total_attacks,
                COUNT(*) FILTER (WHERE action_type = 'attack' AND result = 'kill') AS kills,
                COUNT(*) FILTER (WHERE action_type = 'attack' AND result = 'error') AS attack_errors,
                COUNT(*) FILTER (WHERE action_type = 'serve') AS total_serves,
                COUNT(*) FILTER (WHERE action_type = 'serve' AND result = 'ace') AS aces,
                COUNT(*) FILTER (WHERE action_type = 'serve' AND result = 'error') AS service_errors,
                COUNT(*) FILTER (WHERE action_type = 'block') AS total_blocks,
                COUNT(*) FILTER (WHERE action_type = 'block' AND result = 'block') AS block_kills,
                COUNT(*) FILTER (WHERE action_type = 'block' AND result = 'error') AS block_errors
                FROM action
                WHERE player_id = $1`,
                [playerId]
        );

        const stats = result.rows[0];
        const totalAttacks = parseInt(stats.total_attacks);
        const kills = parseInt(stats.kills);
        const attackErrors = parseInt(stats.attack_errors);
        const totalServes = parseInt(stats.total_serves);
        const aces = parseInt(stats.aces);
        const serviceErrors = parseInt(stats.service_errors);
        const totalBlocks = parseInt(stats.total_blocks);
        const blockKills = parseInt(stats.block_kills);
        const blockErrors = parseInt(stats.block_errors);

        const hittingPercentage = totalAttacks > 0
        ? ((kills - attackErrors) / totalAttacks)
        : null;

        const acePercentage = totalServes > 0
        ? (aces / totalServes) 
        : null;

        const serviceErrorPercentage = totalServes > 0 
        ? (serviceErrors / totalServes)
        : null;

        const blockPercentage = totalBlocks > 0 
        ? (blockKills / totalBlocks)
        : null;

        res.json({
            player_id: parseInt(playerId),
            total_attacks: totalAttacks,
            kills,
            attack_errors: attackErrors,
            hitting_percentage: hittingPercentage,
            total_serves: totalServes,
            aces,
            service_errors: serviceErrors,
            ace_percentage: acePercentage,
            service_error_percentage: serviceErrorPercentage,
            total_blocks: totalBlocks,
            block_kills: blockKills,
            block_errors: blockErrors,
            block_percentage: blockPercentage
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong'});
    }
});

app.get('/api/players/:playerId/stats/match/:matchId', async (req, res) => { // per match stats
    try {
        const { playerId, matchId } = req.params;

        const result = await pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE a.action_type = 'attack') AS total_attacks,
                COUNT(*) FILTER (WHERE a.action_type = 'attack' AND a.result = 'kill') AS kills,
                COUNT(*) FILTER (WHERE a.action_type = 'attack' AND a.result = 'error') AS attack_errors,
                COUNT(*) FILTER (WHERE a.action_type = 'serve') AS total_serves,
                COUNT(*) FILTER (WHERE a.action_type = 'serve' AND a.result = 'ace') AS aces,
                COUNT(*) FILTER (WHERE a.action_type = 'serve' AND a.result = 'error') AS service_errors,
                COUNT(*) FILTER (WHERE a.action_type = 'block') AS total_blocks,
                COUNT(*) FILTER (WHERE a.action_type = 'block' AND a.result = 'block') AS block_kills,
                COUNT(*) FILTER (WHERE a.action_type = 'block' AND a.result = 'error') AS block_errors
            FROM action a
            JOIN "set" s ON a.set_id = s.id
            WHERE a.player_id = $1 AND s.match_id = $2`,
            [playerId, matchId]
        );

        const stats = result.rows[0];
        const totalAttacks = parseInt(stats.total_attacks);
        const kills = parseInt(stats.kills);
        const attackErrors = parseInt(stats.attack_errors);
        const totalServes = parseInt(stats.total_serves);
        const aces = parseInt(stats.aces);
        const serviceErrors = parseInt(stats.service_errors);
        const totalBlocks = parseInt(stats.total_blocks);
        const blockKills = parseInt(stats.block_kills);
        const blockErrors = parseInt(stats.block_errors);

        const hittingPercentage = totalAttacks > 0 
        ? ((kills - attackErrors) / totalAttacks)
        : null;

        const acePercentage = totalServes > 0 
        ? (aces / totalServes) 
        : null;

        const serviceErrorPercentage = totalServes > 0 
        ? (serviceErrors / totalServes) 
        : null;

        const blockPercentage = totalBlocks > 0 
        ? (blockKills / totalBlocks)
        : null;

        res.json({
            player_id: parseInt(playerId),
            match_id: parseInt(matchId),
            total_attacks: totalAttacks,
            kills,
            attack_errors: attackErrors,
            hitting_percentage: hittingPercentage,
            total_serves: totalServes,
            aces,
            service_errors: serviceErrors,
            ace_percentage: acePercentage,
            service_error_percentage: serviceErrorPercentage,
            total_blocks: totalBlocks,
            block_kills: blockKills,
            block_errors: blockErrors,
            block_percentage: blockPercentage
        });
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
