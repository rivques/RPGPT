import { Message, LlmResponse } from "../scorcerorpheus/llm_interfaces";
import { ChatbotInterface } from "./chatbot_interface";
import Anthropic from "@anthropic-ai/sdk";

export class AnthropicInterface extends ChatbotInterface {
    anthropic: Anthropic
    constructor(anthropicKey: string) {
        super();
        this.anthropic = new Anthropic({ apiKey: anthropicKey })
    }
    async prompt(system: string, messages: Message[]): Promise<LlmResponse> {
        messages.push({ role: "assistant", content: "{\"" }); // prefill the start of json
        console.debug(`Prompting Claude 3 Haiku with: system: ${system}\nmessages: ${messages}`)
        const response = await this.anthropic.messages.create({
            model: "claude-3-sonnet-20240229", //"claude-3-haiku-20240307",
            max_tokens: 512,
            messages,
            system,
            temperature: 0.3
        })
        if (response.stop_reason == "max_tokens") {
            console.warn("AnthropicInterface: max tokens reached")
        }
        // now, translate response.content to LlmResponse
        // response.content's concatenated text values should be a JSON string parseable into an LLMResponse
        // first, concatenate response.content[].text
        let concatenatedText = "{\""
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
            return {"Speak": {"message_to_user": "Error parsing Anthropic response into LlmResponse. Raw response: " + JSON.stringify(response)}}
        }
    }
}