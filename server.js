import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import 'dotenv/config';
import fetch from 'node-fetch';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

const app = express();
const PORT = process.env.PORT || 8080;
const PASSCODE = process.env.PASSCODE || 'mayshbaby';
const BACKEND_URL = process.env.BACKEND_URL;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

let chatMessages = [];

// ---------------- Backend routes ----------------
app.post('/sendMessage', async (req, res) => {
    const { message, passcode } = req.body;
    if (passcode !== PASSCODE) return res.status(401).json({ error: 'Invalid passcode' });

    const newMessage = { sender: 'GF', message, timestamp: Date.now() };
    chatMessages.push(newMessage);
    console.log('GF message received:', message);

    // Send to Discord + Ping you
    if (client.isReady()) {
        try {
            const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
            if (channel) {
                await channel.send({
                    content: `<@${process.env.DISCORD_YOUR_USER_ID}> GF said: ${message}`,
                    allowedMentions: { users: [process.env.DISCORD_YOUR_USER_ID] }
                });
            }
        } catch (err) {
            console.error('Discord send error:', err);
        }
    }

    res.json({ status: 'ok', messages: chatMessages });
});

app.post('/botReply', (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message provided' });

    const newMessage = { sender: 'Bot', message, timestamp: Date.now() };
    chatMessages.push(newMessage);
    console.log('Bot message added:', message);
    res.json({ status: 'ok', messages: chatMessages });
});

app.get('/getMessages', (req, res) => res.json(chatMessages));

// ---------------- Discord bot ----------------
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder()
        .setName('send')
        .setDescription('Send a message to the website chat')
        .addStringOption(option =>
            option.setName('message')
                  .setDescription('Message to send')
                  .setRequired(true)
        )
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(
                process.env.DISCORD_CLIENT_ID,
                process.env.DISCORD_GUILD_ID
            ),
            { body: commands }
        );
        console.log('Slash commands registered.');
    } catch (err) {
        console.error('Slash command registration failed:', err);
    }
})();

client.once('ready', () => {
    console.log(`Discord Bot logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    if (interaction.commandName === 'send') {
        const message = interaction.options.getString('message');
        console.log('Slash command received:', message);

        try {
            await fetch(`${BACKEND_URL}/botReply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            await interaction.reply({ content: 'Message sent to website!', ephemeral: true });
        } catch (err) {
            console.error('Failed to send slash command to backend:', err);
            await interaction.reply({ content: 'Failed to send message.', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);

// ---------------- Start server ----------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
