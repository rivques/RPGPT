import { ChatCompletionMessageParam, ChatCompletionSystemMessageParam } from "openai/resources";
import { Message, LlmResponse } from "../scorcerorpheus/LlmInterfaces";
import { ChatbotInterface } from "./ChatbotInterface";
import OpenAI from "openai";
import { LLMSettingsOpenAI as LLMSettingsOpenAIProxy } from "../npc_brain/InteractionManagerSettings";

export class OpenAIHackClubProxy extends ChatbotInterface {
    openai: OpenAI;
    settings: LLMSettingsOpenAIProxy;
    constructor(settings: LLMSettingsOpenAIProxy) {
        super();
        this.settings = settings;
        this.openai = new OpenAI({ apiKey: this.settings.llmAPIKey, baseURL: "http://jamsapi.hackclub.dev/openai/" }); // see #open-ai-token
    }
    async prompt(system: string, messages: Message[]): Promise<LlmResponse> {
        console.debug(`Prompting OpenAI with:`)
        const openaimessages: ChatCompletionMessageParam[] = [{ role: "system", content: system }] // for openai, the system message is part of the messages parameter
        for (const message of messages) {
            openaimessages.push({ role: message.role, content: message.content }) // convert from our Message to OpenAI's ChatCompletionMessageParam
        }
        console.debug(openaimessages);
        const responses = await this.openai.chat.completions.create({ // send the prompt to OpenAI
            model: this.settings.model,
            max_tokens: this.settings.maxResponseTokens,
            messages: openaimessages,
            response_format: { "type": "json_object" }
        })
        console.debug(`OpenAI response:`)
        console.debug(responses)
        console.debug(`Tokens used: input: ${responses.usage?.prompt_tokens}, output: ${responses.usage?.completion_tokens}`)
        // turn response into LlmResponse
        const response = responses.choices[0];
        if (response.finish_reason == "length") {
            console.warn("OpenAIHackClubProxy: max tokens reached")
        }
        if (response.message.content == undefined) {
            console.error("OpenAIHackClubProxy: error parsing OpenAI response into LlmResponse")
            return { "Speak": { "message_to_user": "Error parsing OpenAI response into LlmResponse. Raw response: " + JSON.stringify(response) } }

        }
        console.debug(`Message: ${response.message.content}`)
        try {
            const llmResponse: LlmResponse = JSON.parse(response.message.content)
            return llmResponse
        } catch (e) {
            console.error("OpenAIHackClubProxy: error parsing gpt response into LlmResponse")
            console.error(e)
            return { "Speak": { "message_to_user": "Error parsing gpt response into LlmResponse. Raw response: " + JSON.stringify(response) } }
        }
    }
}