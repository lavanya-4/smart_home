function LoginCard({ onLogin }) {
  return (
    <div className="w-full max-w-sm bg-slate-800 rounded-2xl shadow-2xl p-8">
      <h2 className="text-3xl font-bold text-center text-white mb-2">Welcome Back</h2>
      <p className="text-center text-gray-400 mb-8">Good Morning, Mome (---)</p>
      <form
        onSubmit={e => {
          e.preventDefault();
          onLogin();
        }}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="you@example.com"
            defaultValue="mome@example.com"
            className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="••••••••"
            defaultValue="password"
            className="w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full p-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default function AuthPage({ onLogin }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <LoginCard onLogin={onLogin} />
    </div>
  );
}
