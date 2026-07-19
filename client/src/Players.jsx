import { useState, useEffect } from 'react';

function Players({ onBack}) {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [jerseyNumber, setJerseyNumber] = useState('');
    const [position, setPosition] = useState('');

    useEffect(() => {
        fetch('http://localhost:3001/api/players')
        .then((res) => res.json())
        .then((data) => {
            setPlayers(data);
            setLoading(false);
        })
        .catch((err) => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const handleAddPlayer = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('http://localhost:3001/api/players', {
                method: 'POST',
                headers: { 'Content-Type' : 'application/json' },
                body: JSON.stringify({
                    name,
                    jersey_number: jerseyNumber ? parseInt(jerseyNumber) : null,
                    position
                })
            });
            const newPlayer = await response.json();

            setPlayers([...players, newPlayer]);
            setName('');
            setJerseyNumber('');
            setPosition('');
        } catch (err) {
            console.error(err);
        }   
    };

    if (loading) {
        return <p>Loading players...</p>;
    }

    return (
        <div>
            <button onClick={onBack}>← Back to matches</button>
            <h1>Roster</h1>

            <ul>
                {players.map((player) => (
                    <li key={player.id}>
                        #{player.jersey_number ?? '-'} {player.name} - {player.position ?? 'No position set'}
                    </li>
                ))}
            </ul>

            <h2>Add a Player</h2>
            <form onSubmit={handleAddPlayer}>
                <input 
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    />
                <input
                    type="number"
                    placeholder="Jersey #"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                />
                <button type="submit">Add Player</button>
            </form>
        </div>
    );
}

export default Players;