import { useState, useEffect } from 'react';
import Scorekeeper from './Scorekeeper';
import Viewer from './Viewer';

function MatchDetail({ match, onBack }) {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSet, setSelectedSet] = useState(null);
    const [mode, setMode] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:3001/api/matches/${match.id}/sets`)
        .then((res) => res.json())
        .then((data) => {
            setSets(data);
            setLoading(false);
        })
        .catch((err) => {
            console.error(err);
            setLoading(false);
        });
    }, [match.id]);

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

    return (
        <div>
            <button onClick={onBack}>← Back to matches</button>
        <h1>{match.opponent}</h1>
        <p>{new Date(match.date).toLocaleDateString()} - {match.status}</p>

        <h2>Sets</h2>
        <ul>
            {sets.map((set) => (
                <li key={set.id}>
                    Set{set.set_number}: {set.our_score} - {set.opponent_score} ({set.status})
                    <button onClick={() => { setSelectedSet(set); setMode('scorekeeper'); }}>
                        Score
                    </button>
                    <button onClick={() => { setSelectedSet(set); setMode('viewer'); }}>
                        View
                    </button>
                </li>
            ))}
        </ul>
    </div>
    );
}

export default MatchDetail;