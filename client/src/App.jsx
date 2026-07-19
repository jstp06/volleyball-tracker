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

  useEffect(() => {
    fetch('http://localhost:3001/api/matches')
    .then((res) => res.json())
    .then((data) => {
      setMatches(data);
      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

   const handleCreateMatch = async (e) => { // form submission
    e.preventDefault();

    try{
      const response = await fetch('http://localhost:3001/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opponent, date })
      });
      const newMatch = await response.json();

      setMatches([...matches, newMatch]);
      setOpponent('');
      setDate('');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <p>Loading matches...</p>;
  }

  if (selectedMatch) {
    return (
      <MatchDetail
        match={selectedMatch}
        onBack={() => setSelectedMatch(null)}
        />
    );
  }

  if (showPlayers) {
    return <Players onBack={() => setShowPlayers(false)} />;
  }

  return (
    <div>
      <h1>Volleyball Tracker</h1>

      <button onClick={() => setShowPlayers(true)}>Manage Roster</button>

      <h2>Matches</h2>
      <ul>
        {matches.map((match) => (
          <li key = {match.id} onClick={() => setSelectedMatch(match)}>
            {match.opponent} - {new Date(match.date).toLocaleDateString()} - {match.status}
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
        <button type="submit">Create Match</button>
      </form>
    </div>
  );

}

export default App
