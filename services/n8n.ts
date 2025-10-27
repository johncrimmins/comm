/**
 * n8n Webhook Integration
 * Calls n8n workflows for RAG-powered tool execution
 */

const getEnv = (key: string): string => {
  const value = process.env[key as keyof NodeJS.ProcessEnv];
  if (!value) {
    console.warn(`[n8n] Missing environment variable: ${key}`);
    return '';
  }
  return String(value);
};

const N8N_WEBHOOK_URL = getEnv('EXPO_PUBLIC_N8N_WEBHOOK_URL');
console.log('[n8n] Environment variable loaded:', N8N_WEBHOOK_URL ? '✅ Yes' : '❌ No');

export interface N8NToolParams {
  conversationId: string;
  userId: string;
}

/**
 * Call n8n workflow for conversation summarization
 */
export async function summarizeConversation(params: N8NToolParams): Promise<string> {
  if (!N8N_WEBHOOK_URL) {
    throw new Error('n8n webhook URL not configured. Please add EXPO_PUBLIC_N8N_WEBHOOK_URL to your environment variables.');
  }

  // Use the webhook URL as-is (it's the complete endpoint)
  const webhookUrl = N8N_WEBHOOK_URL.endsWith('/') ? N8N_WEBHOOK_URL.slice(0, -1) : N8N_WEBHOOK_URL;
  console.log('[n8n] Calling webhook:', webhookUrl);
  console.log('[n8n] Params:', params);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify(params),
    });

    console.log('[n8n] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[n8n] Error response:', errorData);
      throw new Error(errorData.error?.message || `n8n webhook error: ${response.status}`);
    }

    // Get response text first to debug
    const responseText = await response.text();
    console.log('[n8n] Raw response text:', responseText);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('[n8n] Parsed JSON data:', data);
    } catch (parseError) {
      console.error('[n8n] Failed to parse JSON:', parseError);
      console.error('[n8n] Response text was:', responseText);
      throw new Error('Invalid JSON response from n8n');
    }
    
    return data.summary || 'Unable to generate summary';
  } catch (error: any) {
    console.error('[n8n] Error calling summarize workflow:', error);
    throw error;
  }
}

