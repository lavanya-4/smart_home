// src/Login.js
import React, { useState } from 'react';

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email); // Simulated login, replace with proper auth in real app
    } else {
      setError("Please enter both fields.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '2em auto', background: '#1d2233', padding: '2em', borderRadius: '16px', color: 'white' }}>
      <h2 style={{ fontWeight: 'bold', marginBottom: '1em' }}>Welcome Back</h2>
      {error && <div style={{ color: 'red', marginBottom: '1em' }}>{error}</div>}
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '0.5em', marginBottom: '1em' }} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '0.5em', marginBottom: '1em' }} />
      <button type="submit" style={{ width: '100%', padding: '0.75em', background: '#5e4af6', color: 'white', border: 'none', borderRadius: '8px', marginBottom: '1em' }}>Login</button>
      <div style={{ marginTop: '1em', fontSize: '0.9em' }}>Don't have an account?</div>
    </form>
  );
}

export default Login;
