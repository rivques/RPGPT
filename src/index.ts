import { App } from '@slack/bolt';
import dotenv from 'dotenv';
import fs from 'fs';
import { InteractionManager } from './npc_brain/interaction_manager';

// Load environment variables from .env file
dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const interactionManager = new InteractionManager(app);

// Start the Bolt app
interactionManager.startApp();
