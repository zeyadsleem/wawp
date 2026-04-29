import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, type Post, type Platform, type PublishedPost } from '../lib/api';

export function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [published, setPublished] = useState<PublishedPost[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<Array<{ platformId: string; success: boolean; externalUrl?: string; error?: string }>>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const [platformsData] = await Promise.all([
      api.platforms.list(),
    ]);
    setPlatforms(platformsData.filter(p => p.connected));

    if (id) {
      const data = await api.posts.get(id);
      if (data?.post) {
        setPost(data.post);
        setTitle(data.post.title);
        setContent(data.post.content);
        setPublished(data.published || []);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (id && post) {
        await api.posts.update(id, title, content);
      } else {
        const newPost = await api.posts.create(title, content);
        if (newPost) {
          navigate(`/editor/${newPost.id}`, { replace: true });
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!id || selectedPlatforms.length === 0) return;
    setPublishing(true);
    setPublishResults([]);
    
    const results = await api.publish.execute(id, selectedPlatforms);
    setPublishResults(results);
    setPublishing(false);
    loadData();
  };

  const connectedPlatforms = platforms.filter(p => p.connected);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Please sign in to continue</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
              ← Back
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">
              {id ? 'Edit Post' : 'New Post'}
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title..."
            className="w-full text-3xl font-bold border-none bg-transparent focus:outline-none focus:ring-0"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your content here... (Markdown supported)"
            className="w-full h-96 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {id && connectedPlatforms.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Publish to Platforms</h3>
            
            {published.length > 0 && (
              <div className="mb-4 p-3 bg-green-50 rounded-md">
                <p className="text-sm text-green-700 font-medium">Published to:</p>
                <div className="flex gap-2 mt-2">
                  {published.map((p) => (
                    <a
                      key={p.id}
                      href={p.external_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm bg-white border px-3 py-1 rounded hover:shadow"
                    >
                      {p.platform_display_name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 mb-4">
              {connectedPlatforms.map((platform) => {
                const alreadyPublished = published.some(p => p.platform_id === platform.id);
                return (
                  <label
                    key={platform.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                      alreadyPublished ? 'bg-green-50 border-green-200' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, platform.id]);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.id));
                        }
                      }}
                      disabled={alreadyPublished}
                      className="w-4 h-4 text-blue-600"
                    />
                    {platform.logo_url && (
                      <img src={platform.logo_url} alt={platform.display_name} className="w-6 h-6" />
                    )}
                    <span>{platform.display_name}</span>
                    {alreadyPublished && (
                      <span className="text-xs text-green-600 ml-auto">Published</span>
                    )}
                  </label>
                );
              })}
            </div>

            {selectedPlatforms.length > 0 && (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : `Publish to ${selectedPlatforms.length} platform(s)`}
              </button>
            )}

            {publishResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {publishResults.map((result, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-md ${
                      result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {result.success ? (
                      <a href={result.externalUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        Published successfully!
                      </a>
                    ) : (
                      `Failed: ${result.error}`
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {id && connectedPlatforms.length === 0 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700">
              Connect platforms in your dashboard to start publishing.
            </p>
            <Link to="/dashboard" className="text-yellow-800 underline hover:text-yellow-900">
              Go to Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}