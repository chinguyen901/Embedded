export const hasAiKey = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

export const STAGE1_MODEL = process.env.STAGE1_MODEL || "gemini-2.5-flash";
export const STAGE2_MODEL = process.env.STAGE2_MODEL || "gemini-2.5-flash";
export const STAGE3_MODEL = process.env.STAGE3_MODEL || "gemini-2.5-flash";
