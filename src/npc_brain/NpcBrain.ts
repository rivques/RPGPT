import { BagContext } from "../bag_interface/BagContext";
import { LlmContext, UserAction, BotAction } from "../scorcerorpheus/LlmInterfaces";

export abstract class NpcBrain {
	// these are functions instead of properties so that they can
	// ...change over the course of an interaction
	constructor() {};
	abstract getNpcName(): string;
	abstract getGamePrompt(): string;
	abstract getContext(): LlmContext[];
	abstract getUserActions(): UserAction[];
	abstract getBotActions(): BotAction[];
	abstract canBeInterrupted(): boolean;
}