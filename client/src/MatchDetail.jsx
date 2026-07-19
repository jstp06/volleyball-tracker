import { useState, useEffect } from 'react';

function MatchDetail({ match, onBack }) {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);

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
                </li>
            ))}
        </ul>
         </div>
    );
}

export default MatchDetail;