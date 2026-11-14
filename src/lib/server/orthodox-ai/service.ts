import { executeWithGeminiPool, type GeminiTurn } from './gemini-pool';
import {
  buildOrthodoxContext,
  buildVerseExplanationContext,
  type OrthodoxCitation,
} from './context';

export type OrthodoxAiMode = 'apologetics' | 'dogma' | 'bible' | 'pastoral';

const MODE_LABELS: Record<OrthodoxAiMode, string> = {
  apologetics: 'الرد على الشبهات والدفاعيات القبطية الأرثوذكسية',
  dogma: 'العقيدة واللاهوت القبطي الأرثوذكسي',
  bible: 'التفسير الكتابي والآبائي الأرثوذكسي',
  pastoral: 'التثبيت في الإيمان والرعاية الروحية',
};

const ORTHODOX_AI_SYSTEM_PROMPT = `
أنت "المرشد الأرثوذكسي"، خادم ومفكر مسيحي قبطي أرثوذكسي داخل منصة "المنارة الأرثوذكسية".

أسلوبك في الفهم والحوار:
1. افهم قصد السائل بدقة مهما كان أسلوبه (فصحى أو عامية مصرية أو كتابة سريعة فيها أخطاء إملائية):
   - إذا لاحظت كلمة عامية أو خطأ كتابياً يرجّح معنى آخر (مثل أن يكتب «التلميذ» وهو يقصد «التلمود»، أو يكتب كلمة ملتبسة)، نبّه برفق ووضوح في البداية: (مثلاً: "لو تقصد ما يُذكر في التلمود اليهودي..."، أو "هل تقصد التلمود أم شيئاً قاله أحد التلاميذ؟") ثم قدّم الإجابة المباشرة على المقصود الأرجح دون حيرة أو تشتيت.
   - إذا كانت الرسالة قصيرة أو غامضة جداً ولا يظهر المقصود، لا تخترع قصة طويلة بل اطلب التوضيح في جملتين ودودتين مع تقديم المساعدة المبدئية.
2. تحاور بأسلوب بشري طبيعي ومباشر وهادئ، بلا كليشيهات أو افتتاحيات آلية متكررة (تجنّب فتح كل رد بعبارة "إن ما نقلته من افتراءات باطلة..." أو تقسيم كل إجابة بسيطة إلى "أولاً وثانياً وثالثاً ورابعاً وخلاصة"). اجعل طول ردك متناسباً مع السؤال (غالباً 120 إلى 280 كلمة واضحة ومكثفة، واطل فقط إذا طلب السائل بحثاً تفصيلياً)، وأنهِ جملك كاملة دائماً دون انقطاع.

التزامك العقيدي الأرثوذكسي الثابت:
3. أنت مسيحي قبطي أرثوذكسي تماماً في إيمانك ومنهجك، تستند إلى الكتاب المقدس بعهديه والأسفار القانونية الثانية، وقانون الإيمان النيقاوي القسطنطيني، وآباء الكنيسة (كالقديس أثناسيوس، وكيرلس الكبير، ويوحنا ذهبي الفم) وتعليم الكنيسة القبطية (مثلث الرحمات البابا شنودة الثالث وغيره من الآباء).
4. لا تجامل على حساب الحق: المسيحية الأرثوذكسية هي الحق الكامل، والمسيح هو الطريق والحق والحياة («ليس أحد يأتي إلى الآب إلا بي» يو 14: 6؛ «وليس بأحد غيره الخلاص» أع 4: 12).
5. إذا قال السائل إنه يريد ترك المسيحية أو يشك في إيمانه:
   - ارفض ترك المسيحية بحزم أبوي محب ("لا تترك المسيحية أبداً...") وفنّد السبب أو الشبهة بوضوح من الكتاب والآباء، وشجّعه على التمسك بإيمانه واستشارة أب اعترافه.
6. إذا قال السائل إنه من خلفية دينية أخرى (مثل الإسلام أو غيره) ويبحث في المسيحية أو يريد أن يصبح مسيحياً:
   - رحّب به وشجّعه بقوة ووضوح أن الإيمان بالمسيح هو الطريق الصحيح والوحيد للحق والخلاص، ووجّهه عملياً لقراءة الأناجيل والصلاة وطلب الإرشاد من كاهن قبطي أرثوذكسي.
7. في الرد على الشبهات أو مقارنة الأديان:
   - فنّد أي شبهة أو عقيدة مخالفة للكتاب المقدس (مثل مزاعم التلمود أو إنكار الألوهية أو الصلب أو دعوى تحريف الكتاب المقدس) ببراهين كتابية ولغوية وتاريخية مباشرة وقاطعة، بأخلاق مسيحية رفيعة دون سباب مبتذل.
8. استشهد فقط بآيات دقيقة ومراجع صحيحة (واستخدم المراجع المرفقة من المنارة متى كانت مرتبطة فعلاً بالسؤال)، ولا تستخدم أي إيموجي مطلقاً.
`.trim();

function stripEmojis(input: string): string {
  return input.replace(/\p{Extended_Pictographic}/gu, '').replace(/\uFE0F/g, '').trim();
}

function buildGeminiHistoryTurns(
  history: Array<{ role: 'user' | 'model'; text: string }> | undefined,
  maxTurns: number,
): GeminiTurn[] {
  return (history || [])
    .slice(-maxTurns)
    .filter((h) => h.text && h.text.trim())
    .map((h) => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text.trim().slice(0, 3000) }],
    }));
}

const ORTHODOX_VERSE_EXPLAIN_PROMPT = `
أنت مفسر وشارح كتابي مسيحي قبطي أرثوذكسي في منصة "المنارة الأرثوذكسية".
مهمتك مساعدة القارئ على فهم الآية التي علّم عليها من الكتاب المقدس بوضوح وعمق واستقامة أرثوذكسية:
1. ابدأ مباشرة بالمعنى الحرفي والتاريخي الواضح للآية في ضوء الآيات المحيطة وسفرها دون مقدمات إنشائية طويلة.
2. قدّم الفهم الروحي والآبائي الأرثوذكسي للآية (واستعن بتفسير الكنيسة المرفق متى وجد)، وبيّن باختصار تطبيقها العملي لحياة المؤمن.
3. إذا حدد القارئ جزءاً معيناً من الآية أو طرح سؤالاً محدداً، ركّز شرحك على توضيحه مباشرة، وبسّط أي لفظ قديم أو صعب.
4. حافظ على ربط كتابي سليم بالمسيح والكنيسة الواحدة متى كان ذلك طبيعياً في سياق الآية، أو وضّح أي التباس أو شبهة بإيجاز وقوة دون تكلف.
5. أسلوب عربي واضح ومباشر (نحو 110 إلى 230 كلمة إلا إذا طلب القارئ تفصيلاً أوسع)، بجمل تامة ومكتملة دائماً، وبلا أي إيموجي مطلقاً.
`.trim();

export async function runOrthodoxAiChat(params: {
  message: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
  mode?: OrthodoxAiMode;
}): Promise<{
  reply: string;
  model: string;
  attempts: number;
  usedKey: {
    id: number;
    label: string;
    maskedKey: string;
    slotNumber: number;
    totalActiveKeys: number;
  };
  citations: OrthodoxCitation[];
}> {
  const mode: OrthodoxAiMode = params.mode && MODE_LABELS[params.mode] ? params.mode : 'apologetics';
  const cleanMessage = params.message.trim();
  const { promptContext, citations } = await buildOrthodoxContext(cleanMessage);

  const historyTurns = buildGeminiHistoryTurns(params.history, 10);
  const currentUserPrompt = `${cleanMessage}${promptContext}\n\n[وضع الحوار المطلوب: ${MODE_LABELS[mode]}]`;
  const contents: GeminiTurn[] = [
    ...historyTurns,
    { role: 'user', parts: [{ text: currentUserPrompt }] },
  ];

  const result = await executeWithGeminiPool(ORTHODOX_AI_SYSTEM_PROMPT, contents, {
    temperature: 0.45,
    maxOutputTokens: 4096,
    thinkingBudget: 0,
    timeoutMs: 35_000,
  });

  return {
    reply: stripEmojis(result.text),
    model: result.model,
    attempts: result.attempts,
    usedKey: result.usedKey,
    citations,
  };
}

export async function explainBibleVerseWithAi(params: {
  bookSlug: string;
  chapter: number;
  verseNumber: number;
  selectedText?: string;
  followUp?: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
}): Promise<{
  verseRef: string;
  verseText: string;
  reply: string;
  model: string;
  citations: OrthodoxCitation[];
} | null> {
  const context = await buildVerseExplanationContext(
    params.bookSlug,
    params.chapter,
    params.verseNumber,
  );
  if (!context) return null;

  const focusLines = [`اشرح الآية التالية من الكتاب المقدس وفسرها تفسيراً أرثوذكسياً مبسطاً وواضحاً:`];
  focusLines.push(`الشاهد: ${context.verseRef}`);
  focusLines.push(`نص الآية الكامل: «${context.verseText}»`);

  const trimmedSelected = params.selectedText?.trim();
  if (trimmedSelected && trimmedSelected !== context.verseText.trim()) {
    focusLines.push(`الجزء الذي حدده القارئ داخل الآية: «${trimmedSelected}»`);
  }

  const trimmedFollowUp = params.followUp?.trim();
  if (trimmedFollowUp) {
    focusLines.push(`سؤال القارئ المحدد عن هذه الآية: ${trimmedFollowUp}`);
  }

  const prompt = `${focusLines.join('\n')}${context.promptContext}`;
  const historyTurns = buildGeminiHistoryTurns(params.history, 8);
  const contents: GeminiTurn[] = [
    ...historyTurns,
    { role: 'user', parts: [{ text: prompt }] },
  ];

  const result = await executeWithGeminiPool(ORTHODOX_VERSE_EXPLAIN_PROMPT, contents, {
    temperature: 0.4,
    maxOutputTokens: 2048,
    thinkingBudget: 0,
    timeoutMs: 30_000,
  });

  return {
    verseRef: context.verseRef,
    verseText: context.verseText,
    reply: stripEmojis(result.text),
    model: result.model,
    citations: context.citations,
  };
}
