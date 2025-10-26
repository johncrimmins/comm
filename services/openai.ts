/**
 * OpenAI API integration for making messages more concise
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

export interface ConciseOptions {
  text: string;
}

export interface ConciseResponse {
  conciseText: string;
}

/**
 * Makes the provided text more concise while preserving intent and references
 */
export async function makeConcise(options: ConciseOptions): Promise<ConciseResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your environment variables.');
  }

  if (!options.text.trim()) {
    throw new Error('Text cannot be empty');
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
            content: 'You are a helpful assistant that makes messages more concise while preserving the original intent and any references (names, dates, places, etc.). Return only the concise version without any additional explanation.'
          },
          {
            role: 'user',
            content: `Make this message more concise while keeping all important information and references:\n\n${options.text}`
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
    const conciseText = data.choices?.[0]?.message?.content?.trim();

    if (!conciseText) {
      throw new Error('No concise text returned from OpenAI');
    }

    return { conciseText };
  } catch (error: any) {
    console.error('[OpenAI] Error making text concise:', error);
    throw error;
  }
}

