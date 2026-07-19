import { useState, useEffect } from 'react';

function Scorekeeper({ set, onBack }) {
    const [players, setPlayers] = useState([]);
    const [currentSet, setCurrentSet] = useState(set);
    const [team, setTeam] = useState('us');
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [actionType, setActionType] = useState('attack');

    useEffect(() => {
        fetch(`http://localhost:3001/api/players`)
        .then((res) => res.json())
        .then((data) => setPlayers(data))
        .catch((err) => console.error(err));
    }, []);

    const refreshSet = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/matches/${currentSet.match_id}/sets`);
            const allSets = await response.json();
            const updated = allSets.find((s) => s.id === currentSet.id);
            if (updated) {
                setCurrentSet(updated);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const logAction = async (result) => {
        try {
            await fetch(`http://localhost:3001/api/sets/${currentSet.id}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: team === 'us' ? (selectedPlayerId || null) : null,
                    team,
                    action_type: actionType,
                    result
                })
            });
            await refreshSet();
        } catch(err) {
                console.error(err);
            }
        };

        return (
            <div>
                <button onClick={onBack}>← Back to sets</button>
                <h1>Set {currentSet.set_number}</h1>
                <h2>{currentSet.our_score} - {currentSet.opponent_score}</h2>
                <p>Status: {currentSet.status}</p>

                <h3>Team</h3>
                <button onClick={() => setTeam('us')} disabled={team === 'us'}>Us</button>
                <button onClick={() => setTeam('opponent')} disabled={team === 'opponent'}>Opponent</button>

                {team === 'us' && (
                    <div>
                        <h3>Player</h3>
                        <select
                            value={selectedPlayerId}
                            onChange={(e) => setSelectedPlayerId(e.target.value)}
                        >
                            <option value="">Select a player</option>
                            {players.map((player) => (
                                <option key={player.id} value ={player.id}>
                                    #{player.jersey_number ?? '-'} {player.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <h3>Action Type</h3>
                <button onClick={() => setActionType('attack')} disabled={actionType === 'attack'}>Attack</button>
                <button onClick={() => setActionType('serve')} disabled={actionType === 'serve'}>Serve</button>
                <button onClick={() => setActionType('block')} disabled={actionType === 'block'}>Block</button>

                <h3>Result</h3>
                {actionType === 'attack' && (
                    <div>
                        <button onClick={() => logAction('kill')}>Kill</button>
                        <button onClick={() => logAction('error')}>Error</button>
                        <button onClick={() => logAction('in_play')}>In Play</button>
                    </div>
                )}
                {actionType === 'serve' && (
                    <div>
                        <button onClick={() => logAction('ace')}>Ace</button>
                        <button onClick={() => logAction('error')}>Error</button>
                        <button onClick={() => logAction('in_play')}>In Play</button>
                    </div>
                )}
                {actionType === 'block' && (
                    <div>
                        <button onClick={() => logAction('block')}>Block</button>
                        <button onClick={() => logAction('error')}>Error</button>
                        <button onClick={() => logAction('in_play')}>In Play</button>
                    </div>
                )}
            </div>
     );
}

export default Scorekeeper;