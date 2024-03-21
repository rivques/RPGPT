import { App } from '@slack/bolt';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// Listen for a slash command
app.command('/hello', async ({ command, ack, say }) => {
  await ack();
  await say(`Hello, <@${command.user_id}>!`);
});

// Start the Bolt app
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();
