import { LLMSettingsAnthropic } from "../npc_brain/InteractionManagerSettings";
import { Message, LlmResponse } from "../scorcerorpheus/LlmInterfaces";
import { ChatbotInterface } from "./ChatbotInterface";
import Anthropic from "@anthropic-ai/sdk";

export class AnthropicInterface extends ChatbotInterface {
    anthropic: Anthropic
    settings: LLMSettingsAnthropic
    constructor(settings: LLMSettingsAnthropic) {
        super();
        this.settings = settings
        this.anthropic = new Anthropic({ apiKey: settings.llmAPIKey })
    }
    async prompt(system: string, messages: Message[]): Promise<LlmResponse> {
        messages.push({ role: "assistant", content: "{\"" }); // prefill the start of json
        console.debug(`Prompting Anthropic with: system: ${system}\nmessages: ${messages}`)
        const response = await this.anthropic.messages.create({
            model: this.settings.model,
            max_tokens: this.settings.maxResponseTokens,
            messages,
            system,
            temperature: 0.3
        })
        if (response.stop_reason == "max_tokens") {
            console.warn("AnthropicInterface: max tokens reached")
        }
        // now, translate response.content to LlmResponse
        // response.content's concatenated text values should be a JSON string parseable into an LLMResponse
        let concatenatedText = "{\"" // this api can return multiple blocks, we should put them together
        for (const message of response.content) {
            concatenatedText += message.text
            concatenatedText += " "
        }
        console.debug(`Claude response (${response.content.length} blocks): ${concatenatedText}`)
        console.debug(`Tokens used: input: ${response.usage.input_tokens}, output: ${response.usage.output_tokens}`)
        // now, parse concatenatedText into an LlmResponse
        try {
            const llmResponse: LlmResponse = JSON.parse(concatenatedText)
            return llmResponse
        } catch (e) {
            console.error("AnthropicInterface: error parsing Anthropic response into LlmResponse")
            console.error(e)
            return { "Speak": { "message_to_user": "Error parsing Anthropic response into LlmResponse. Raw response: " + JSON.stringify(response) } }
        }
    }
}