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

  // Use the webhook URL as-is (it's the complete endpoint, no need to append path)
  const webhookUrl = N8N_WEBHOOK_URL.endsWith('/') ? N8N_WEBHOOK_URL.slice(0, -1) : N8N_WEBHOOK_URL;
  console.log('[n8n] Calling webhook:', webhookUrl);
  console.log('[n8n] Params:', params);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify(params),
    });

    console.log('[n8n] Response status:', response.status, response.statusText);
    console.log('[n8n] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[n8n] Error response:', errorData);
      throw new Error(errorData.error?.message || `n8n webhook error: ${response.status}`);
    }

    // Parse JSON response - but first check if body exists
    const responseText = await response.text();
    console.log('[n8n] Raw response length:', responseText.length);
    console.log('[n8n] Raw response preview:', responseText.substring(0, 200));
    
    if (!responseText || responseText.length === 0) {
      throw new Error('n8n returned empty response. Check that Respond to Webhook node has data wired to it.');
    }
    
    const data = JSON.parse(responseText);
    console.log('[n8n] Parsed JSON data:', data);
    
    // Handle array response from n8n
    if (Array.isArray(data) && data.length > 0) {
      const summary = data[0].summary;
      console.log('[n8n] Extracted summary from array:', summary);
      return summary || 'Unable to generate summary';
    }
    
    // Handle object response
    if (data.summary) {
      return data.summary;
    }
    
    console.error('[n8n] Unexpected response format:', data);
    return 'Unable to generate summary';
  } catch (error: any) {
    console.error('[n8n] Error calling summarize workflow:', error);
    throw error;
  }
}

