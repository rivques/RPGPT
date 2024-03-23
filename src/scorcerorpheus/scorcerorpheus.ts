import { Message, UserAction } from "./llm_interfaces";
import { ChatbotInterface } from "../chatbot_interfaces/chatbot_interface";
import { NpcBrain } from "../npc_brain/npc_brain";
import { BagContext } from "../bag_interface/bag-context";

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
    private system_prompt: string;
    private messages: Message[] = [];
    constructor(chatbotInterface: ChatbotInterface, brain: NpcBrain){
        this.chatbotInterface = chatbotInterface;
        this.brain = brain;
        this.system_prompt = 'You are a character in an RPG. Players can interact with you, '
        + 'and you can respond to them. Format your responses in JSON format, according to the following schema '
        + '(use as many actions and parameters as appropriate):\n'
        + '{'
        + 'message: string;'
        + 'actions: {[actionName: string]: {[parameterName: string]: string}}'
        + '}'
        + 'Only call actions that make sense in context. It\'s okay not to call an action and just respond to the user.'
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
        this.messages.pop();
        this.messages.push({ role: "assistant", content: response.message });
        this.handleBotActions(response.actions);
        const possibleUserActions = this.brain.getUserActions();
        return {
            actions: possibleUserActions,
            message: response.message
        };
    }

    handleBotActions(actions: { [actionName: string]: { [parameterName: string]: string; }; }) {
        for (const actionName in actions) {
            const parameters = actions[actionName];
            this.brain.getBotActions().find((botAction) => {
                if (botAction.name === actionName) {
                    botAction.functionToCall(this.getBagContext(), parameters);
                    return true;
                }
                return false;
            })
        }
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
        return new BagContext();
    }

    async executeUserAction(actionName: string, parameters: { [user_label: string]: string; }) {
        console.log(`Executing user action ${actionName} with parameters ${parameters}`);
        
    }
}