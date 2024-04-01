# How to run your own NPC
Hi! This will teach you how to set up your own LLM-based Bag bot. We'll host it on Nest, Hack Club's program for free compute for teens, and run it on Hack Club's free OpenAI proxy.
## Prerequisites
* A [Nest]() account. Follow the [Quickstart](https://guides.hackclub.app/index.php/Quickstart) to get an account if you don't have one already.
* An editor. I reccoment VS Code with the Remote SSH extension, but you could use something like `nano` or `vim` if you're more hardcore than me.
## Sign into your Nest account
(if you're not using VS Code, connection to Nest is beyond the scope of this guide. I trust you.)

Open VS Code, install the Remote SSH extensonand click the blue >< symbol in the bottom left corner. Click "Connect current window to host," then "Add new SSH host." Enter `ssh YOURNESTUSERNAME@YOURNESTUSERNAME.hackclub.app`. Hit enter, then enter again, then click "connect" in the notification in the bottom-right corner. A new window will open. Select "Linux" on the prompt, then "Continue". You should now find yourself logged into Nest.
## Fork and clone this repository
Head to https://github.com/rivques/RPGPT (if you're not already here). Click "Fork" in the top right, then change "repository name" to whatever you'd like the name of your NPC to be, and hit "Create fork." Once your fork is create, hit the big green "Code" button, then copy the url. Head back into VS code and hit ``Ctrl+` `` (that's the backtick) to bring up a terminal. Type `git clone URL`, replacing URL with what you just copied, and hit enter. Finally, open the folder from VS Code by heading to `File->Open Folder`, then selecting the repository you just cloned.
## Install dependencies
In the terminal, type `npm i` and hit enter.
## Create .env
Copy the `.env.example` file on the left sidebar and rename it to `.env`. This is where all of your API keys will go, and we'll fill it up over the next few steps.
## set up slack app
First, we need to get ourselves a Slack app. Head to the [Your Slack Apps](https://api.slack.com/apps) page and hit "Create New App," then "From Scratch." Name it whatever your NPC's name is, and select "Hack Club" for the workspace.
![image](https://github.com/rivques/RPGPT/assets/38469076/58d3e672-2e94-496c-831e-8c3e3cff0cd2)
## set up bag app
## set up llm provider key
## set caddy
## set up slack channels
## edit and test the prompts
