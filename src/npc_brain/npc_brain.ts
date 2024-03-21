abstract class NpcBrain {
	// these are functions instead of properties so that they can
	// ...change over the course of an interaction
	abstract getNpcName(): string;
	abstract getGamePrompt(): string;
	abstract getVariables(): LlmVariable<any>[]; // not sure if there's a better way to TSify this
	abstract getContext(): LlmContext[];
	abstract getUserActions(): UserAction[];
	abstract getBotActions(): BotAction[];
	abstract canBeInterrupted(): boolean;
}