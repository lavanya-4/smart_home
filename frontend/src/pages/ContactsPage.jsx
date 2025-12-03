import React from 'react';

const dummyContacts = [
  { id: 1, name: 'John Doe', role: 'Caregiver', phone: '+1 234 567 8901', email: 'john.doe@example.com' },
  { id: 2, name: 'Jane Smith', role: 'House Admin', phone: '+1 987 654 3210', email: 'jane.smith@example.com' },
  { id: 3, name: 'Emily Johnson', role: 'Emergency Contact', phone: '+1 555 123 4567', email: 'emily.johnson@example.com' },
];

export default function ContactsPage() {
  return (
    <div className="p-6 bg-slate-800 text-white rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Contacts</h1>
      <ul className="space-y-4">
        {dummyContacts.map((contact) => (
          <li key={contact.id} className="p-4 bg-slate-700 rounded-lg border-l-4 border-indigo-500">
            <h2 className="text-xl font-semibold text-indigo-300">{contact.name}</h2>
            <p className="text-gray-300">Role: {contact.role}</p>
            <p className="text-gray-300">Phone: {contact.phone}</p>
            <p className="text-gray-300">Email: {contact.email}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}