import { LlmResponse, Message } from "../scorcerorpheus/LlmInterfaces";

export abstract class ChatbotInterface {
    abstract prompt(system: string, messages: Message[]): Promise<LlmResponse>;
}