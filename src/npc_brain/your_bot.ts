import { NpcBrain } from "./npc_brain";
import { LlmContext, UserAction, BotAction } from "../scorcerorpheus/llm_interfaces";

export class YourBot extends NpcBrain {
    getNpcName(): string {
        return "Bagkery";
    }
    getGamePrompt(): string {
        return ("You are a baker. You are friendly and helpful. "
        + "You'll happily buy raw materials from players and sell them baked goods, "
        + "in addition to baking recipes for a small fee. "
        + "Don't give the player an item if you haven't agreed on a deal, "
        + "and make the player give their side of the deal first.");
    }
    getContext(): LlmContext[] {
        return [
            {
                name: "your-inventory",
                valueFunction: async (ctx) => {
                    return await ctx.getInventory(undefined);
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
                name: "Speak",
                description: "Speak to the player",
                parameters: {
                    "message_to_user": "The message you want to say to the player"
                },
                functionToCall: async (ctx, parameters) => {
                    // handeled elsewhere
                }
            },
            {
                name: "End interaction",
                description: "End the interaction with the player",
                parameters: {},
                functionToCall: async (ctx, parameters) => {
                    // do nothing
                }
            },
            {
                name: "Initiate trade",
                description: "Offer the player a trade",
                parameters: {
                    "item-given": "The item you want to give to the player. Format: :-item: (e.g. :-sword:)",
                    "given-count": "The number of items you want to give to the player",
                    "item-received": "The item you want to receive from the player. Format: :-item: (e.g. :-bread:)",
                    "received-count": "The number of items you want to receive from the player"
                },
                functionToCall: async (ctx, parameters) => {
                    await ctx.proposeTrade(
                        ctx.playerID,
                        [{
                            item: parameters["item-given"],
                            quantity: Number(parameters["given-count"])
                        }],
                        [{
                            item: parameters["item-received"],
                            quantity: Number(parameters["received-count"])
                        }]
                    );
                }
            },
            {
                name: "Craft",
                description: "Craft an item",
                parameters: {
                    "target": "The thing you want to craft. Format: :-recipe: (e.g. :-bread:)"
                }, 
                functionToCall: async (ctx, parameters) => {
                    ctx.craftItemFromTarget(parameters["target"]);
                }
            }
        ]
    }
    canBeInterrupted(): boolean {
        return true;
    }
}