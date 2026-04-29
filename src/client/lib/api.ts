const API_BASE = import.meta.env.VITE_API_URL || '';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'An error occurred' };
    }

    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Platform {
  id: string;
  name: string;
  display_name: string;
  api_base_url: string;
  logo_url: string | null;
  connected?: boolean;
}

export interface PublishedPost {
  id: string;
  post_id: string;
  platform_id: string;
  external_id: string | null;
  external_url: string | null;
  published_at: string;
  platform_name: string;
  platform_display_name: string;
  logo_url: string | null;
}

export const api = {
  auth: {
    login: async (email: string, name?: string) => {
      const res = await request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, name }),
      });
      if (res.data?.token) {
        document.cookie = `auth_token=${res.data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      }
      return res;
    },
    logout: async () => {
      document.cookie = 'auth_token=; path=/; max-age=0';
      return request('/api/auth/logout', { method: 'POST' });
    },
    me: async () => {
      return request<{ user: User }>('/api/auth/me');
    },
  },

  posts: {
    list: async () => {
      const res = await request<{ posts: Post[] }>('/api/posts');
      return res.data?.posts || [];
    },
    get: async (id: string) => {
      const res = await request<{ post: Post; published: PublishedPost[] }>(`/api/posts/${id}`);
      return res.data;
    },
    create: async (title: string, content: string) => {
      const res = await request<{ post: Post }>('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      });
      return res.data?.post;
    },
    update: async (id: string, title: string, content: string) => {
      const res = await request<{ post: Post }>(`/api/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, content }),
      });
      return res.data?.post;
    },
    delete: async (id: string) => {
      return request(`/api/posts/${id}`, { method: 'DELETE' });
    },
  },

  platforms: {
    list: async () => {
      const res = await request<{ platforms: Platform[] }>('/api/platforms');
      return res.data?.platforms || [];
    },
    connect: async (platformId: string, accessToken: string, refreshToken?: string) => {
      return request('/api/platforms/connect', {
        method: 'POST',
        body: JSON.stringify({ platformId, accessToken, refreshToken }),
      });
    },
    disconnect: async (platformId: string) => {
      return request('/api/platforms/disconnect', {
        method: 'POST',
        body: JSON.stringify({ platformId }),
      });
    },
  },

  publish: {
    execute: async (postId: string, platformIds: string[]) => {
      const res = await request<{ results: Array<{ platformId: string; success: boolean; externalUrl?: string; error?: string }> }>('/api/publish', {
        method: 'POST',
        body: JSON.stringify({ postId, platformIds }),
      });
      return res.data?.results || [];
    },
  },
};