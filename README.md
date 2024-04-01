# RPGPT
This is a framework for interfacing LLMs with Bag, the RPG in the Hack Club Slack. See [TUTORIAL.md](/TUTORIAL.md) for a howto.

## supported LLM providers
* Openai proxied through Hack Club's gateway
* Anthropic

## codebase structure
### bag_interface
This handles interacting with the Bag app.
### chatbot_interfaces
These are the various LLM providers. They should be fairly easily extensible.
### npc_brain
This is where most of the "personality" of the npc lives, plus the `InteractionManager`, which is the main coordinator of the whole thing.
### sorcerorpheus
Inspired by [wizard-orpheus](https://github.com/hackclub/wizard-orpheus), this is what turns the LLM's output into real-world actions and vice versa.