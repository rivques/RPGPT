import { App, SlashCommand, AckFn, RespondFn, RespondArguments } from "@slack/bolt";
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
}