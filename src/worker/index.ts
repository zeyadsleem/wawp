import {
  sql,
  getUserByEmail,
  createUser,
  getPostsByUser,
  getPost,
  createPost,
  updatePost,
  deletePost,
  getPlatforms,
  getUserPlatformCredentials,
  savePlatformCredential,
  deletePlatformCredential,
  publishToPlatform,
  getPublishedPosts,
  type User,
} from './db';
import { verifyToken, getTokenFromRequest, createToken, createAuthCookie, clearAuthCookie } from './auth';
import { getPublisher } from './platforms';

interface Env {
  DATABASE_URL: string;
  JWT_SECRET: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function getUser(request: Request): Promise<User | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  
  const payload = await verifyToken(token);
  if (!payload) return null;
  
  const result = await sql`SELECT * FROM users WHERE id = ${payload.sub}`;
  return result[0] || null;
}

async function handleAuth(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  
  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    const { email, name } = await request.json();
    let user = await getUserByEmail(email);
    
    if (!user) {
      user = await createUser(email, name);
    }
    
    const token = await createToken(user);
    return new Response(JSON.stringify({ user, token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Set-Cookie': clearAuthCookie() },
    });
  }
  
  if (url.pathname === '/api/auth/me' && request.method === 'GET') {
    const user = await getUser(request);
    if (!user) {
      return new Response(JSON.stringify({ user: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  return new Response('Not found', { status: 404 });
}

async function handlePosts(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const user = await getUser(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  
  if (url.pathname === '/api/posts' && request.method === 'GET') {
    const posts = await getPostsByUser(user.id);
    return new Response(JSON.stringify({ posts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  if (url.pathname === '/api/posts' && request.method === 'POST') {
    const { title, content } = await request.json();
    const post = await createPost(user.id, title, content);
    return new Response(JSON.stringify({ post }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const postId = url.pathname.match(/\/api\/posts\/([^/]+)/)?.[1];
  if (postId) {
    const post = await getPost(postId);
    if (!post || post.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (request.method === 'GET') {
      const published = await getPublishedPosts(postId);
      return new Response(JSON.stringify({ post, published }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (request.method === 'PUT') {
      const { title, content } = await request.json();
      const updated = await updatePost(postId, title, content);
      return new Response(JSON.stringify({ post: updated }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (request.method === 'DELETE') {
      await deletePost(postId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
  
  return new Response('Not found', { status: 404 });
}

async function handlePlatforms(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const user = await getUser(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  
  if (url.pathname === '/api/platforms' && request.method === 'GET') {
    const platforms = await getPlatforms();
    const credentials = await getUserPlatformCredentials(user.id);
    const connectedPlatforms = credentials.map(c => ({
      id: c.platform_id,
      name: (c as any).platform_name,
      display_name: (c as any).platform_display_name,
      logo_url: (c as any).logo_url,
      connected: true,
    }));
    
    const allPlatforms = platforms.map(p => {
      const connected = connectedPlatforms.find(cp => cp.id === p.id);
      return connected || { ...p, connected: false };
    });
    
    return new Response(JSON.stringify({ platforms: allPlatforms }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  if (url.pathname === '/api/platforms/connect' && request.method === 'POST') {
    const { platformId, accessToken, refreshToken } = await request.json();
    await savePlatformCredential(user.id, platformId, accessToken, refreshToken);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  if (url.pathname === '/api/platforms/disconnect' && request.method === 'POST') {
    const { platformId } = await request.json();
    await deletePlatformCredential(user.id, platformId);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  return new Response('Not found', { status: 404 });
}

async function handlePublish(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const user = await getUser(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  
  if (url.pathname === '/api/publish' && request.method === 'POST') {
    const { postId, platformIds } = await request.json();
    
    const post = await getPost(postId);
    if (!post || post.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const credentials = await getUserPlatformCredentials(user.id);
    const results = [];

    for (const platformId of platformIds) {
      const cred = credentials.find(c => c.platform_id === platformId);
      if (!cred) {
        results.push({ platformId, success: false, error: 'Not connected' });
        continue;
      }

      const platform = await sql`SELECT * FROM platforms WHERE id = ${platformId}`;
      const publisher = getPublisher(platform[0].name);
      
      if (!publisher) {
        results.push({ platformId, success: false, error: 'Platform not supported' });
        continue;
      }

      const result = await publisher.publish(
        cred.access_token,
        post.title,
        post.content
      );

      if (result.success) {
        await publishToPlatform(postId, platformId, result.externalId!, result.externalUrl!);
      }

      results.push({ platformId, ...result });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  return new Response('Not found', { status: 404 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (url.pathname.startsWith('/api/auth')) {
      return handleAuth(request);
    }
    
    if (url.pathname.startsWith('/api/posts')) {
      return handlePosts(request);
    }
    
    if (url.pathname.startsWith('/api/platforms')) {
      return handlePlatforms(request);
    }
    
    if (url.pathname.startsWith('/api/publish')) {
      return handlePublish(request);
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('WAWP API - Write Anything, Publish Everywhere', { status: 200 });
  },
} satisfies ExportedHandler<Env>;