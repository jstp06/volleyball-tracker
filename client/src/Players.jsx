import { useState, useEffect } from 'react';

function Players({ onBack}) {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [jerseyNumber, setJerseyNumber] = useState('');
    const [position, setPosition] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/players`)
        .then((res) => res.json())
        .then((data) => {
            setPlayers(data);
            setLoading(false);
        })
        .catch((err) => {
            console.error(err);
            setError('Could not load players. Is the server running?');
            setLoading(false);
        });
    }, []);

    const handleAddPlayer = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/players`, {
                method: 'POST',
                headers: { 'Content-Type' : 'application/json' },
                body: JSON.stringify({
                    name,
                    jersey_number: jerseyNumber ? parseInt(jerseyNumber) : null,
                    position
                })
            });

            if (!response.ok) {
                throw new Error('Failed to add player');
            }

            const newPlayer = await response.json();

            setPlayers([...players, newPlayer]);
            setName('');
            setJerseyNumber('');
            setPosition('');
        } catch (err) {
            console.error(err);
            setError('Could not add player. Please try again.')
        }   
    };

    if (loading) {
        return <p className='page'>Loading players...</p>;
    }

    return (
        <div className='page'>
            {error && <p className='error-banner'>{error}</p>}
            <button className='btn-back' onClick={onBack}>← Back to matches</button>
            <h1 className='app-title'>Roster</h1>

            <div>
                {players.map((player) => (
                    <div key={player.id} className='card'>
                        <div className='card-main'>
                            <div className='card-title'>#{player.jersey_number ?? '-'} {player.name}</div>
                            <div className='card-sub'>{player.position ?? 'No position set'}</div>
                        </div>
                    </div>
                ))}
            </div>

            <h2 className='section-label'>Add a Player</h2>
            <form onSubmit={handleAddPlayer}>
                <input 
                    className='field'
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    className='field'
                    type="number"
                    placeholder="Jersey #"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                />
                <input
                    className='field'
                    type="text"
                    placeholder="Position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                />
                <button className='btn btn-primary btn-block' type="submit">Add Player</button>
            </form>
        </div>
    );
}

export default Players;