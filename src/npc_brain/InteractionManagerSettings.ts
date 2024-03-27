export interface InteractionManagerSettings {
    slackBotToken: string;
    slackSigningSecret: string;
    slackAppPort: number;
    interactionChannels: string;
    bagAppID: number;
    bagAppKey: string;
    bagOwnerID: string;
    llmSettings: LLMSettings;
    httpsSettings?: HTTPSSettings;
}
export interface HTTPSSettings {
    keyPath: string;
    certPath: string;
}
interface LLMSettingsBase { // this bit of TS fun allows different LLMs to have different settings while maintaining type safety
    maxResponseTokens: number;
}
export interface LLMSettingsAnthropic extends LLMSettingsBase {
    llmAPIKey: string;
    model: string;
    provider: "anthropic";
}
export interface LLMSettingsOpenAI extends LLMSettingsBase {
    llmAPIKey: string;
    model: string;
    provider: "openai-proxy";
}
export interface LLMSettingsDummy extends LLMSettingsBase {
    provider: "dummy";
}
export type LLMSettings = LLMSettingsAnthropic | LLMSettingsOpenAI | LLMSettingsDummy;
