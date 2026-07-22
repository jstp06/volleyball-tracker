import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

function Scorekeeper({ set, onBack }) {
    const [players, setPlayers] = useState([]);
    const [currentSet, setCurrentSet] = useState(set);
    const [team, setTeam] = useState('us');
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [actionType, setActionType] = useState('attack');
    const [matchStatus, setMatchStatus] = useState(null);
    const [error, setError] = useState(null);

    const fetchMatchStatus = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/matches');
            const data = await response.json();
            const thisMatch = data.find((m) => m.id ===currentSet.match_id);
            if (thisMatch) {
                setMatchStatus(thisMatch.status);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchMatchStatus();
    }, [currentSet.match_id]);

    useEffect(() => {
        const socket = io('http://localhost:3001');

        socket.emit('join-set', currentSet.id);

        socket.on('score-updated', (data) => {
            if (data.setId === currentSet.id) {
                refreshSet();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [currentSet.id]);

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
        if (matchStatus === 'completed' || currentSet.status === 'completed') {
            return;
        }
        try {
            const response = await fetch(`http://localhost:3001/api/sets/${currentSet.id}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_id: team === 'us' ? (selectedPlayerId || null) : null,
                    team,
                    action_type: actionType,
                    result
                })
            });

            if (!response.ok) {
                throw new Error('Failed to log action');
            }

            await refreshSet();
            await fetchMatchStatus();
            setError(null);
        } catch(err) {
                console.error(err);
                setError('Could not log that action. Please try again');
            }
        };

        const undoLastAction = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/sets/${currentSet.id}/actions/last`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Failed to undo action');
                }

                await refreshSet();
                await fetchMatchStatus();
                setError(null);
            } catch (err) {
                console.error(err);
                setError('Could not undo. Please try again');
            }
        };

        return (
            <div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button onClick={onBack}>← Back to sets</button>
                <h1>Set {currentSet.set_number}</h1>
                <h2>{currentSet.our_score} - {currentSet.opponent_score}</h2>
                <p>Status: {currentSet.status}</p>
                <button onClick={undoLastAction}>Undo Last Action</button>

                {matchStatus === 'completed' || currentSet.status === 'completed' ? (
                    <p>
                        {matchStatus === 'completed'
                        ? 'This match is complete. No further actions can be logged.'
                        : 'This set is compelte. Not further actions can be logged.'}
                    </p>
                ) : (
                    <>

                <h3>Team</h3>
                <button onClick={() => setTeam('us')} disabled={team === 'us'}>Us</button>
                <button onClick={() => setTeam('opponent')} disabled={team === 'opponent'}>Opponent</button>

                {team === 'us' && (
                    <div>
                        <h3>Player</h3>
                        {players.length === 0 ? (
                            <p>No players on the roster yet. Add players first.</p>
                        ) : (
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
                        )}
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
                </>
            )}
        </div>
     );
}

export default Scorekeeper;