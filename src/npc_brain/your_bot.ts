import { NpcBrain } from "./npc_brain";
import { LlmContext, LlmVariable, UserAction, BotAction } from "../scorcerorpheus/llm_interfaces";

export class YourBot extends NpcBrain {
    getNpcName(): string {
        return "Bagkery";
    }
    getGamePrompt(): string {
        return ("You are a baker. You are friendly and helpful. "
        + "You'll happily buy raw materials from players and sell them baked goods, "
        + "in addition to baking recipes for a small fee.");
    }
    getContext(): LlmContext[] {
        return [
            {
                name: "Inventory",
                prompt: "Your inventory",
                valueFunction: (ctx) => {
                    return ctx.getInventory(undefined);
                }
            }
        ]
    }
    getVariables(): LlmVariable<any>[] {
        return []
    }
    getUserActions(): UserAction[] {
        return [
            {
                name: "Speak",
                parameters: [{
                    user_label: "Message",
                    prompt: "The user's message to you",
                    type: "string"
                }],
                howBotShouldHandle: "You should respond to the user's message. Bargain with them."
            },
            {
                name: "Give item",
                parameters: [{
                    prompt: "The item you've been given",
                    user_label: "Item to give",
                    type: "inventory_item_stack"
                }],
                howBotShouldHandle: "If the item is related to the user's request, accept it, " 
                + "and do something with it if appropriate. Otherwise, refuse it confusedly."
            }
        ];
    }
    getBotActions(): BotAction[] {
        return [
            {
                name: "Speak",
                description: "Say something to the player",
                parameters: {
                    "message": "The message you want to say to the player"
                },
                functionToCall: (ctx, parameters, variables) => {
                    ctx.say(parameters["message"]);
                }
            },
            {
                name: "Give item",
                description: "Give the player an item",
                parameters: {
                    "item": "The item you want to give to the player. Format: :-item: (e.g. :-sword:)"
                },
                functionToCall: (ctx, parameters, variables) => {
                    ctx.giveItem(parameters["item"]);
                }
            },
            {
                name: "Craft",
                description: "Craft an item",
                parameters: {
                    "target": "The thing you want to craft. Format: :-recipe: (e.g. :-bread:)"
                }, 
                functionToCall: (ctx, parameters, variables) => {
                    ctx.craftItemFromTarget(parameters["target"]);
                }
            }
        ]
    }
    canBeInterrupted(): boolean {
        return true;
    }
}