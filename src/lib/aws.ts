/**
 * AWS integration placeholders for future Amplify + Bedrock wiring.
 */
export function getAmplifyConfig() {
  if (!process.env.AWS_REGION || !process.env.AMPLIFY_ENV) {
    console.warn(
      "[AWS] Missing AWS_REGION or AMPLIFY_ENV – Amplify client not initialised.",
    );
    return null;
  }

  return {
    region: process.env.AWS_REGION,
    environment: process.env.AMPLIFY_ENV,
  };
}

export async function sendBedrockCoachPrompt(payload: {
  prompt: string;
  matchId: string;
}) {
  void payload;
  /**
   * TODO: Replace with AWS SDK v3 `BedrockRuntimeClient`.
   * Use process.env.BEDROCK_MODEL_ID for the target model.
   * Optionally proxy via AWS Lambda to keep API keys server-side.
   */
  throw new Error("Bedrock integration not implemented.");
}
