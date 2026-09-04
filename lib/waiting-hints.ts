// Playful, rotating "waiting for the model" lines shown while the agent is
// thinking but has not started streaming yet. Kept deliberately short and
// characterful (Claude-style); every rotation picks a random line and avoids
// repeating the one that was just shown.

export type WaitingHintsLocale = "en" | "zh-CN" | "zh-TW";

const WAITING_HINTS: Record<WaitingHintsLocale, string[]> = {
  "zh-CN": [
    "正在组织语言,别急,好东西值得等 🍵",
    "在内心偷偷检查了三遍拼写 ✍️",
    "正在把 0 和 1 排列成句子…",
    "大脑正在全速运转,转完这圈就回来",
    "正在翻找最合适的那个说法",
    "别走开,下一句就是重点",
    "正在排练开场白 🎬",
    "想好了开头,正在想结尾",
    "处理中…顺便帮你把思路捋直",
    "正在认真考虑你的问题,包括那些绕弯的想法",
  ],
  "zh-TW": [
    "正在組織語言,別急,好東西值得等 🍵",
    "在內心偷偷檢查了三遍拼寫 ✍️",
    "正在把 0 和 1 排列成句子…",
    "大腦正在全速運轉,轉完這圈就回來",
    "正在翻找最合適的說法",
    "別走開,下一句就是重點",
    "正在排練開場白 🎬",
    "想好了開頭,正在想結尾",
    "處理中…順便幫你把思路理直",
    "正在認真考慮你的問題,包括那些繞彎的想法",
  ],
  en: [
    "Thinking… this is the fun part.",
    "Arranging words into a sentence, one moment.",
    "Holding a tiny internal debate before answering.",
    "Spinning up the ol' neural gears…",
    "Double-checking my phrasing — always do.",
    "Pausing dramatically…",
    "Almost there — the good part comes next.",
    "Considering all the options, including the fun ones.",
    "Writing the next sentence in my head first.",
    "Thinking in circles so you don't have to.",
  ],
};

const FALLBACK_LOCALE: WaitingHintsLocale = "en";

export function isWaitingHintsLocale(value: string): value is WaitingHintsLocale {
  return value === "en" || value === "zh-CN" || value === "zh-TW";
}

/** Hints for a locale id; unknown ids fall back to English. */
export function getWaitingHints(locale: string): string[] {
  return WAITING_HINTS[isWaitingHintsLocale(locale) ? locale : FALLBACK_LOCALE];
}

/** Random pick; when `exclude` is given, never return it (single-hint list exempt). */
export function pickWaitingHint(hints: readonly string[], exclude?: string): string {
  if (hints.length === 0) return "";
  if (hints.length === 1) return hints[0];
  let index = Math.floor(Math.random() * hints.length);
  if (exclude !== undefined && hints[index] === exclude) {
    index = (index + 1) % hints.length;
  }
  return hints[index];
}
