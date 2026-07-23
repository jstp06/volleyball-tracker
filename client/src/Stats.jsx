import { useState, useEffect } from 'react';

function Stats({ onBack }) {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPlayerId, setSelectedPlayerId] = useState('')
    const [careerStats, setCareerStats] = useState(null);
    const [matches, setMatches] = useState([]);
    const [selectedMatchId, setSelectedMatchId] = useState('');
    const [matchStats, setMatchStats] = useState(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/players`)
        .then((res) => res.json())
        .then((data) => {
            setPlayers(data);
            setLoading(false);
        })
        .catch((err) => {
            console.error(err);
            setError('Could not load players.');
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (!selectedPlayerId) {
            setCareerStats(null);
            setMatches([]);
            setSelectedMatchId('');
            setMatchStats(null);
            return;
        }

        fetch(`${import.meta.env.VITE_API_URL}/api/players/${selectedPlayerId}/stats`)
            .then((res) => res.json())
            .then((data) => setCareerStats(data))
            .catch((err) => console.error(err));

        fetch(`${import.meta.env.VITE_API_URL}/api/matches`)
            .then((res) => res.json())
            .then((data) => setMatches(data))
            .catch((err) => console.error(err));

        setSelectedMatchId('');
        setMatchStats(null);
    }, [selectedPlayerId]);

    useEffect(() => {
        if (!selectedPlayerId || !selectedMatchId) {
            setMatchStats(null);
            return;
        }

        fetch(`${import.meta.env.VITE_API_URL}/api/players/${selectedPlayerId}/stats/match/${selectedMatchId}`)
            .then((res) => res.json())
            .then((data) => setMatchStats(data))
            .catch((err) => console.error(err));
    }, [selectedPlayerId, selectedMatchId]);

    if(loading) {
        return <p className='page'>Loading players...</p>;
    }

    const formatPercent = (value) => (value === null ? '-' : value.toFixed(3));

    return (
        <div className='page'>
            {error && <p className='error-banner'>{error}</p>}
            <button className= 'btn-back' onClick={onBack}>← Back to matches</button>
             <h1 className='app-title'>Player Stats</h1>

            <h2 className='section-label'>Select a Player</h2>
             <select
             className='field'
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
            >
                <option value="">Select a player</option>
                {players.map((player) => (
                    <option key={player.id} value={player.id}>
                        #{player.jersey_number ?? '—'} {player.name}
                    </option>
                ))}
            </select>

            {careerStats && (
                <div className='card' style ={{ flexDirection : 'column', alignItems: 'stretch', gap: 6}}>
                    <div className='card-title' style={{ marginBottom: 4 }}>Career Stats</div>
                    <div className='card-sub'>Hitting %: {formatPercent(careerStats.hitting_percentage)} ({careerStats.kills}K / {careerStats.attack_errors}E / {careerStats.total_attacks} attempts)</div>
                    <div className='card-sub'>Ace %: {formatPercent(careerStats.ace_percentage)} ({careerStats.aces} aces / {careerStats.total_serves} serves)</div>
                    <div className='card-sub'>Service Error %: {formatPercent(careerStats.service_error_percentage)}</div>
                    <div className='card-sub'>Block %: {formatPercent(careerStats.block_percentage)} ({careerStats.block_kills} / {careerStats.total_blocks} attempts)</div>
                </div>
            )}

            {selectedPlayerId && matches.length > 0 && (
                <div>
                    <h2 className='section-label'>Select a Match</h2>
                    <select
                        className='field'
                        value={selectedMatchId}
                        onChange={(e) => setSelectedMatchId(e.target.value)}
                    >
                        <option value="">Select a match</option>
                        {matches.map((match) => (
                            <option key={match.id} value={match.id}>
                                {match.opponent} — {new Date(match.date).toLocaleDateString()}
                            </option>
                        ))}
                 </select>
                </div>
            )}

            {matchStats && (
                <div className='card' style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                    <div className='card-title' style={{ marginBottom: 4 }}>Match Stats</div>
                    <div className='card-sub'>Hitting %: {formatPercent(matchStats.hitting_percentage)} ({matchStats.kills}K / {matchStats.attack_errors}E / {matchStats.total_attacks} attempts)</div>
                    <div className='card-sub'>Ace %: {formatPercent(matchStats.ace_percentage)} ({matchStats.aces} aces / {matchStats.total_serves} serves)</div>
                    <div className='card-sub'>Service Error %: {formatPercent(matchStats.service_error_percentage)}</div>
                    <div className='card-sub'>Block %: {formatPercent(matchStats.block_percentage)} ({matchStats.block_kills} / {matchStats.total_blocks} attempts)</div>
                </div>
            )}
         </div>
    );
}

export default Stats;