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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/matches`);
            const data = await response.json();
            const thisMatch = data.find((m) => m.id === currentSet.match_id);
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
        const socket = io(import.meta.env.VITE_API_URL);

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
        fetch(`${import.meta.env.VITE_API_URL}/api/players`)
        .then((res) => res.json())
        .then((data) => setPlayers(data))
        .catch((err) => console.error(err));
    }, []);

    const refreshSet = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/matches/${currentSet.match_id}/sets`);
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sets/${currentSet.id}/actions`, {
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
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sets/${currentSet.id}/actions/last`, {
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

        const isLocked = matchStatus === 'compelted' || currentSet.status === 'completed';

        return (
            <div className='page'>
                {error && <p className='error-banner'>{error}</p>}
                <button className='btn-back' onClick={onBack}>← Back to sets</button>
                
                <div className='scoreboard'>
                    <div className='scoreboard-label'>Set {currentSet.set_number}</div>
                    <div className='scoreboard-score'>{currentSet.our_score} - {currentSet.opponent_score}</div>
                    <div className='scoreboard-status'>{currentSet.status}</div>
                </div>
                
                <button className='btn btn-block' onClick={undoLastAction}>Undo Last Action</button>

                {isLocked ? (
                    <p className='error-banner' style={{ marginTop: 16 }}>
                        {matchStatus === 'completed'
                            ? 'This match is complete. No further actions can be logged.'
                            : 'This set is compelte. Not further actions can be logged.'}
                    </p>
                ) : (
                    <>

                        <h2 className='section-label'>Team</h2>
                        <div className='btn-group'>
                            <button 
                                className={`btn ${team === 'us' ? 'btn-selected' : ''}`} 
                                onClick={() => setTeam('us')} 
                                disabled={team === 'us'}
                            >
                                Us
                            </button>
                            <button 
                                className={`btn ${team === 'opponent' ? 'btn-selected' : ''}`}
                                onClick={() => setTeam('opponent')} 
                                disabled={team === 'opponent'}
                            >
                                Opponent
                            </button>
                        </div>

                        {team === 'us' && (
                            <div>
                                <h2 className='section-label'>Player</h2>
                                {players.length === 0 ? (
                                    <p className='error-banner'>No players on the roster yet. Add players first.</p>
                                ) : (
                                    <select
                                        className='field'
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

                    <h2 className='section-label'>Action Type</h2>
                    <div className='btn-group'>
                        <button 
                            className={`btn ${actionType === 'attack' ? 'btn-selected' : ''}`} 
                            onClick={() => setActionType('attack')} 
                            disabled={actionType === 'attack'}
                        >
                            Attack
                        </button>
                        <button 
                            className={`btn ${actionType === 'serve' ? 'btn-selected' : ''}`} 
                            onClick={() => setActionType('serve')} 
                            disabled={actionType === 'serve'}
                        >
                            Serve
                        </button>
                        <button 
                            className={`btn ${actionType === 'block' ? 'btn-selected' : ''}`} 
                            onClick={() => setActionType('block')} 
                            disabled={actionType === 'block'}
                        >
                            Block
                        </button>
                    </div>

                    <h2 className='section-label'>Result</h2>
                    {actionType === 'attack' && (
                        <div className='btn-group'>
                            <button className='btn btn-primary' onClick={() => logAction('kill')}>Kill</button>
                            <button className='btn btn-danger' onClick={() => logAction('error')}>Error</button>
                            <button className='btn' onClick={() => logAction('in_play')}>In Play</button>
                    </div>
                    )}
                    {actionType === 'serve' && (
                        <div className='btn-group'>
                            <button className='btn btn-primary' onClick={() => logAction('ace')}>Ace</button>
                            <button className='btn btn-danger' onClick={() => logAction('error')}>Error</button>
                            <button className='btn' onClick={() => logAction('in_play')}>In Play</button>
                        </div>
                    )}
                    {actionType === 'block' && (
                        <div className='btn-group'>
                            <button className='btn btn-primary' onClick={() => logAction('block')}>Block</button>
                            <button className='btn btn-danger' onClick={() => logAction('error')}>Error</button>
                            <button className='btn' onClick={() => logAction('in_play')}>In Play</button>
                        </div>
                    )}
                </>
            )}
        </div>
     );
}

export default Scorekeeper;