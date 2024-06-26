import { BagContext } from "../bag_interface/BagContext";

export interface UserAction { // an action the user can take
	name: string;
	parameters: { user_label: string, prompt: string, type: "string" | "inventory_item_stack" | "bool" | "int" | "float" }[];
	howBotShouldHandle: string;
}

export interface LlmContext { // like a variable, but the model can't modify it. example use: inventory
	name: string;
	valueFunction: (ctx: BagContext) => Promise<any>; // called before every prompt to the LLM
}

export interface BotAction { // an action the NPC can take
	name: string;
	description: string;
	parameters: { [parameterName: string]: string } // value is description of parameter
	functionToCall: (ctx: BagContext, parameters: { [parameterName: string]: string }) => Promise<string>;
	// that's the function that gets called when the LLM chooses this action
	// as context it gets a BagContext for interacting with Bag and the user,
	// the llm-filled-out parameters, and the variables (which may have been changed by the llm)
}

export interface Message {
	role: "user" | "assistant";
	content: string;
}

export type LlmResponse = { 
	result: { [actionName: string]: { [parameterName: string]: string } }, 
	tokens: { in: number, out: number } 
};
