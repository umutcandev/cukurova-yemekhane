export const COMMENT_EMOJIS = [
    { key: "heart", label: "Kalp", native: "❤️" },
    { key: "thumbs_up", label: "Beğeni", native: "👍" },
    { key: "fire", label: "Alev", native: "🔥" },
    { key: "clapping", label: "Alkış", native: "👏" },
    { key: "party", label: "Parti", native: "🥳" },
    { key: "hundred", label: "Yüz", native: "💯" },
    { key: "star_struck", label: "Hayran", native: "🤩" },
    { key: "pray", label: "Teşekkür", native: "🙏" },
] as const;

export type EmojiKey = (typeof COMMENT_EMOJIS)[number]["key"];

export const VALID_EMOJI_KEYS = new Set<string>(COMMENT_EMOJIS.map((e) => e.key));

export function getEmojiNative(key: string): string {
    return COMMENT_EMOJIS.find((e) => e.key === key)?.native ?? key;
}
