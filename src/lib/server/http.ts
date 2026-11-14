import iconv from 'iconv-lite';

const USER_AGENT = 'OrthodoxPortalBot/1.0 (+https://localhost; respectful-indexer)';

export async function fetchTextWithCharset(url: string, timeoutMs = 20000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'ar,en;q=0.8',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const headSample = buffer.subarray(0, 1500).toString('ascii').toLowerCase();

    if (
      contentType.includes('windows-1256') ||
      headSample.includes('charset=windows-1256') ||
      headSample.includes('charset="windows-1256"')
    ) {
      return iconv.decode(buffer, 'windows-1256');
    }

    return buffer.toString('utf-8');
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson<T>(url: string, headers: Record<string, string> = {}, timeoutMs = 20000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        ...headers,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
