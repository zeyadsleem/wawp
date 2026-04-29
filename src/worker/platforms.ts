export interface PublishResult {
  success: boolean;
  externalId?: string;
  externalUrl?: string;
  error?: string;
}

export interface PlatformPublisher {
  publish(
    accessToken: string,
    title: string,
    content: string,
    tags?: string[]
  ): Promise<PublishResult>;
}

export class MediumPublisher implements PlatformPublisher {
  private baseUrl = 'https://api.medium.com/v1';

  async publish(accessToken: string, title: string, content: string, tags?: string[]): Promise<PublishResult> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          contentFormat: 'html',
          content,
          tags: tags || [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.errors?.[0]?.message || 'Failed to publish to Medium' };
      }

      const data = await response.json();
      return {
        success: true,
        externalId: data.data.id,
        externalUrl: data.data.url,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export class DevToPublisher implements PlatformPublisher {
  private baseUrl = 'https://dev.to/api';

  async publish(accessToken: string, title: string, content: string, tags?: string[]): Promise<PublishResult> {
    try {
      const response = await fetch(`${this.baseUrl}/articles`, {
        method: 'POST',
        headers: {
          'Authorization': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          article: {
            title,
            body_markdown: content,
            tags: tags || [],
            published: true,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to publish to Dev.to' };
      }

      const data = await response.json();
      return {
        success: true,
        externalId: String(data.id),
        externalUrl: data.url,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export class HashnodePublisher implements PlatformPublisher {
  private baseUrl = 'https://api.hashnode.com';

  async publish(accessToken: string, title: string, content: string, tags?: string[]): Promise<PublishResult> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation CreateStory($input: CreateStoryInput!) {
              createStory(input: $input) {
                id
                url
              }
            }
          `,
          variables: {
            input: {
              title,
              content,
              tags: tags?.map(t => ({ name: t })) || [],
              isPublished: true,
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.errors?.[0]?.message || 'Failed to publish to Hashnode' };
      }

      const data = await response.json();
      if (data.errors) {
        return { success: false, error: data.errors[0]?.message || 'Failed to publish to Hashnode' };
      }

      return {
        success: true,
        externalId: data.data.createStory.id,
        externalUrl: data.data.createStory.url,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export function getPublisher(platformName: string): PlatformPublisher | null {
  switch (platformName.toLowerCase()) {
    case 'medium':
      return new MediumPublisher();
    case 'devto':
      return new DevToPublisher();
    case 'hashnode':
      return new HashnodePublisher();
    default:
      return null;
  }
}