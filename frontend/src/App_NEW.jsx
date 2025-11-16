import React, { useState } from 'react';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import DevicesPage from './pages/DevicesPage';

export default function App() {
  const [page, setPage] = useState('/');

  const navigate = (route) => {
    setPage(route);
  };

  const renderPage = () => {
    switch (page) {
      case '/':
        return <HomePage />;
      case '/devices':
        return <DevicesPage />;
      case '/incidents':
      case '/history':
      case '/contacts':
      case '/policies':
        return (
          <div className="bg-slate-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-white">Page: {page}</h3>
            <p className="text-gray-400">This page is under construction.</p>
          </div>
        );
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex w-full h-screen bg-slate-950 text-gray-200 font-sans overflow-hidden">
      <Layout currentPage={page} navigate={navigate}>
        {renderPage()}
      </Layout>
    </div>
  );
}
