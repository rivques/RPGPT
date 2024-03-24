import { LlmResponse, Message, UserAction } from "./LlmInterfaces";
import { ChatbotInterface } from "../chatbot_interfaces/ChatbotInterface";
import { NpcBrain } from "../npc_brain/NpcBrain";
import { BagContext } from "../bag_interface/BagContext";

export interface ResponseForUser {
    message?: string;
    actions: UserAction[];
}

export class SorcerOrpheus {
    // a translation layer between llm interfaces and the raw llm
    // a significant amount of prompt engineering happens here
    // inspired by https://github.com/hackclub/wizard-orpheus
    private chatbotInterface: ChatbotInterface;
    private brain: NpcBrain;
    private system_prompt: string;
    private messages: Message[] = [];
    private bagContext: BagContext;
    constructor(chatbotInterface: ChatbotInterface, brain: NpcBrain, bagContext: BagContext){
        this.chatbotInterface = chatbotInterface;
        this.bagContext = bagContext;
        this.brain = brain;
        this.system_prompt = 'You are a character in an RPG. Players can interact with you, '
        + 'and you can respond to them. Format your responses in JSON format, according to the following schema '
        + '(use as many actions and parameters as appropriate):\n'
        + '{'
        + '  actionName: parameterObject'
        + '}'
        + 'for example:\n'
        + '{ "Speak": { "message_to_user": "Hello, how are you?" } }\n'
        + 'Only call actions that make sense in context. You must always call at least one action, '
        + ' and you should usually Speak to the player. '
        + "Here's your character:\n"
        + this.brain.getGamePrompt();
    }

    getBrain(): NpcBrain {
        return this.brain;
    }

    async handleUserMessage(userMessage: string): Promise<ResponseForUser> {
        const userJson = this.constructUserJson("Speak", {"user-message": userMessage});
        return await this.handleUserAction(userJson);
    }

    private async handleUserAction(userJson: string) {
        this.messages.push({ role: "user", content: userJson });
        const response = await this.chatbotInterface.prompt(this.system_prompt, this.messages);
        this.messages.push({ role: "assistant", content: JSON.stringify(response) });
        const lastUserMessage = JSON.parse(this.messages[this.messages.length - 2].content);
        this.messages[this.messages.length - 2].content = JSON.stringify({ // simplify user message so we don't send kilotokens of old bot actions
            "user-action": lastUserMessage["user-action"],
            "parameters": lastUserMessage["parameters"],
            "context": lastUserMessage["context"]
        });
        const messageForUser = this.handleBotActionsAndReturnMessage(response);
        const possibleUserActions = this.brain.getUserActions();
        return {
            message: messageForUser,
            actions: possibleUserActions
        };
    }

    handleBotActionsAndReturnMessage(actions: LlmResponse): string | undefined {
        let result;
        for (const actionName in actions) {
            const parameters = actions[actionName];
            if (actionName === "Speak") {
                result = parameters["message_to_user"];
                continue;
            }
            this.brain.getBotActions().find((botAction) => {
                if (botAction.name === actionName) {
                    botAction.functionToCall(this.getBagContext(), parameters);
                    return true;
                }
                return false;
            })
        }
        return result;
    }

    constructUserJson(actionName: string, parameters: {[prompt: string]: string}): string {
        let result: any = {};
        result["user-action"] = actionName;
        result["parameters"] = parameters;
        result["context"] = this.brain.getContext().map((context) => {
            return {
                name: context.name,
                value: context.valueFunction(this.getBagContext())
            }
        });
        result["possible-bot-actions"] = this.brain.getBotActions();
        return JSON.stringify(result);
    }
    getBagContext(): BagContext {
        return this.bagContext;
    }

    async executeUserAction(actionName: string, parameters: { [user_label: string]: string; }) {
        console.log(`Executing user action ${actionName} with parameters ${parameters}`);
        
    }
}