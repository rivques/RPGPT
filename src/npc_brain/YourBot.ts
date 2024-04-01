import { NpcBrain } from "./NpcBrain";
import { LlmContext, UserAction, BotAction } from "../scorcerorpheus/LlmInterfaces";

// this is where most of the per-bot prompt engineering gets to happem
export class YourBot extends NpcBrain {
    getNpcName(): string { // EDIT THIS: This is the name of the npc
        return "Nameless";
    }
    getGamePrompt(): string { // EDIT THIS: this is the "mission statement" of the npc
        return ("You are an NPC in an RPG. Your creator should add more info about you here. "
            + "(to keep the prompt readable you can create multiple lines like this.)"
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
        return []; // user speaking and user giving item are already handled by the base class. you probably don't need to change this.
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
            // Below this is the code for trading. If your bot doesn't trade, keep this commented out.
            // It can be quite confusing to the LLM, and some more prompt engineering is probably needed.
            // {
            //     name: "Execute trade",
            //     description: "Execute a trade with the player",
            //     parameters: {
            //         "item-you-give-up": "The item you want to give to the player. Format: Item (e.g. Wheat). Don't pluralize (e.g. Sword, not Swords)",
            //         "item-given-count": "The number of items you want to give to the player",
            //         "item-you-receive": "The item you want to receive from the player. Format: Item (e.g. Wheat). Don't pluralize (e.g. Sword, not Swords)",
            //         "item-received-count": "The number of items you want to receive from the player"
            //     },
            //     functionToCall: async (ctx, parameters) => {
            //         const tradeResult = await ctx.proposeTrade(
            //             ctx.interactingPlayerID,
            //             [{
            //                 item: parameters["item-you-give-up"],
            //                 quantity: Number(parameters["item-given-count"])
            //             }],
            //             [{
            //                 item: parameters["item-you-receive"],
            //                 quantity: Number(parameters["item-received-count"])
            //             }]
            //         );
            //         if (tradeResult.status === "error") {
            //             return `${this.getNpcName()} tried to start a trade, but encountered an error: ${tradeResult.error_message}`;
            //         }
            //         return `${this.getNpcName()} has conducted a trade, giving ${parameters["item-given-count"]} ${parameters["item-you-give-up"]} and receiving ${parameters["item-received-count"]} ${parameters["item-you-receive"]}`;
            //     }
            // }
            {   // if you have trading enabled you may want to disable this so the LLM doesn't get confused
                name: "Give item",
                description: "Give the player an item",
                parameters: {
                    "item-to-give": "The item you want to give to the player",
                    "quantity": "how many of that item you want to give"
                },
                functionToCall: async (ctx, parameters) => {
                    const giveResult = await ctx.giveItem({item: parameters["item-to-give"], quantity: parseInt(parameters["quantity"])});
                    if (giveResult.status === "error") {
                        return `${this.getNpcName()} tried to give an item, but encountered an error: ${giveResult.error_message}`;
                    }
                    return `${this.getNpcName()} has given you ${parameters["quantity"]} ${parameters["item-to-give"]}!`;
                }
            }
        ]
    }
}