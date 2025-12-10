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
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// ----------------- MESSAGE STORAGE -----------------

// In-memory storage for chat
let chatMessages = [];

// Load from file on startup (optional)
if (fs.existsSync(MESSAGES_FILE)) {
    chatMessages = JSON.parse(fs.readFileSync(MESSAGES_FILE));
}

// Helper functions
const saveMessages = (messages) => fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

// ----------------- BACKEND ROUTES -----------------

// GF sends a message
app.post('/sendMessage', async (req, res) => {
    const { message, passcode } = req.body;
    if (passcode !== PASSCODE) return res.status(401).json({ error: 'Invalid passcode' });

    try {
        const newMessage = { sender: 'GF', message, timestamp: Date.now() };
        chatMessages.push(newMessage);
        saveMessages(chatMessages);

        // Send to Discord
        if (client.isReady()) {
            const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
            if (channel) await channel.send(`GF: ${message}`);
        }

        res.json({ status: 'ok', messages: chatMessages });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Bot reply route
app.post('/botReply', (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message provided' });

    const newMessage = { sender: 'Bot', message, timestamp: Date.now() };
    chatMessages.push(newMessage);
    saveMessages(chatMessages);

    res.json({ status: 'ok', messages: chatMessages });
});

// Return chat history
app.get('/getMessages', (req, res) => {
    res.json(chatMessages);
});

// ----------------- DISCORD BOT -----------------

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Discord Bot logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;
    if (msg.author.id !== process.env.YOUR_DISCORD_ID) return; // only your messages

    try {
        await fetch(`${BACKEND_URL}/botReply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg.content })
        });
    } catch (err) {
        console.error('Failed to send Discord message to backend:', err);
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);

// ----------------- START EXPRESS SERVER -----------------
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
