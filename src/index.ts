import { Client, GatewayIntentBits } from "discord.js";
import { glob } from "glob";

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
	],
});

const token = process.env["DISCORD_TOKEN"];
const prefix = process.env["COMMAND_PREFIX"];

if (!token || !prefix) {
	throw new Error("Missing environment variables");
}

client.on("ready", () => {
	console.log("Ready! with prefix: " + prefix);
});

type Commands = {
	[key: string]: Function;
};
const initCommands = async () => {
	const commandFiles = await glob(`${__dirname}/commands/*.ts`);
	const commands: Commands = {};

	for (const file of commandFiles) {
		const command = await import(file);
		const commandFn = command.default;
		if (!(command.default instanceof Function)) {
			console.warn(
				"Skipping command: " +
					file +
					" because it doesn't have a default export"
			);
			continue;
		}

		const fileName = file.split("/").pop()!.split(".")[0]!;

		// convert kebab-case to camelCase
		const commandName = fileName.replace(/-([a-z])/g, (g: string) =>
			g[1]!.toUpperCase()
		);

		commands[commandName] = commandFn;
	}

	return commands;
};

let COMMANDS: Commands = {};
initCommands().then(commands => (COMMANDS = commands));

client.on("messageCreate", message => {
	if (message.author.bot) return;

	if (!message.content.startsWith(prefix)) return;

	const start = Date.now();
	const command = message.content.slice(prefix.length).split(" ")[0]!;
	const args = message.content
		.slice(prefix.length + command.length)
		.trim()
		.split(" ");

	if (!COMMANDS[command]) return void message.reply("Command not found");

	COMMANDS[command](message, args);
	const end = Date.now();
	const currentTime = new Date().toLocaleTimeString();

	console.log(
		`\x1b[35m[${currentTime}] \x1b[34mCommand \`${command}\` executed by ${
			message.author.tag
		} in \x1b[37m\x1b[42m ${end - start}ms \x1b[0m`
	);
});

client.login(token);
