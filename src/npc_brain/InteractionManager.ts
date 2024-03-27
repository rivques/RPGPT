import { App as BagApp } from "@hackclub/bag";
import { AckFn, AppMentionEvent, BlockAction, ButtonAction, GenericMessageEvent, MessageEvent, RespondArguments, RespondFn, App as SlackApp, SlackViewAction, SlashCommand, ViewOutput } from "@slack/bolt";
import fs from "fs";
import { BagContext } from "../bag_interface/BagContext";
import { AnthropicInterface } from "../chatbot_interfaces/AnthropicInterface";
import { ChatbotInterface } from "../chatbot_interfaces/ChatbotInterface";
import { DummyLLMInterface } from "../chatbot_interfaces/DummyLLMInterface";
import { OpenAIHackClubProxy } from "../chatbot_interfaces/OpenAIHackClubProxy";
import { ResponseForUser, SorcerOrpheus } from "../scorcerorpheus/SorcerOrpheus";
import { InteractionManagerSettings, LLMSettingsAnthropic, LLMSettingsOpenAI } from "./InteractionManagerSettings";
import { YourBot } from "./YourBot";
interface Interaction { // one thread with one player
    sorcerorpheus: SorcerOrpheus;
    threadInfo: ThreadInfo;
    userID: string;
}

interface ThreadInfo {
    channelID: string;
    ts: string;
}

export class InteractionManager {
    // this is the glue between the Sorcerorpheus (itself a glue between the chatbot interface and the NPC) and the SlackApp
    // it's also the main entry point for the app

    slackApp: SlackApp;
    chatbotInterface: ChatbotInterface;
    bagApp: BagApp;
    slackAppBotId: string;

    currentInteractions: Interaction[] = [];
    settings: InteractionManagerSettings;

    private constructor(settings: InteractionManagerSettings, slackApp: SlackApp, chatbotInterface: ChatbotInterface, bagApp: BagApp, slackAppBotId: string) {
        this.settings = settings;
        this.slackApp = slackApp;
        this.chatbotInterface = chatbotInterface;
        this.bagApp = bagApp;
        this.slackAppBotId = slackAppBotId;
        const interactionChannels = settings.interactionChannels.split(",");
        console.log(`interaction channels: ${interactionChannels}`);
        for (const channelID of interactionChannels) { // join all the interaction channels
            this.slackApp.client.conversations.join({
                token: settings.slackBotToken,
                channel: channelID
            });
            console.info(`joined channel ${channelID}`);
        }
        // leave all channels except the interaction channels
        this.slackApp.client.users.conversations({
            token: this.settings.slackBotToken
        }).then((response) => {
            if (response.channels === undefined) {
                throw new Error("response.channels is undefined");
            }
            for (const channel of response.channels) {
                if (channel.id !== undefined && !interactionChannels.includes(channel.id)) {
                    this.slackApp.client.conversations.leave({
                        token: this.settings.slackBotToken,
                        channel: channel.id
                    });
                    console.info(`left channel ${channel.id}`);
                }
            }
        });

        slackApp.action(new RegExp(".*"), async ({ ack, body, respond, action, payload }) => {
            await ack();
            const blockAction = (body as BlockAction)
            if (blockAction.actions[0].type !== "button") {
                throw new Error("unsupported action type: " + blockAction.actions[0].type);
            }
            await this.handleActionButtonPressed(blockAction as BlockAction<ButtonAction>);
        })
        // view submissions (for non-speak non-give user actions)
        slackApp.view('user_input', async ({ ack, body, view }) => {
            await ack();
            console.log("got view submission");
            console.log(body);
            console.log(view.state.values);
            await this.handleViewSubmission(body, view);
        });
        // messages, for when the user talks to the NPC
        slackApp.event("message", async ({ event, body }) => {
            console.log("got message event");
            console.log(event);
            const mre: any = event as any; // leave the land of safety because i don't understand bolt's event types
            if (mre.thread_ts === undefined) {
                // not in a thread
                // so, see if we're being pinged
                if (mre.text === undefined) {
                    return;
                }
                if (mre.text.includes(`<@${this.slackAppBotId}>`)) {
                    // we are being pinged
                    console.log("we are being pinged app id: " + this.slackAppBotId);
                    await this.handleStartInteractionCommand(event as GenericMessageEvent);
                }
            
                return
            }
            const interaction = this.currentInteractions.find((interaction) => {
                return interaction.threadInfo.channelID === mre.channel && interaction.threadInfo.ts === mre.thread_ts;
            });
            if (interaction === undefined) {
                return;
            }
            if (interaction.userID !== mre.user) {
                this.slackApp.client.chat.postEphemeral({
                    token: this.settings.slackBotToken,
                    channel: mre.channel,
                    user: mre.user,
                    text: `Hey! You're not <@${interaction.userID}>! Go start your own interaction!`
                });
                return;
            }
            const message = mre.text;
            console.log(`got message ${message} from ${mre.user}`);
            //
            const response = await interaction.sorcerorpheus.handleUserMessage(message); // this is where the bulk of the magic happens
            this.postResponseToSlack(response, interaction.threadInfo);
        });
    }

    public static async create(settings: InteractionManagerSettings): Promise<InteractionManager> { // work around no async allowed in constructors
        let chatbotInterface: ChatbotInterface;
        switch (settings.llmSettings.provider) {
            case "anthropic":
                chatbotInterface = new AnthropicInterface(settings.llmSettings as LLMSettingsAnthropic);
                break;
            case "openai-proxy":
                chatbotInterface = new OpenAIHackClubProxy(settings.llmSettings as LLMSettingsOpenAI);
                break;
            case "dummy":
                chatbotInterface = new DummyLLMInterface();
                break;
        }
        const bagApp = await BagApp.connect({
            appId: settings.bagAppID,
            key: settings.bagAppKey
        })
        const slackApp = new SlackApp({
            token: settings.slackBotToken,
            signingSecret: settings.slackSigningSecret
        });
        const slackAppBotId = (await slackApp.client.auth.test()).user_id;
        if (slackAppBotId === undefined) {
            throw new Error(`slackAppBotId is undefined. auth response: ${await slackApp.client.auth.test()}`);
        }
        return new InteractionManager(settings, slackApp, chatbotInterface, bagApp, slackAppBotId);
    }

    async handleViewSubmission(body: SlackViewAction, view: ViewOutput) {
        // find the interaction that this view submission corresponds to
        // then find the action that corresponds to the view submission
        // and execute it via sorcerorpheus

        const interaction = this.currentInteractions.find((interaction) => {
            return interaction.userID === body.user.id;
        });
        if (interaction === undefined) {
            throw new Error("interaction not found");
        }
        const actionName = view.title.text;
        // parameters is a map from user_label to value
        let parameters: { [user_label: string]: string } = {};
        for (const inputStates of Object.values(view.state.values)) {
            if (Object.keys(inputStates).length !== 1) {
                throw new Error(`expected exactly one key in inputStates: ${view.state.values}`);
            }
            const user_label = Object.keys(inputStates)[0];
            const value = inputStates[user_label].value; // this verbosity is necessary because typescript is bad :)
            if (value !== undefined && value !== null) {
                parameters[user_label] = value;
            } else {
                throw new Error(`value is undefined in inputStates: ${inputStates}`);
            }
        }
        await interaction.sorcerorpheus.handleUserActionButton(actionName, parameters);
    }

    startApp() { // this is what index.ts calls to start running
        (async () => {
            let httpsServerSettings = undefined;
            if (this.settings.httpsSettings !== undefined) {
                console.info("Running with HTTPS")
                httpsServerSettings = {
                    key: fs.readFileSync(this.settings.httpsSettings.keyPath),
                    cert: fs.readFileSync(this.settings.httpsSettings.certPath)
                }
            }
            await this.slackApp.start(this.settings.slackAppPort, httpsServerSettings);
            console.log(`NPC is running on port ${this.settings.slackAppPort}!`);
        })();
    }

    async handleStartInteractionCommand(event: GenericMessageEvent) {
        // start an interaction with the user who sent the command
        // this involves creating a new SorcerOrpheus (with some context), posting a message to slack, and adding the interaction to currentInteractions
        if (event.user === undefined) {
            console.error("event.user is undefined");
            return;
        }
        const sorcerorpheus = new SorcerOrpheus(this.chatbotInterface, new YourBot(), new BagContext(this.bagApp, event.user, this.settings.bagOwnerID));
        const userID = event.user;
        const channelID = event.channel;
        const initialMessage = await this.slackApp.client.chat.postMessage({
            token: this.settings.slackBotToken,
            channel: channelID,
            text: `<@${userID}>, reply to this message to talk to ${sorcerorpheus.getBrain().getNpcName()}!`,
        });
        if (initialMessage.ts === undefined) {
            throw new Error("ts is undefined on initial message");
        }
        const threadInfo: ThreadInfo = { channelID, ts: initialMessage.ts };
        this.currentInteractions.push({ sorcerorpheus, threadInfo, userID });
    }

    postResponseToSlack(responseToShow: ResponseForUser, threadInfo: ThreadInfo) {
        // construct the message to post to slack from the response
        // this is pretty much constructing any buttons we might need and the message itself
        // then post it to the interaction thread
        if (responseToShow.message === undefined && responseToShow.actions.length === 0) { // save ourselves some work
            console.debug("not sending message because it's empty");
            return;
        }
        if (responseToShow.message === undefined) {
            responseToShow.message = "(I chose not to speak, but here are some actions you can take:)";
        }
        const blocks: any[] = [ // i don't think this is typeable
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: responseToShow.message
                }
            }
        ];
        for (const action of responseToShow.actions) { // add a button for each user action
            blocks.push({
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: {
                            type: "plain_text",
                            text: action.name
                        },
                        value: action.name
                    }
                ]
            });
        }

        this.slackApp.client.chat.postMessage({ // and send the whole mess to Slack
            token: this.settings.slackBotToken,
            channel: threadInfo.channelID,
            thread_ts: threadInfo.ts,
            blocks: blocks,
            text: responseToShow.message
        });
    }

    handleActionButtonPressed(action: BlockAction<ButtonAction>) {
        // step 1: find the interaction that this action corresponds to by matching channel id and thread ts
        const interaction = this.currentInteractions.find((interaction) => {
            return interaction.threadInfo.channelID === action.container.channel_id && interaction.threadInfo.ts === action.message?.thread_ts;
        });
        if (interaction === undefined) {
            throw new Error("interaction not found");
        }
        if (interaction.userID !== action.user.id) {
            this.slackApp.client.chat.postEphemeral({
                token: this.settings.slackBotToken,
                channel: action.container.channel_id,
                user: action.user.id,
                text: `Hey! You're not <@${interaction.userID}>! Go start your own interaction!`
            });
            return;
        }
        console.log(`found interaction for ${interaction.userID}: ${interaction.sorcerorpheus.getBrain().getNpcName()}`);
        // now, find the action that corresponds to the button that was pressed
        // and use it to construct a modal
        const actionName = action.actions[0].value;
        const actionToExecute = interaction.sorcerorpheus.getBrain().getUserActions().find((action) => action.name === actionName);
        if (actionToExecute === undefined) {
            throw new Error(`action ${actionName} not found among ${interaction.sorcerorpheus.getBrain().getUserActions().map((action) => action.name).join(", ")}`);
        }
        // now we have to construct a modal from the action
        // each parameter in the action corresponds to a field in the modal

        const modalBlocks: any[] = [];
        for (const parameter of actionToExecute.parameters) { // add a user input box for each parameter
            let element;
            switch (parameter.type) {
                case "string":
                    element = {
                        type: "plain_text_input",
                        action_id: parameter.user_label
                    }
                    break;
                case "int":
                    element = {
                        type: "plain_text_input",
                        action_id: parameter.user_label,
                        is_decimal_allowed: false
                    }
                    break;
                case "float":
                    element = {
                        type: "plain_text_input",
                        action_id: parameter.user_label,
                        is_decimal_allowed: true
                    }
                    break;
                case "bool":
                    element = {
                        type: "static_select",
                        action_id: parameter.user_label,
                        options: [
                            {
                                text: {
                                    type: "plain_text",
                                    text: "Yes"
                                },
                                value: "true"
                            },
                            {
                                text: {
                                    type: "plain_text",
                                    text: "No"
                                },
                                value: "false"
                            }
                        ]
                    }
                case "inventory_item_stack":
                    element = {
                        type: "plain_text_input",
                        action_id: parameter.user_label,
                        placeholder: {
                            type: "plain_text",
                            text: "Items not yet supported. Sorry!"
                        }
                    };
                    break;
            }
            modalBlocks.push({
                type: "input",
                element,
                label: {
                    type: "plain_text",
                    text: parameter.user_label
                }
            });
        }
        this.slackApp.client.views.open({ // and show the whole thing to the user
            token: this.settings.slackBotToken,
            trigger_id: action.trigger_id,
            view: {
                type: "modal",
                callback_id: "user_input",
                title: {
                    type: "plain_text",
                    text: actionName
                },
                blocks: modalBlocks,
                close: {
                    type: "plain_text",
                    text: "Cancel"
                },
                submit: {
                    type: "plain_text",
                    text: "Submit"
                }
            }
        });
    }
}