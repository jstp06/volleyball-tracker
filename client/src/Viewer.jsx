import { useState, useEffect } from 'react';
import { io } from 'socket.io-client'; 

function Viewer({ set, onBack }) {
    const [currentSet, setCurrentSet] = useState(set);

    const refreshSet = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/matches/${currentSet.match_id}/sets`);
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
        const socket = io(import.meta.env.VITE_API_URL);

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
        <div className='page'>
            <button className='btn-back' onClick={onBack}>← Back</button>
            <div className='scoreboard'>
                <div className='scoreboard-label'>Set {currentSet.set_number}</div>
                <div className='scoreboard-score' style={{ fontSize: '5rem' }}>
                    {currentSet.our_score} - {currentSet.opponent_score}
                </div>
                <div className='scoreboard-status'>{currentSet.status}</div>
            </div>
        </div>
    );
}

export default Viewer;