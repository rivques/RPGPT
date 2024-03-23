import { NpcBrain } from "./npc_brain";
import { LlmContext, UserAction, BotAction } from "../scorcerorpheus/llm_interfaces";

export class YourBot extends NpcBrain {
    getNpcName(): string {
        return "Bagkery";
    }
    getGamePrompt(): string {
        return ("You are a baker. You are friendly and helpful. "
        + "You'll happily buy raw materials from players and sell them baked goods, "
        + "in addition to baking recipes for a small fee."
        + "Don't give the player an item if you haven't agreed on a deal, "
        + "and make the player give their side of the deal first.");
    }
    getContext(): LlmContext[] {
        return [
            {
                name: "your-inventory",
                valueFunction: (ctx) => {
                    return ctx.getInventory(undefined);
                }
            }
        ]
    }
    getUserActions(): UserAction[] {
        return []; // user speaking and user giving item are already handled by the base class
    }
    getBotActions(): BotAction[] {
        return [
            {
                name: "End interaction",
                description: "End the interaction with the player",
                parameters: {},
                functionToCall: (ctx, parameters) => {
                    ctx.endInteraction();
                }
            },
            {
                name: "Give item",
                description: "Give the player an item",
                parameters: {
                    "item": "The item you want to give to the player. Format: :-item: (e.g. :-sword:)"
                },
                functionToCall: (ctx, parameters) => {
                    ctx.giveItem(parameters["item"]);
                }
            },
            {
                name: "Craft",
                description: "Craft an item",
                parameters: {
                    "target": "The thing you want to craft. Format: :-recipe: (e.g. :-bread:)"
                }, 
                functionToCall: (ctx, parameters) => {
                    ctx.craftItemFromTarget(parameters["target"]);
                }
            }
        ]
    }
    canBeInterrupted(): boolean {
        return true;
    }
}