import dotenv from 'dotenv';
import { InteractionManager } from './npc_brain/InteractionManager';
import { InteractionManagerSettings } from './npc_brain/InteractionManagerSettings';

// Load environment variables from .env file
dotenv.config();

function getEnvVariable(name: string): string { // convenience function to make sure all env variables are defined
  const value = process.env[name];
  if (typeof value !== 'string') {
    throw new Error(`Environment variable ${name} is not defined`);
  }
  return value;
}


const settings: InteractionManagerSettings = { // this is the main settings object for the InteractionManager
  slackBotToken: getEnvVariable('SLACK_BOT_TOKEN'),
  slackSigningSecret: getEnvVariable('SLACK_SIGNING_SECRET'),
  slackAppPort: parseInt(getEnvVariable('SLACK_APP_PORT')),
  interactionChannels: getEnvVariable('INTERACTION_CHANNELS'),
  bagAppID: parseInt(getEnvVariable('BAG_APP_ID')),
  bagAppKey: getEnvVariable('BAG_APP_KEY'),
  bagOwnerID: getEnvVariable('BAG_OWNER_ID'),
  llmSettings: {
    provider: "openai-proxy", // EDIT THIS: if you want to use a different AI service
    llmAPIKey: getEnvVariable('OPENAI_PROXY_API_KEY'),
    model: "gpt-3.5-turbo",
    maxResponseTokens: 500
  },
  httpsSettings: { // EDIT THIS: if you don't want to use https (e.g, if ngrok is handling it)
    keyPath: getEnvVariable('HTTPS_KEY_PATH'),
    certPath: getEnvVariable('HTTPS_CERT_PATH')
  }
};

(async () => {
  const interactionManager = await InteractionManager.create(settings);
  // Start the app
  interactionManager.startApp();
})();