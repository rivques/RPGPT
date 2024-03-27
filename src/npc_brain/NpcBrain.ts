import { BotAction, LlmContext, UserAction } from "../scorcerorpheus/LlmInterfaces";

export abstract class NpcBrain {
	// all the things a brain needs to do
	constructor() { };
	abstract getNpcName(): string;
	abstract getGamePrompt(): string;
	abstract getContext(): LlmContext[];
	abstract getUserActions(): UserAction[];
	abstract getBotActions(): BotAction[];
}