// src/RoleSelect.js
import React from 'react';

function RoleSelect({ onSelect }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '2em', marginTop: '3em' }}>
      <div style={{ background: '#232b3b', padding: '2em', borderRadius: '16px', cursor: 'pointer', textAlign: 'center' }}
           onClick={() => onSelect('caregiver')}>
        <div style={{ fontSize: '3em', marginBottom: '0.5em', color: '#918cff' }}>👤</div>
        <div style={{ fontWeight: 'bold', fontSize: '1.4em' }}>Caregiver</div>
        <div style={{ marginTop: '0.5em', color: '#a3a7b9' }}>Monitor residents</div>
      </div>
      <div style={{ background: '#232b3b', padding: '2em', borderRadius: '16px', cursor: 'pointer', textAlign: 'center' }}
           onClick={() => onSelect('admin')}>
        <div style={{ fontSize: '3em', marginBottom: '0.5em', color: '#918cff' }}>⚙️</div>
        <div style={{ fontWeight: 'bold', fontSize: '1.4em' }}>Admin</div>
        <div style={{ marginTop: '0.5em', color: '#a3a7b9' }}>Manage system settings</div>
      </div>
    </div>
  );
}

export default RoleSelect;
