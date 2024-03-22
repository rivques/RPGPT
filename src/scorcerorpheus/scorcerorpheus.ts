import { UserAction } from "./llm_interfaces";
import { ChatbotInterface } from "../chatbot_interfaces/chatbot_interface";
import { NpcBrain } from "../npc_brain/npc_brain";

export interface ResponseForUser {
    message: string;
    actions: UserAction[];
}

export class SorcerOrpheus {
    // a translation layer between llm interfaces and the raw llm
    // a significant amount of prompt engineering happens here
    // inspired by https://github.com/hackclub/wizard-orpheus
    private chatbotInterface: ChatbotInterface;
    private brain: NpcBrain;
    constructor(chatbotInterface: ChatbotInterface, brain: NpcBrain){
        this.chatbotInterface = chatbotInterface;
        this.brain = brain;
    }

    getBrain(): NpcBrain {
        return this.brain;
    }

    async startInteraction(): Promise<ResponseForUser> {
        // pseudocode:
        // initialize the chatbot and get its first message
        // return the message and the user's possible actions
        return {message: "placeholder msg!", actions: [
            {name: "Speak", parameters: [
                {user_label: "Message", prompt: "the thing they said", type: "string"}
            ], howBotShouldHandle: "say, reply, or smth"}
        ]};
    }
}