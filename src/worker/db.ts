import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_zQbVCKW9hwf4@ep-square-lab-ajlk0dwj-pooler.c-3.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

export const sql = neon(DATABASE_URL);

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Platform {
  id: string;
  name: string;
  display_name: string;
  api_base_url: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: Date;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface PlatformCredential {
  id: string;
  user_id: string;
  platform_id: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: Date | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface PublishedPost {
  id: string;
  post_id: string;
  platform_id: string;
  external_id: string | null;
  external_url: string | null;
  published_at: Date;
  created_at: Date;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sql`SELECT * FROM users WHERE email = ${email}`;
  return result[0] || null;
}

export async function createUser(email: string, name?: string): Promise<User> {
  const result = await sql`
    INSERT INTO users (email, name) VALUES (${email}, ${name || null})
    RETURNING *
  `;
  return result[0];
}

export async function getPostsByUser(userId: string): Promise<Post[]> {
  return await sql`SELECT * FROM posts WHERE user_id = ${userId} ORDER BY updated_at DESC`;
}

export async function getPost(postId: string): Promise<Post | null> {
  const result = await sql`SELECT * FROM posts WHERE id = ${postId}`;
  return result[0] || null;
}

export async function createPost(userId: string, title: string, content: string): Promise<Post> {
  const excerpt = content.substring(0, 200).replace(/<[^>]*>/g, '') + (content.length > 200 ? '...' : '');
  const result = await sql`
    INSERT INTO posts (user_id, title, content, excerpt) VALUES (${userId}, ${title}, ${content}, ${excerpt})
    RETURNING *
  `;
  return result[0];
}

export async function updatePost(postId: string, title: string, content: string): Promise<Post> {
  const excerpt = content.substring(0, 200).replace(/<[^>]*>/g, '') + (content.length > 200 ? '...' : '');
  const result = await sql`
    UPDATE posts SET title = ${title}, content = ${content}, excerpt = ${excerpt}, updated_at = NOW()
    WHERE id = ${postId}
    RETURNING *
  `;
  return result[0];
}

export async function deletePost(postId: string): Promise<void> {
  await sql`DELETE FROM posts WHERE id = ${postId}`;
}

export async function getPlatforms(): Promise<Platform[]> {
  return await sql`SELECT * FROM platforms WHERE is_active = true`;
}

export async function getUserPlatformCredentials(userId: string): Promise<(PlatformCredential & { platform: Platform })[]> {
  return await sql`
    SELECT pc.*, p.name as platform_name, p.display_name as platform_display_name, p.api_base_url, p.logo_url
    FROM platform_credentials pc
    JOIN platforms p ON pc.platform_id = p.id
    WHERE pc.user_id = ${userId}
  `;
}

export async function savePlatformCredential(
  userId: string,
  platformId: string,
  accessToken: string,
  refreshToken?: string
): Promise<PlatformCredential> {
  const result = await sql`
    INSERT INTO platform_credentials (user_id, platform_id, access_token, refresh_token)
    VALUES (${userId}, ${platformId}, ${accessToken}, ${refreshToken || null})
    ON CONFLICT (user_id, platform_id) DO UPDATE SET
      access_token = ${accessToken},
      refresh_token = ${refreshToken || null},
      updated_at = NOW()
    RETURNING *
  `;
  return result[0];
}

export async function deletePlatformCredential(userId: string, platformId: string): Promise<void> {
  await sql`DELETE FROM platform_credentials WHERE user_id = ${userId} AND platform_id = ${platformId}`;
}

export async function publishToPlatform(postId: string, platformId: string, externalId: string, externalUrl: string): Promise<PublishedPost> {
  const result = await sql`
    INSERT INTO published_posts (post_id, platform_id, external_id, external_url)
    VALUES (${postId}, ${platformId}, ${externalId}, ${externalUrl})
    RETURNING *
  `;
  return result[0];
}

export async function getPublishedPosts(postId: string): Promise<(PublishedPost & { platform: Platform })[]> {
  return await sql`
    SELECT pp.*, p.name as platform_name, p.display_name as platform_display_name, p.logo_url
    FROM published_posts pp
    JOIN platforms p ON pp.platform_id = p.id
    WHERE pp.post_id = ${postId}
  `;
}