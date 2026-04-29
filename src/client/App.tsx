import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          WAWP
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Write Anything, Publish Everywhere
        </p>
        <div className="p-4 bg-white rounded-lg shadow">
          <p className="text-sm text-gray-500 mb-2">Coming Soon</p>
          <button
            onClick={() => setCount(count + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Count: {count}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;