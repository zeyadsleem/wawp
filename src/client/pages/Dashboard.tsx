import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, type Post, type Platform } from '../lib/api';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlatforms, setShowPlatforms] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [postsData, platformsData] = await Promise.all([
      api.posts.list(),
      api.platforms.list(),
    ]);
    setPosts(postsData);
    setPlatforms(platformsData);
    setLoading(false);
  };

  const handleConnect = async (platformId: string) => {
    if (!tokenInput) return;
    setConnecting(platformId);
    await api.platforms.connect(platformId, tokenInput);
    setTokenInput('');
    setConnecting(null);
    loadData();
  };

  const handleDisconnect = async (platformId: string) => {
    await api.platforms.disconnect(platformId);
    loadData();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    await api.posts.delete(postId);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">WAWP</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Your Posts</h2>
          <Link
            to="/editor"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            New Post
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">No posts yet. Create your first post!</p>
            <Link
              to="/editor"
              className="text-blue-600 hover:text-blue-700"
            >
              Create Post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow p-6 flex justify-between items-start"
              >
                <div className="flex-1">
                  <Link
                    to={`/editor/${post.id}`}
                    className="text-lg font-medium text-gray-900 hover:text-blue-600"
                  >
                    {post.title || 'Untitled'}
                  </Link>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                    {post.excerpt || 'No content'}
                  </p>
                  <div className="text-xs text-gray-400 mt-2">
                    Updated {new Date(post.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link
                    to={`/editor/${post.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12">
          <button
            onClick={() => setShowPlatforms(!showPlatforms)}
            className="text-lg font-semibold text-gray-900 flex items-center gap-2"
          >
            <span>{showPlatforms ? '▼' : '▶'}</span>
            Platform Connections
          </button>

          {showPlatforms && (
            <div className="mt-4 bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 mb-6">
                Connect your publishing accounts to publish to multiple platforms at once.
              </p>
              <div className="space-y-4">
                {platforms.map((platform) => (
                  <div
                    key={platform.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {platform.logo_url ? (
                        <img
                          src={platform.logo_url}
                          alt={platform.display_name}
                          className="w-10 h-10"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                      )}
                      <div>
                        <div className="font-medium">{platform.display_name}</div>
                        <div className="text-sm text-gray-500">
                          {platform.connected ? 'Connected' : 'Not connected'}
                        </div>
                      </div>
                    </div>
                    {platform.connected ? (
                      <button
                        onClick={() => handleDisconnect(platform.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder="API Token"
                          value={tokenInput}
                          onChange={(e) => setTokenInput(e.target.value)}
                          className="px-3 py-2 border rounded-md text-sm"
                        />
                        <button
                          onClick={() => handleConnect(platform.id)}
                          disabled={connecting === platform.id || !tokenInput}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
                        >
                          {connecting === platform.id ? 'Connecting...' : 'Connect'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}