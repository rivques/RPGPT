import { LlmResponse, Message } from "../scorcerorpheus/llm_interfaces"
import { ChatbotInterface } from "./chatbot_interface"

export class DummyLLMInterface extends ChatbotInterface {
    async prompt(system: string, messages: Message[]): Promise<LlmResponse> {
        console.log("Prompting DummyLLMInterface with:")
        console.log(system)
        console.log(messages)
        return { "Speak": { "message_to_user": "Hello, how are you? - Dummy Interface" } }
    }
}