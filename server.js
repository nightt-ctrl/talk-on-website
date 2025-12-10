import fs from 'fs';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

const app = express();
const PORT = process.env.PORT || 3000;
const PASSCODE = process.env.PASSCODE || 'mayshbaby';
const MESSAGES_FILE = './messages.json';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Ensure messages.json exists
if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([]));
}

// Helper functions
const loadMessages = () => JSON.parse(fs.readFileSync(MESSAGES_FILE));
const saveMessages = (messages) => fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

// ----------------- BACKEND ROUTES -----------------
app.post('/sendMessage', async (req, res) => {
    const { message, passcode } = req.body;
    if (passcode !== PASSCODE) return res.status(401).json({ error: 'Invalid passcode' });

    const messages = loadMessages();
    const newMessage = { sender: 'GF', message, timestamp: Date.now() };
    messages.push(newMessage);
    saveMessages(messages);

    // Forward to Discord
    if (discordChannel) {
        try {
            await discordChannel.send(`GF: ${message}`);
        } catch (err) {
            console.error('Failed to send message to Discord:', err);
        }
    }

    res.json({ status: 'ok' });
});

app.get('/getMessages', (req, res) => {
    res.json(loadMessages());
});

app.post('/botReply', (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message provided' });

    const messages = loadMessages();
    const newMessage = { sender: 'Bot', message, timestamp: Date.now() };
    messages.push(newMessage);
    saveMessages(messages);

    res.json({ status: 'ok' });
});

// ----------------- DISCORD BOT -----------------
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
let discordChannel = null;

client.on('ready', () => {
    console.log(`Discord Bot logged in as ${client.user.tag}`);
    discordChannel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
    if (!discordChannel) console.log('Discord channel not found. Make sure DISCORD_CHANNEL_ID is correct.');
});

client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    // Only respond to your messages
    if (msg.author.id === process.env.YOUR_DISCORD_ID) {
        try {
            await fetch(`http://localhost:${PORT}/botReply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg.content })
            });
        } catch (err) {
            console.error('Failed to send Discord message to backend:', err);
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);

// ----------------- START EXPRESS SERVER -----------------
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
