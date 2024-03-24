import { LlmResponse, Message, UserAction } from "./LlmInterfaces";
import { ChatbotInterface } from "../chatbot_interfaces/ChatbotInterface";
import { NpcBrain } from "../npc_brain/NpcBrain";
import { BagContext } from "../bag_interface/BagContext";

export interface ResponseForUser {
    message?: string;
    actions: UserAction[];
}

export class SorcerOrpheus {
    // a translation layer between actions the user takes, the raw llm, and the npc's brain
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
        this.system_prompt = 'You are a character in an RPG. Players can interact with you, ' // this is the prompt that all bots have, it tells the model what's going on
        + 'and you can respond to them. Format your responses in JSON format, according to the following schema ' // tweak it if you have systemic misbehavior
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
        this.messages.push({ role: "user", content: userJson }); // add the user's message to what the LLM will see
        const response = await this.chatbotInterface.prompt(this.system_prompt, this.messages); // send the prompt to the LLM
        this.messages.push({ role: "assistant", content: JSON.stringify(response) }); // add the LLM's response to history
        const lastUserMessage = JSON.parse(this.messages[this.messages.length - 2].content);
        this.messages[this.messages.length - 2].content = JSON.stringify({ // simplify user message so we don't send kilotokens of old bot actions
            "user-action": lastUserMessage["user-action"],
            "parameters": lastUserMessage["parameters"],
            "context": lastUserMessage["context"]
        });
        const messageForUser = this.handleBotActionsAndReturnMessage(response); // actually execute what the bot wants to do
        const possibleUserActions = this.brain.getUserActions(); // figure out what the user can do
        return {
            message: messageForUser,
            actions: possibleUserActions
        };
    }

    handleBotActionsAndReturnMessage(actions: LlmResponse): string | undefined { // execute the bot's whims and return what the bot wants to say
        let result;
        for (const actionName in actions) {
            const parameters = actions[actionName];
            if (actionName === "Speak") { // Speak is a special case
                result = parameters["message_to_user"];
                continue;
            }
            this.brain.getBotActions().find((botAction) => { // search for the action the LLM wants to take
                if (botAction.name === actionName) {
                    botAction.functionToCall(this.getBagContext(), parameters); // and call it
                    return true;
                }
                return false;
            })
        }
        return result;
    }

    constructUserJson(actionName: string, parameters: {[prompt: string]: string}): string {
        let result: any = {}; // go from a user's action to json ready to feed to the model
        result["user-action"] = actionName;
        result["parameters"] = parameters;
        result["context"] = this.brain.getContext().map((context) => { // retreive context of the world
            return {
                name: context.name,
                value: context.valueFunction(this.getBagContext())
            }
        });
        result["possible-bot-actions"] = this.brain.getBotActions(); // tell the bot what it can do
        return JSON.stringify(result);
    }
    getBagContext(): BagContext {
        return this.bagContext;
    }

    async handleUserActionButton(actionName: string, parameters: { [user_label: string]: string; }) {
        console.log(`Executing user action ${actionName} with parameters ${parameters}`);
        const userJson = this.constructUserJson(actionName, parameters);
        return await this.handleUserAction(userJson);
    }
}