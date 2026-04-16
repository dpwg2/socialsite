const KEY_STORAGE = 'smcm_ai_key';

export function getAiKey(): string {
  return localStorage.getItem(KEY_STORAGE) || '';
}

export function setAiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(KEY_STORAGE);
  }
}

const PLATFORM_STYLE: Record<string, string> = {
  instagram: 'engaging and visual, uses 2–3 relevant emojis naturally within the text, ends with 5–8 relevant hashtags on a new line',
  facebook:  'conversational and informative, ends with a question or call to action to drive comments',
  twitter:   'punchy and direct, under 260 characters total, 1–2 hashtags maximum',
  linkedin:  'professional and insightful, focuses on business value or industry insight, no hashtag spam',
};

export async function generatePostContent(image: string, platform: string): Promise<string> {
  const apiKey = getAiKey();
  if (!apiKey) throw new Error('no_key');

  // Build image content block
  let imageBlock: Record<string, unknown>;
  if (image.startsWith('data:')) {
    const [header, data] = image.split(',');
    const mediaType = (header.match(/data:([^;]+)/) ?? [])[1] ?? 'image/jpeg';
    imageBlock = { type: 'image', source: { type: 'base64', media_type: mediaType, data } };
  } else {
    imageBlock = { type: 'image', source: { type: 'url', url: image } };
  }

  const prompt = `You are a social media copywriter for a premium property and construction brand.
Look at this image and write a compelling ${platform} post caption.
Style: ${PLATFORM_STYLE[platform] ?? 'engaging and professional'}.
Write only the caption — no intro phrases like "Here's a caption:" or "Caption:".`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-calls': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: [imageBlock, { type: 'text', text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message ?? `API error ${res.status}`);
  }

  const json = await res.json();
  return (json.content?.[0]?.text ?? '').trim();
}
