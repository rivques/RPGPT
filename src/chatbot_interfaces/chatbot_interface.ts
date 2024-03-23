import { LlmResponse, Message } from "../scorcerorpheus/llm_interfaces";

export abstract class ChatbotInterface {
    abstract prompt(system: string, messages: Message[]): Promise<LlmResponse>;
}