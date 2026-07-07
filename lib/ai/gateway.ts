export const hasGatewayKey = Boolean(process.env.AI_GATEWAY_API_KEY);

export const STAGE1_MODEL = process.env.STAGE1_MODEL || "perplexity/sonar-pro";
export const STAGE2_MODEL = process.env.STAGE2_MODEL || "openai/gpt-4o-mini";
export const STAGE3_MODEL = process.env.STAGE2_MODEL || "openai/gpt-4o-mini";
