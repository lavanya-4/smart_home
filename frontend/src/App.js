// src/App.js
import React, { useState } from 'react';
import Login from './Login';
import RoleSelect from './RoleSelect';
import Incidents from './Incidents';

function App() {
  const [user, setUser] = useState(null);          // Holds logged-in user
  const [role, setRole] = useState(null);          // Holds selected role

  if (!user) return <Login onLogin={setUser} />;
  if (!role) return <RoleSelect onSelect={setRole} />;

  return (
    <div className="App">
      <h1 style={{ margin: '1em 0' }}>Smart Home Dashboard</h1>
      <div style={{ marginBottom: '1em' }}>
        Logged in as: <b>{user}</b> | Role: <b>{role}</b>
      </div>
      {/* You can show different dashboards depending on role here */}
      <Incidents />
    </div>
  );
}

export default App;
