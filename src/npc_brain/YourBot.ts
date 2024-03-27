import { NpcBrain } from "./NpcBrain";
import { LlmContext, UserAction, BotAction } from "../scorcerorpheus/LlmInterfaces";

// this is where most of the per-bot prompt engineering gets to happem
export class YourBot extends NpcBrain {
    getNpcName(): string { // EDIT THIS: This is the name of the npc
        return "Bagkery";
    }
    getGamePrompt(): string { // EDIT THIS: this is the "mission statement" of the npc
        return ("You are a baker. Your bakery is named the Bagkery. You are friendly and helpful. "
            + "You'll happily buy raw materials from players and sell them baked goods, "
            + "in addition to baking recipes for a small fee. "
            + "Don't execute a trade until the user consents to the deal."
        );
    }
    getContext(): LlmContext[] { // this is context about the npc's world (e.g what's in their inventory)
        return [
            {
                name: "your-inventory",
                valueFunction: async (ctx) => {
                    return await ctx.getInventory(undefined,  ["Bread", "Flour", "Wheat", "Firewood", "gp"]); // EDIT THIS: this is what the npc can see of your inventory
                }
            }
        ]
    }
    getUserActions(): UserAction[] { // these are the actions the player can take
        return []; // user speaking and user giving item are already handled by the base class
    }
    getBotActions(): BotAction[] { // these are the actions the npc can take
        return [
            {
                name: "Speak", // keep this here, some other pieces of code expect a Speak action
                description: "Speak to the player",
                parameters: {
                    "message_to_user": "The message you want to say to the player"
                },
                functionToCall: async (ctx, parameters) => {
                    return parameters["message_to_user"];
                }
            },
            {
                name: "Execute trade",
                description: "Execute a trade with the player",
                parameters: {
                    "item-you-give-up": "The item you want to give to the player. Format: Item (e.g. Wheat). Don't pluralize (e.g. Sword, not Swords)",
                    "item-given-count": "The number of items you want to give to the player",
                    "item-you-recieve": "The item you want to receive from the player. Format: Item (e.g. Wheat). Don't pluralize (e.g. Sword, not Swords)",
                    "item-recieved-count": "The number of items you want to receive from the player"
                },
                functionToCall: async (ctx, parameters) => {
                    const tradeResult = await ctx.proposeTrade(
                        ctx.interactingPlayerID,
                        [{
                            item: parameters["item-you-give-up"],
                            quantity: Number(parameters["item-given-count"])
                        }],
                        [{
                            item: parameters["item-you-recieve"],
                            quantity: Number(parameters["item-recieved-count"])
                        }]
                    );
                    if (tradeResult.status === "error") {
                        return `${this.getNpcName()} tried to start a trade, but encountered an error: ${tradeResult.error_message}`;
                    }
                    return `${this.getNpcName()} has conducted a trade, giving ${parameters["given-count"]} ${parameters["item-given"]} and receiving ${parameters["received-count"]} ${parameters["item-received"]}`;
                }
            }
        ]
    }
}