import { App } from '@slack/bolt';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// Listen for a slash command
app.command('/bagkery-ping', async ({ command, ack, say }) => {
  await ack();
  await say(`Pong, <@${command.user_id}>!`);
});

// Start the Bolt app
(async () => {
  await app.start(process.env.PORT || 3000, {key: fs.readFileSync(process.env.TLS_KEY_PATH ?? "put ur paths in the env variable"), cert: fs.readFileSync(process.env.TLS_CERT_PATH ?? "put ur paths in the env variable")});
  console.log('⚡️ Bolt app is running!');
})();
