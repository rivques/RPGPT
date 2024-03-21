class Bagkery extends NpcBrain {
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
                parameters: ["The user's message to you"],
                howBotShouldHandle: "You should respond to the user's message. Bargain with them."
            },
            {
                name: "Give item",
                parameters: ["The item you've been given"],
                howBotShouldHandle: "If the item is related to the user's request, accept it, " 
                + "and do something with it if appropriate. Otherwise, refuse it confusedly."
            },
            {
                name: "Unknown item",
                parameters: ["The item that doesn't exist"],
                howBotShouldHandle: "You tried to craft or give an item that doesn't exist. " 
                + "Either try again with a valid item, or continue with the story."
            },
            {
                name: "Unposessed item",
                parameters: ["The items that you don't have"],
                howBotShouldHandle: "You tried to craft or give an item that you don't have. " 
                + "Either try again with a valid item, or continue with the story. " 
                + "If you're trying to craft with an ingredient the player hasn't given you, " 
                + "ask if they have any of the item."
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