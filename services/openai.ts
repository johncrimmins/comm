/**
 * OpenAI API integration for text transformations
 */

const getEnv = (key: string): string => {
  const value = process.env[key as keyof NodeJS.ProcessEnv];
  if (!value) {
    console.warn(`[OpenAI] Missing environment variable: ${key}`);
    return '';
  }
  return String(value);
};

const OPENAI_API_KEY = getEnv('EXPO_PUBLIC_OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface TransformOptions {
  text: string;
  systemPrompt: string;
}

/**
 * Generic function to transform text using OpenAI API with a custom system prompt
 */
export async function transformText(options: TransformOptions): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your environment variables.');
  }

  if (!options.text.trim()) {
    throw new Error('Text cannot be empty');
  }

  if (!options.systemPrompt.trim()) {
    throw new Error('System prompt cannot be empty');
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: options.systemPrompt
          },
          {
            role: 'user',
            content: `Transform this message:\n\n${options.text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const transformedText = data.choices?.[0]?.message?.content?.trim();

    if (!transformedText) {
      throw new Error('No transformed text returned from OpenAI');
    }

    return transformedText;
  } catch (error: any) {
    console.error('[OpenAI] Error transforming text:', error);
    throw error;
  }
}

