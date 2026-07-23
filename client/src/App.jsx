import { useState, useEffect } from 'react'
import './App.css'
import MatchDetail from './MatchDetail';
import Players from './Players';
import Stats from './Stats';

function App() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showPlayers, setShowPlayers] = useState(false);
  const [error, setError] = useState(null);
  const [setsToWin, setSetsToWin] = useState(3);
  const [showStats, setShowStats] = useState(false);

  const fetchMatches = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/matches`);
      const data = await response.json();
      setMatches(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Could not load matches. Is the server running?');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

   const handleCreateMatch = async (e) => { // form submission
    e.preventDefault();

    try{
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opponent, date, sets_to_win: setsToWin })
      });

      if (!response.ok) {
        throw new Error('Failed to create match');
      }

      const newMatch = await response.json();

      setMatches([...matches, newMatch]);
      setOpponent('');
      setDate('');
      setSetsToWin(3);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not create match. Please try again');
    }
  };

  if (loading) {
    return <p className = "page">Loading matches...</p>;
  }

  if (selectedMatch) {
    return (
      <MatchDetail
        match={selectedMatch}
        onBack={() => {
          setSelectedMatch(null);
          fetchMatches();
        }}
        />
    );
  }

  if (showPlayers) {
    return <Players onBack={() => setShowPlayers(false)} />;
  }

  if (showStats) {
    return <Stats onBack={() => setShowStats(false)} />;
  }

  const handleDeleteMatch = async (matchId) => {
    const confirmed = window.confirm('Delete this match and all its sets and actions? This cannot be undone.');
    if (!confirmed) {
      return;
    }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/matches/${matchId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete match');
      }

      setMatches(matches.filter((m) => m.id !== matchId));
    } catch (err) {
        console.error(err);
        setError('Could not delete match. Please try again');
    }
  };

  return (
    <div className='page'>
      {error && <p className='error-banner'>{error}</p>}
      <h1 className='app-title'>Volleyball Tracker</h1>

      <div className='btn-group'>
        <button className='btn' onClick={() => setShowPlayers(true)}>Manage Roster</button>
        <button className='btn' onClick={() => setShowStats(true)}>View Stats</button>
      </div>

      <h2 className='section-label'>Matches</h2>
      <div>
        {matches.map((match) => (
          <div key = {match.id} className='card'> 
            <div className='card-main' onClick={() => setSelectedMatch(match)}>
              <div className='card-title'>{match.opponent}</div>
              <div className='card-sub'>{new Date(match.date).toLocaleDateString()} - {match.status}</div>
            </div>
            <button className='btn btn-danger' onClick={() => handleDeleteMatch(match.id)}>Delete</button>
          </div>
        ))}
      </div>

      <h2 className='section-label'>Create a Match</h2>
      <form onSubmit={handleCreateMatch}>
        <input
          className='field'
          type="text"
          placeholder='Opponent'
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
        />
        <input 
          className='field'
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <select
          className='field'
          value ={setsToWin}
          onChange = {(e) => setSetsToWin(parseInt(e.target.value))}
          >
            <option value={1}>Best of 1</option>
            <option value={2}>Best of 3</option>
            <option value={3}>Best of 5</option>
          </select>
        <button className='btn btn-primary btn-block' type="submit">Create Match</button>
      </form>
    </div>
  );

}

export default App
