export interface InteractionManagerSettings {
    slackBotToken: string;
    slackSigningSecret: string;
    slackAppPort: number;
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
interface LLMSettingsBase {
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
