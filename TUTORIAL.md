# How to run your own NPC
Hi! This will teach you how to set up your own LLM-based Bag bot. We'll host it on Nest, Hack Club's program for free compute for teens, and run it on Hack Club's free OpenAI proxy.
## Prerequisites
* A [Nest]() account. Follow the [Quickstart](https://guides.hackclub.app/index.php/Quickstart) to get an account if you don't have one already.
* An editor. I reccoment VS Code with the Remote SSH extension, but you could use something like `nano` or `vim` if you're more hardcore than me.
## Sign into your Nest account
(if you're not using VS Code, connection to Nest is beyond the scope of this guide. I trust you.)

Open VS Code, install the Remote SSH extensonand click the blue >< symbol in the bottom left corner. Click "Connect current window to host," then "Add new SSH host." Enter `ssh NESTUSERNAME@NESTUSERNAME.hackclub.app`, replacing NESTUSERNAME with your Nest username. Hit enter, then enter again, then click "connect" in the notification in the bottom-right corner. A new window will open. Select "Linux" on the prompt, then "Continue". You should now find yourself logged into Nest.
## Fork and clone this repository
Head to https://github.com/rivques/RPGPT (if you're not already here). Click "Fork" in the top right, then change "repository name" to whatever you'd like the name of your NPC to be, and hit "Create fork." Once your fork is create, hit the big green "Code" button, then copy the url. Head back into VS Code and hit ``Ctrl+`​`` (that's the backtick) to bring up a terminal. Type `git clone URL`, replacing URL with what you just copied, and hit enter. Finally, open the folder from VS Code by heading to `File->Open Folder`, then selecting the repository you just cloned.
## Install dependencies
In the terminal, type `npm i` and hit enter.
## Create .env
Copy the `.env.example` file on the left sidebar and rename it to `.env`. This is where all of your API keys will go, and we'll fill it up over the next few steps.
## Set up Slack app
First, we need to get ourselves a Slack app. Head to the [Your Slack Apps](https://api.slack.com/apps) page and hit "Create New App," then "From Scratch." Name it whatever your NPC's name is, and select "Hack Club" for the workspace.

![screenshot of Slack app creation dialog](https://github.com/rivques/RPGPT/assets/38469076/58d3e672-2e94-496c-831e-8c3e3cff0cd2)
Hit "Create App," then scroll down to "App Credentials." Copy the signing secret -- this is the first of many API keys you'll need. Head to your `.env` file and paste it next to `SLACK_SIGNING_SECRET`, making sure there's no space between the `=` and the start of the secret. Next, we need to add some scopes to this app. Head to "OAuth & Permissions," then scroll down to Bot Token Scopes. Add the following scopes:
```
app_mentions:read
channels:history
channels:join
channels:read
chat:write
chat:write.public
```
There's a few more things we'll need to do with Slack later, but that's all for now.
## Set up bag app
Next, we need to register an app with Bag. Head to the Slack and run /bot somewhere. Enter your bot's name, then choose "public" and "read," and hit "create."

![screenshot of Bag app creation dialog](https://github.com/rivques/RPGPT/assets/38469076/f6e7ff0a-c076-49a5-8687-a2b1cf286db1)

Bag should immediately DM you an app ID and app token. Put the app ID in your `.env` file next to `BAG_APP_ID=` (put it before the comment starting with a hashtag, i.e. `BAG_APP_ID=27 # get these two...`). Put the app token next to `BAG_APP_KEY=`. While you're in the Slack, click on your profile picture in the bottom left, then click "profile." Select the three vertical dots in the menu that pops up, then pick "Copy member ID." Paste this next to `BAG_OWNER_ID=` in the `.env` file.
## Set up OpenAI key
Join the `#open-ai-token` channel, then run `/openai-create-token`. Copy the token it gives you and paste it next to `OPENAI_PROXY_API_KEY=` in `.env`.
## Set up Caddy
Now we need to tell Nest about our app so Slack can talk to it. In VS Code, head to `File->Open File`, type `~/Caddyfile` in the search box and hit enter. Hit "Open" if you get asked to allow untrusted files. At the bottom of the caddyfile, just before the last closing brace, add the line `reverse_proxy :3000`. If you started with the default Caddyfile, you should get something that looks like this:
```
{
	admin unix//home/USERNAME/caddy-admin.sock
}
http://USERNAME.hackclub.app {
	bind unix/.webserver.sock|777
	root * /home/USERNAME/pub
	file_server {
		hide .git .env
	}
    reverse_proxy :3000
}
```
Save the file, then in the terminal run `systemctl --user restart caddy` to apply your changes.
## Finish setting up Slack app
Head back to the Slack app page and hit "Install to workspace," then "Allow." Now, when you go back to "OAuth & Permissions," you should see a "Bot User OAuth Token." Copy that and put it in your `.env` file next to `SLACK_BOT_TOKEN=`.

Now we need to set the channels the npc should be active in. I'll put it in #town-square, but you might want a different channel (or channels). In Slack, right click on the channel you want your NPC to be in, and hit "view channel details." Scroll down and copy the channel ID. Paste it into `.env` next to `INTERACTION_CHANNELS=`. If you want your bot to be active in multiple channels, you can add a comma-separated list of channel IDs here.

Now, it's time to start your bot. In the terminal, run `npm start` and wait to see "NPC is running on port 3000!" in the terminal. Now, head back to the slack app page and go to "Event Subscriptions." Once the page loads, click "Enable Events." For Request URL, enter `https://NESTUSERNAME.hackclub.app/slack/events`, replacing NESTUSERNAME with your Nest username. You should see a "Verified" message appear after a few seconds. Next, click on "Subscribe to bot events," then "Add bot user event." Add the "message.channels" event, then **click on "save changes."** (that step is very easy to forget!) Finally, head back to the terminal and hit `Ctrl+C` to stop the bot.
## Edit and test the prompts
It's time to give your bot some personality! Head to the `src/npc_brain/YourBot.ts` file. First, change the name of your NPC on line 7 to whatever the name of your NPC is. Next, head to line 19 and choose what part of your inventory your bot can see. This is important so you don't overwhelm the LLM. Now, head to about line 10 and fill out the prompt for your NPC. This is where you explain the NPC's character and tell it what it should do. Once you have these filled out, run `npm start` in the terminal again to start the bot. Now, head to #town-square (or whatever channel you added the NPC to) and ping it. The bot should send a message, reply to the message to start chatting with your NPC!

If you find you need to make changes to your prompt, first `Ctrl+C` the bot in the terminal to stop it, then make your changes and try again.

As an example, here's what Ore-pheus's file ended up looking like:

![screenshot of YourBot.ts for rivques/ore-pheus](https://github.com/rivques/RPGPT/assets/38469076/07815b67-d928-4cd4-b47d-7f6f160268bf)

### Trading
Out of the box, the NPC is only capable of giving items to the player, not trading. This is because I wasn't able to quite get the prompt engineering right for trading, but if you want to try, you can scroll down in `YourBot.ts`, uncomment the trading code, and probably also comment out the giving code. Be prepared to go bug hunting if you do this.
## Run the bot!
Once you like what you have, run `nohup npm start > rpgpt.log &` to start it running forever!
### Stopping the bot
If you've started your bot with `nohup` and you want to stop it, you can run `fuser -INT -k 3000/tcp`.
## a note on ports
There's two ports happening here: Internally, Node is hosting a server on port 3000. Externally, Caddy is forwarding HTTPS traffic on port 443. This means that you can't easily be serving another server on 443 while running an NPC like this, and doing so is beyond the scope of this guide (read: i don't know how to do it). If you want to use a different internal port, pretty much everywhere you see a 3000 in this guide should be changed, and you'll also need to change `SLACK_APP_PORT` in `.env`.
