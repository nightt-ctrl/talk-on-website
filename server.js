import fs from 'fs';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

const app = express();
const PORT = process.env.PORT || 3000;
const PASSCODE = process.env.PASSCODE || 'gf123';
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

// GF sends a message
app.post('/sendMessage', async (req, res) => {
    const { message, passcode } = req.body;
    if (passcode !== PASSCODE) return res.status(401).json({ error: 'Invalid passcode' });

    try {
        // Save to JSON
        const messages = loadMessages();
        const newMessage = { sender: 'GF', message, timestamp: Date.now() };
        messages.push(newMessage);
        saveMessages(messages);

        // Send to Discord
        if (client.isReady()) {
            const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
            if (channel) await channel.send(`GF: ${message}`);
        }

        res.json({ status: 'ok' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Return chat history
app.get('/getMessages', (req, res) => {
    try {
        res.json(loadMessages());
    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});

// Bot sends a message to frontend
app.post('/botReply', (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message provided' });

    try {
        const messages = loadMessages();
        const newMessage = { sender: 'Bot', message, timestamp: Date.now() };
        messages.push(newMessage);
        saveMessages(messages);

        res.json({ status: 'ok' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ----------------- DISCORD BOT -----------------
const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
]});

client.once('ready', () => {
    console.log(`Discord Bot logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;
    if (msg.author.id !== process.env.YOUR_DISCORD_ID) return; // Only listen to your messages

    try {
        await fetch(`http://localhost:${PORT}/botReply`, {
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
