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
            const response = await fetch('http://localhost:3001/api/matches');
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
            const response = await fetch(`http://localhost:3001/api/matches/${currentMatch.id}/sets`);
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
        return <p>Loading sets...</p>;
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

            const response = await fetch (`http://localhost:3001/api/matches/${currentMatch.id}/sets`, {
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
            await fetch(`http://localhost:3001/api/sets/${setId}`, {
                method: 'DELETE'
            });
            setSets(sets.filter((s) => s.id !== setId));
        } catch (err) {
            console.error(err);
        }
    };


    return (
        <div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button onClick={onBack}>← Back to matches</button>
        <h1>{currentMatch.opponent}</h1>
        <p>{new Date(currentMatch.date).toLocaleDateString()} - {currentMatch.status}</p>

        <h2>Sets</h2>
        {currentMatch.status !== 'completed' && (
            <button onClick={handleCreateSet}>+ New Set</button>
        )}
        <ul>
            {sets.map((set) => (
                <li key={set.id}>
                    Set {set.set_number}: {set.our_score} - {set.opponent_score} ({set.status})
                    <button onClick={() => { setSelectedSet(set); setMode('scorekeeper'); }}>Score</button>
                    <button onClick={() => { setSelectedSet(set); setMode('viewer'); }}>View</button>
                    <button onClick={() => handleDeleteSet(set.id)}>Delete</button>
                </li>
            ))}
        </ul>
    </div>
    );
}

export default MatchDetail;