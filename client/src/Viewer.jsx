import { useState, useEffect } from 'react';
import { io } from 'socket.io-client'; 

function Viewer({ set, onBack }) {
    const [currentSet, setCurrentSet] = useState(set);

    const refreshSet = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/matches/${currentSet.match_id}/sets`);
            const allSets = await response.json();
            const updated = allSets.find((s) => s.id === currentSet.id);
            if (updated) {
                setCurrentSet(updated);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const socket = io('http://localhost:3001');

        socket.emit('join-set', currentSet.id);

        socket.on('score-updated', (data) => {
            if (data.setId === currentSet.id) {
                refreshSet();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [currentSet.id]);

    return (
        <div>
            <button onClick={onBack}>← Back</button>
            <h1>Set {currentSet.set_number}</h1>
            <h2 style={{ fontSize: '4rem' }}>
                {currentSet.our_score} - {currentSet.opponent_score}
            </h2>
            <p>Status: {currentSet.status}</p>
        </div>
    );
}

export default Viewer;