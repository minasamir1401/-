import { prisma } from '../prisma';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash';
const MODEL_FALLBACKS = Array.from(
  new Set([
    DEFAULT_MODEL,
    'gemini-3.1-flash-lite',
    'gemini-3.1-flash-lite-preview',
    'gemini-3-flash-preview',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-4-hydrogen',
  ]),
);
const COOLDOWN_MS = 60_000;

let rrCursor = 0;
let envKeysSynced = false;

export interface MaskedKeyDto {
  id: number;
  label: string;
  maskedKey: string;
  source: string;
  isActive: boolean;
  requestsCount: number;
  successCount: number;
  errorCount: number;
  lastStatus: string | null;
  lastError: string | null;
  lastUsedAt: string | null;
  cooldownUntil: string | null;
  nextInLine: boolean;
}

export interface GeminiContentPart {
  text: string;
}

export interface GeminiTurn {
  role: 'user' | 'model';
  parts: GeminiContentPart[];
}

export interface GeminiPoolCallResult {
  text: string;
  model: string;
  attempts: number;
  usedKey: {
    id: number;
    label: string;
    maskedKey: string;
    slotNumber: number;
    totalActiveKeys: number;
  };
}

export function maskApiKey(rawKey: string): string {
  const key = rawKey.trim();
  if (key.length <= 12) return `${key.slice(0, 3)}***${key.slice(-2)}`;
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

function parseRawKeyList(raw: string): string[] {
  const parts = raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 16);
  return Array.from(new Set(parts));
}

export async function validateGeminiKey(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${GEMINI_BASE_URL}?key=${encodeURIComponent(apiKey)}`, {
      signal: AbortSignal.timeout(12_000),
    });
    if (res.ok) return { ok: true };
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    return {
      ok: false,
      error: body?.error?.message || `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'تعذر الاتصال بخدمة Gemini للتحقق من المفتاح',
    };
  }
}

export async function syncEnvGeminiKeys(): Promise<void> {
  if (envKeysSynced) return;
  const rawCombined = [process.env.GEMINI_API_KEYS || '', process.env.GEMINI_API_KEY || '']
    .filter(Boolean)
    .join(',');
  const envKeys = parseRawKeyList(rawCombined);
  if (!envKeys.length) {
    envKeysSynced = true;
    return;
  }

  for (let i = 0; i < envKeys.length; i++) {
    const apiKey = envKeys[i];
    const existing = await prisma.aiApiKey.findUnique({ where: { apiKey }, select: { id: true } });
    if (!existing) {
      await prisma.aiApiKey.create({
        data: {
          label: `مفتاح Gemini #${i + 1}`,
          apiKey,
          maskedKey: maskApiKey(apiKey),
          source: 'ENV',
          isActive: true,
        },
      });
    }
  }
  envKeysSynced = true;
}

export async function listMaskedKeys(): Promise<{
  keys: MaskedKeyDto[];
  activeCount: number;
  totalRequests: number;
  totalSuccess: number;
  totalErrors: number;
  model: string;
}> {
  await syncEnvGeminiKeys();
  const rows = await prisma.aiApiKey.findMany({ orderBy: { id: 'asc' } });
  const activeRows = rows.filter((r) => r.isActive);
  const nextActiveId = activeRows.length ? activeRows[rrCursor % activeRows.length].id : -1;

  const keys: MaskedKeyDto[] = rows.map((r) => ({
    id: r.id,
    label: r.label,
    maskedKey: r.maskedKey,
    source: r.source,
    isActive: r.isActive,
    requestsCount: r.requestsCount,
    successCount: r.successCount,
    errorCount: r.errorCount,
    lastStatus: r.lastStatus,
    lastError: r.lastError,
    lastUsedAt: r.lastUsedAt ? r.lastUsedAt.toISOString() : null,
    cooldownUntil: r.cooldownUntil ? r.cooldownUntil.toISOString() : null,
    nextInLine: r.isActive && r.id === nextActiveId,
  }));

  return {
    keys,
    activeCount: activeRows.length,
    totalRequests: rows.reduce((sum, r) => sum + r.requestsCount, 0),
    totalSuccess: rows.reduce((sum, r) => sum + r.successCount, 0),
    totalErrors: rows.reduce((sum, r) => sum + r.errorCount, 0),
    model: DEFAULT_MODEL,
  };
}

export async function addApiKeys(
  rawInput: string,
  baseLabel?: string,
): Promise<{
  added: MaskedKeyDto[];
  duplicates: string[];
  invalid: Array<{ maskedKey: string; reason: string }>;
}> {
  const candidates = parseRawKeyList(rawInput);
  if (!candidates.length) {
    throw new Error('يرجى إدخال مفتاح Gemini API صحيح واحد على الأقل.');
  }

  const existingCount = await prisma.aiApiKey.count();
  const addedIds: number[] = [];
  const duplicates: string[] = [];
  const invalid: Array<{ maskedKey: string; reason: string }> = [];

  for (let i = 0; i < candidates.length; i++) {
    const apiKey = candidates[i];
    const masked = maskApiKey(apiKey);
    const exists = await prisma.aiApiKey.findUnique({ where: { apiKey }, select: { id: true } });
    if (exists) {
      duplicates.push(masked);
      continue;
    }

    const check = await validateGeminiKey(apiKey);
    if (!check.ok) {
      invalid.push({ maskedKey: masked, reason: check.error || 'مفتاح غير صالح' });
      continue;
    }

    const num = existingCount + addedIds.length + 1;
    const label = baseLabel?.trim()
      ? candidates.length > 1
        ? `${baseLabel.trim()} (${addedIds.length + 1})`
        : baseLabel.trim()
      : `مفتاح Gemini #${num}`;

    const created = await prisma.aiApiKey.create({
      data: {
        label,
        apiKey,
        maskedKey: masked,
        source: 'MANUAL',
        isActive: true,
      },
      select: { id: true },
    });
    addedIds.push(created.id);
  }

  const pool = await listMaskedKeys();
  const added = pool.keys.filter((k) => addedIds.includes(k.id));
  return { added, duplicates, invalid };
}

export async function toggleApiKeyActive(id: number, isActive?: boolean, label?: string) {
  const existing = await prisma.aiApiKey.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return null;

  await prisma.aiApiKey.update({
    where: { id },
    data: {
      ...(typeof isActive === 'boolean' ? { isActive, ...(isActive ? { cooldownUntil: null } : {}) } : {}),
      ...(label?.trim() ? { label: label.trim().slice(0, 80) } : {}),
    },
  });
  return listMaskedKeys();
}

export async function deleteApiKey(id: number): Promise<boolean> {
  const existing = await prisma.aiApiKey.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return false;
  await prisma.aiApiKey.delete({ where: { id } });
  return true;
}

export interface GeminiCallOptions {
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseSchema?: Record<string, unknown>;
  thinkingBudget?: number;
  timeoutMs?: number;
  modelCandidates?: string[];
}

function buildGenerationConfig(model: string, options?: GeminiCallOptions): Record<string, unknown> {
  const generationConfig: Record<string, unknown> = {
    temperature: options?.temperature ?? 0.4,
    maxOutputTokens: options?.maxOutputTokens ?? 3072,
  };
  if (options?.responseMimeType) {
    generationConfig.responseMimeType = options.responseMimeType;
  }
  if (options?.responseSchema) {
    generationConfig.responseSchema = options.responseSchema;
  }
  if (
    typeof options?.thinkingBudget === 'number' &&
    !model.includes('lite') &&
    (model.includes('2.5-flash') || model.includes('3.5-flash') || model.includes('3-flash'))
  ) {
    generationConfig.thinkingConfig = { thinkingBudget: options.thinkingBudget };
  }
  return generationConfig;
}

async function callSingleGeminiKey(
  apiKey: string,
  systemInstruction: string,
  contents: GeminiTurn[],
  options?: GeminiCallOptions,
): Promise<
  | { ok: true; text: string; model: string }
  | { ok: false; status: number; message: string; retryNextKey: boolean }
> {
  const modelsToTry = options?.modelCandidates?.length ? options.modelCandidates : MODEL_FALLBACKS;
  let lastFailure: { ok: false; status: number; message: string; retryNextKey: boolean } = {
    ok: false,
    status: 404,
    message: 'لم يتوفر نموذج Gemini نشط لهذا المفتاح',
    retryNextKey: true,
  };

  for (const model of modelsToTry) {
    try {
      const res = await fetch(
        `${GEMINI_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: buildGenerationConfig(model, options),
          }),
          signal: AbortSignal.timeout(options?.timeoutMs ?? 35_000),
        },
      );

      if (res.status === 404) {
        continue;
      }

      const data = (await res.json().catch(() => ({}))) as {
        candidates?: Array<{
          finishReason?: string;
          content?: { parts?: Array<{ text?: string }> };
        }>;
        promptFeedback?: { blockReason?: string };
        error?: { message?: string };
      };

      if (!res.ok) {
        const errMsg = data?.error?.message || `HTTP ${res.status}`;
        const retryNextKey = res.status === 429 || res.status === 401 || res.status === 403 || res.status >= 500;
        lastFailure = { ok: false, status: res.status, message: errMsg, retryNextKey };
        if (res.status === 429 || res.status === 503 || res.status >= 500) {
          continue;
        }
        return lastFailure;
      }

      const candidate = data?.candidates?.[0];
      const text = (candidate?.content?.parts || [])
        .map((p) => p.text || '')
        .join('')
        .trim();

      if (!text) {
        const blockReason = data?.promptFeedback?.blockReason || candidate?.finishReason || 'EMPTY';
        return {
          ok: false,
          status: 502,
          message: `استجابة غير مكتملة (${blockReason})`,
          retryNextKey: blockReason !== 'SAFETY',
        };
      }

      return { ok: true, text, model };
    } catch (err) {
      lastFailure = {
        ok: false,
        status: 504,
        message: err instanceof Error ? err.message : 'انتهت مهلة الاتصال بـ Gemini',
        retryNextKey: true,
      };
    }
  }

  return lastFailure;
}

export async function executeWithGeminiPool(
  systemInstruction: string,
  contents: GeminiTurn[],
  options?: GeminiCallOptions,
): Promise<GeminiPoolCallResult> {
  await syncEnvGeminiKeys();
  const activeKeys = await prisma.aiApiKey.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
  });

  if (!activeKeys.length) {
    throw new Error('لا توجد مفاتيح Gemini API مفعّلة حالياً. يرجى إضافة مفتاح واحد على الأقل.');
  }

  const ticket = rrCursor++;
  const startIdx = ticket % activeKeys.length;
  const ringOrder = activeKeys.map((_, offset) => {
    const idx = (startIdx + offset) % activeKeys.length;
    return { row: activeKeys[idx], slotNumber: idx + 1 };
  });

  const now = Date.now();
  const readyFirst = ringOrder.filter((k) => !k.row.cooldownUntil || k.row.cooldownUntil.getTime() <= now);
  const cooledLater = ringOrder.filter((k) => k.row.cooldownUntil && k.row.cooldownUntil.getTime() > now);
  const attemptOrder = [...readyFirst, ...cooledLater];

  let attempts = 0;
  let lastErrorMsg = '';

  for (const candidate of attemptOrder) {
    attempts++;
    const keyRow = candidate.row;

    await prisma.aiApiKey.update({
      where: { id: keyRow.id },
      data: {
        requestsCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    const outcome = await callSingleGeminiKey(keyRow.apiKey, systemInstruction, contents, options);
    if (outcome.ok) {
      await prisma.aiApiKey.update({
        where: { id: keyRow.id },
        data: {
          successCount: { increment: 1 },
          lastStatus: 'OK',
          lastError: null,
          cooldownUntil: null,
        },
      });

      return {
        text: outcome.text,
        model: outcome.model,
        attempts,
        usedKey: {
          id: keyRow.id,
          label: keyRow.label,
          maskedKey: keyRow.maskedKey,
          slotNumber: candidate.slotNumber,
          totalActiveKeys: activeKeys.length,
        },
      };
    }

    lastErrorMsg = outcome.message;
    const isCooldownError = outcome.status === 429 || outcome.status >= 500;
    await prisma.aiApiKey.update({
      where: { id: keyRow.id },
      data: {
        errorCount: { increment: 1 },
        lastStatus: `HTTP ${outcome.status}`,
        lastError: outcome.message.slice(0, 500),
        ...(isCooldownError ? { cooldownUntil: new Date(Date.now() + COOLDOWN_MS) } : {}),
      },
    });

    if (!outcome.retryNextKey) {
      break;
    }
  }

  throw new Error(`تعذر إتمام الطلب بعد تجربة ${attempts} مفتاحاً/مفاتيح: ${lastErrorMsg}`);
}
