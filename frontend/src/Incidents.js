import React, { useEffect, useState } from 'react';
const API_BASE = process.env.REACT_APP_API_BASE;

function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/incidents`)
      .then(res => res.json())
      .then(data => {
        setIncidents(data.items || []);
        setLoading(false);
      })
      .catch(() => { setError('Could not fetch incidents.'); setLoading(false); });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Open Incidents</h2>
      <ul>
        {incidents.map(inc => (
          <li key={inc.id} onClick={() => setSelected(inc)} style={{cursor:'pointer', margin:'10px 0'}}>
            {inc.type} | Score: {inc.score} | Status: {inc.status}
          </li>
        ))}
      </ul>
      {selected && (
        <div style={{border:'1px solid #aaa', padding:'1em', marginTop:'1em'}}>
          <h3>Incident Details</h3>
          <p>ID: {selected.id}</p>
          <p>Type: {selected.type}</p>
          <p>Score: {selected.score}</p>
          <button onClick={async () => {
            try {
              const res = await fetch(`${API_BASE}/incidents/${selected.id}/ack`, {
                method:'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({note: 'Acknowledged from dashboard'})
              });
              if (res.ok) alert('Acknowledged!');
              else alert('Failed to acknowledge');
            } catch {
              alert('Error acknowledging! Check your network connection.');
            }
          }}>Acknowledge</button>
          <button onClick={() => setSelected(null)} style={{marginLeft:'1em'}}>Close</button>
        </div>
      )}
    </div>
  );
}

export default Incidents;
