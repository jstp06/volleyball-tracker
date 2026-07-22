import { useState, useEffect } from 'react'
import './App.css'
import MatchDetail from './MatchDetail';
import Players from './Players';

function App() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showPlayers, setShowPlayers] = useState(false);
  const [error, setError] = useState(null);
  const [setsToWin, setSetsToWin] = useState(3);

  const fetchMatches = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/matches');
      const data = await response.json();
      setMatches(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Could not load matches. Is ther server running?');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

   const handleCreateMatch = async (e) => { // form submission
    e.preventDefault();

    try{
      const response = await fetch('http://localhost:3001/api/matches', {
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
    return <p>Loading matches...</p>;
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

  const handleDeleteMatch = async (matchId) => {
    const confirmed = window.confirm('Delete this match and all its sets and actions? This cannot be undone.');
    if (!confirmed) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:3001/api/matches/${matchId}`, {
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
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h1>Volleyball Tracker</h1>

      <button onClick={() => setShowPlayers(true)}>Manage Roster</button>

      <h2>Matches</h2>
      <ul>
        {matches.map((match) => (
          <li key = {match.id}> 
            <span onClick={() => setSelectedMatch(match)}>
            {match.opponent} - {new Date(match.date).toLocaleDateString()} - {match.status}
            </span>
            <button onClick={() => handleDeleteMatch(match.id)}>Delete</button>
          </li>
        ))}
      </ul>

      <h2>Create a Match</h2>
      <form onSubmit={handleCreateMatch}>
        <input
          type="text"
          placeholder='Opponent'
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
        />
        <input 
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <select
          value ={setsToWin}
          onChange = {(e) => setSetsToWin(parseInt(e.target.value))}
          >
            <option value={1}>Best of 1</option>
            <option value={2}>Best of 3</option>
            <option value={3}>Best of 5</option>
          </select>
        <button type="submit">Create Match</button>
      </form>
    </div>
  );

}

export default App
