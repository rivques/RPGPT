import { App, SlashCommand, AckFn, RespondFn, RespondArguments, BlockAction, ButtonAction, Block, SlackViewAction, ViewOutput } from "@slack/bolt";
import fs from "fs";
import { OpenAIHackClubProxy } from "../chatbot_interfaces/openai_hackclub_proxy";
import { SorcerOrpheus, ResponseForUser } from "../scorcerorpheus/scorcerorpheus";
import { ChatbotInterface } from "../chatbot_interfaces/chatbot_interface";
import { YourBot } from "./your_bot";

interface Interaction {
    sorcerorpheus: SorcerOrpheus;
    threadInfo: ThreadInfo;
    userID: string;
}

interface ThreadInfo {
    channelID: string;
    ts: string;
}

export class InteractionManager {
    // this is the glue between the LLM, the NPC brain, the user, and Bag
    // it handles:
    // - interaction setup (e.g. configuing the LLM)
    // - converting between Slack and LLM interfaces
    // - user input and passing through the brain to sorcerorpheus
    // - executing sorcerorpheus's actions
    // - semi-graceful error recovery
    app: App;
    chatbotInterface: ChatbotInterface;
    currentInteractions: Interaction[] = [];

    constructor(app: App){
        this.chatbotInterface = new OpenAIHackClubProxy();
        
        this.app = app;
        // Listen for a slash command
        app.command('/bagkery-ping', async ({ command, ack, say }) => {
            await ack();
            await say(`Pong, <@${command.user_id}>!`);
        });
        
        app.command('/bagkery-interact', async ({ command, ack, respond }) => {await this.handleStartInteractionCommand(command, ack, respond)});

        app.action(new RegExp(".*"), async ({ ack, body, respond, action, payload }) => {
            await ack();
            const blockAction = (body as BlockAction)
            if (blockAction.actions[0].type !== "button"){
                throw new Error("unsupported action type: " + blockAction.actions[0].type);
            }
            await this.handleActionButtonPressed(blockAction as BlockAction<ButtonAction>);
        })

        app.view('user_input', async ({ ack, body, view }) => {
            await ack();
            console.log("got view submission");
            console.log(body);
            console.log(view.state.values);
            await this.handleViewSubmission(body, view);
        });
    }

    handleViewSubmission(body: SlackViewAction, view: ViewOutput) {
        // find the interaction that this view submission corresponds to
        // then find the action that corresponds to the view submission
        // and execute it via sorcerorpheus

        const interaction = this.currentInteractions.find((interaction) => {
            return interaction.userID === body.user.id;
        });
        if (interaction === undefined){
            throw new Error("interaction not found");
        }
        const actionName = view.title.text;
        // parameters is a map from user_label to value
        let parameters: { [user_label: string]: string } = {};
        for (const inputStates of Object.values(view.state.values)){
            if (Object.keys(inputStates).length !== 1){
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
        interaction.sorcerorpheus.executeUserAction(actionName, parameters);
    }

    startApp(){
        (async () => {
            await this.app.start(process.env.PORT || 3000, {key: fs.readFileSync(process.env.TLS_KEY_PATH ?? "put ur paths in the env variable"), cert: fs.readFileSync(process.env.TLS_CERT_PATH ?? "put ur paths in the env variable")});
            console.log('⚡️ Bolt app is running!');
          })();
    }

    async handleStartInteractionCommand(command: SlashCommand, ack: AckFn<string | RespondArguments>, respond: RespondFn ){
        // pseudocode:
        // initialize a new sorcerorpheus instance
        // post a "user is interacting with NPC" message to some channel
        // then pass the result of that instantiation back to the user as a threaded reply, with buttons according to sorcerorpheus
        await ack();
        const sorcerorpheus = new SorcerOrpheus(this.chatbotInterface, new YourBot());
        const userID = command.user_id;
        const channelID = command.channel_id;
        const initialMessage = await this.app.client.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            channel: channelID,
            text: `<@${userID}> has started an interaction with ${sorcerorpheus.getBrain().getNpcName()}.`,
        });
        if (initialMessage.ts === undefined){
            throw new Error("ts is undefined on initial message");
        }
        const threadInfo: ThreadInfo = {channelID, ts: initialMessage.ts};
        this.currentInteractions.push({sorcerorpheus, threadInfo, userID});

        // now we have to get the first message from the LLM
        const firstMessage = await sorcerorpheus.startInteraction();
        await this.postResponseToSlack(firstMessage, threadInfo);
    }

    postResponseToSlack(firstMessage: ResponseForUser, threadInfo: ThreadInfo) {
        // construct the message to post to slack from the response
        // then post it to the thread
        const blocks: any[] = [ // i don't think this is typeable
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: firstMessage.message
                }
            }
        ];
        for (const action of firstMessage.actions){
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

        this.app.client.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            channel: threadInfo.channelID,
            thread_ts: threadInfo.ts,
            blocks: blocks,
            text: firstMessage.message
        });
    }

    handleActionButtonPressed(action: BlockAction<ButtonAction>){
        // step 1: find the interaction that this action corresponds to by matching channel id and thread ts
        const interaction = this.currentInteractions.find((interaction) => {
            return interaction.threadInfo.channelID === action.container.channel_id && interaction.threadInfo.ts === action.message?.thread_ts;
        });
        if (interaction === undefined){
            throw new Error("interaction not found");
        }
        if (interaction.userID !== action.user.id){
            this.app.client.chat.postEphemeral({
                token: process.env.SLACK_BOT_TOKEN,
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
        if (actionToExecute === undefined){
            throw new Error(`action ${actionName} not found among ${interaction.sorcerorpheus.getBrain().getUserActions().map((action) => action.name).join(", ")}`);
        }
        // now we have to construct a modal from the action
        // each parameter in the action corresponds to a field in the modal

        const modalBlocks: any[] = [];
        for (const parameter of actionToExecute.parameters){
            let element;
            switch (parameter.type){
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
        this.app.client.views.open({
            token: process.env.SLACK_BOT_TOKEN,
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