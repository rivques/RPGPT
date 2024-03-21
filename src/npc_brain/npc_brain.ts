import { LlmContext, LlmVariable, UserAction, BotAction } from "../scorcerorpheus/llm_interfaces";

export abstract class NpcBrain {
	// these are functions instead of properties so that they can
	// ...change over the course of an interaction
	constructor() {};
	abstract getNpcName(): string;
	abstract getGamePrompt(): string;
	abstract getVariables(): LlmVariable<any>[]; // not sure if there's a better way to TSify this
	abstract getContext(): LlmContext[];
	abstract getUserActions(): UserAction[];
	abstract getBotActions(): BotAction[];
	abstract canBeInterrupted(): boolean;
}