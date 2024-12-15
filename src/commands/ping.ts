import { Message } from "discord.js";

export default function ping(message: Message) {
	const ping = Date.now() - message.createdTimestamp;
	message.reply(`Pong! took ${ping}ms`);
}
