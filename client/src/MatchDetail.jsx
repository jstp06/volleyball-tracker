import { useState, useEffect } from 'react';
import Scorekeeper from './Scorekeeper';
import Viewer from './Viewer';

function MatchDetail({ match, onBack }) {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSet, setSelectedSet] = useState(null);
    const [mode, setMode] = useState(null);
    const [newSetNumber, setNewSetNumber] = useState('');
    const [currentMatch, setCurrentMatch] = useState(match);
    const [error, setError] = useState(null);

    const refreshMatch = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/matches`);
            const data = await response.json();
            const updated = data.find((m) => m.id === currentMatch.id);
            if (updated) {
                setCurrentMatch(updated);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSets = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/matches/${currentMatch.id}/sets`);
            const data = await response.json();
            setSets(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSets();
    }, [currentMatch.id]);

    if (loading) {
        return <p className='page'>Loading sets...</p>;
    }

    if (selectedSet && mode === 'scorekeeper') {
        return (
            <Scorekeeper
                set={selectedSet}
                onBack={() => {
                    setSelectedSet(null);
                    setMode(null);
                    refreshMatch();
                    fetchSets();
                }}
            />
        );
    }

    if (selectedSet && mode === 'viewer') {
        return (
            <Viewer
                set={selectedSet}
                onBack={() => {
                    setSelectedSet(null);
                    setMode(null);
                }}
            />
        );
    }

    const handleCreateSet = async () => {
        if (currentMatch.status === 'completed') {
            return;
        }
        try {
            const nextNumber = sets.length > 0
            ? Math.max(...sets.map((s) => s.set_number)) + 1
            : 1;

            const response = await fetch (`${import.meta.env.VITE_API_URL}/api/matches/${currentMatch.id}/sets`, {
                method: 'POST',
                headers: {'Content-Type' : 'application/json' },
                body: JSON.stringify({ set_number : nextNumber })
            });

            if (!response.ok) {
                throw new Error('Failed to create set');
            }

            const newSet = await response.json();

            setSets([...sets, newSet]);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Could not create set. Please try again.');
        }
    };

    const handleDeleteSet = async (setId) => { //delete set
        const confirmed = window.confirm('Delete this set? This cannot be undone.');
        if (!confirmed) {
            return;
        }
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/api/sets/${setId}`, {
                method: 'DELETE'
            });
            setSets(sets.filter((s) => s.id !== setId));
        } catch (err) {
            console.error(err);
        }
    };


    return (
        <div className='page'>
            {error && <p className='error-banner'>{error}</p>}
            <button className='btn-back' onClick={onBack}>← Back to matches</button>
            <h1 className='app-title'>{currentMatch.opponent}</h1>
            <p className='scoreboard-status' style={{ textAlign: 'center', marginBottom: 20 }}>
                {new Date(currentMatch.date).toLocaleDateString()} - {currentMatch.status}
            </p>

            <h2 className='section-label'>Sets</h2>
            {currentMatch.status !== 'completed' && (
                <button className='btn btn-primary btn-block' onClick={handleCreateSet}>+ New Set</button>
            )}
        
            <div style={{ marginTop: 12}}>
                {sets.map((set) => (
                    <div key={set.id} className='card'>
                        <div className='card-main'>
                            <div className='card-title'>Set {set.set_number}</div>
                            <div className='card-sub'>{set.our_score} - {set.opponent_score} ({set.status})</div>
                        </div>
                        <div className='btn-group'>
                            <button className='btn' onClick={() => { setSelectedSet(set); setMode('scorekeeper'); }}>Score</button>
                            <button className='btn' onClick={() => { setSelectedSet(set); setMode('viewer'); }}>View</button>
                            <button className='btn btn-danger' onClick={() => handleDeleteSet(set.id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MatchDetail;