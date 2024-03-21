class InteractionManager {
    // this is the glue between the LLM, the NPC brain, the user, and Bag
    // it handles:
    // - interaction setup (e.g. configuing the LLM)
    // - converting between Slack and LLM interfaces
    // - user input and passing through the brain to sorcerorpheus
    // - executing sorcerorpheus's actions
    // - semi-graceful error recovery
}