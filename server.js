import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

const app = express();
const PORT = process.env.PORT || 8080;
const PASSCODE = process.env.PASSCODE || 'mayshbaby';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// ----------------- In-memory chat storage -----------------
let chatMessages = [];

// ----------------- Backend routes -----------------

// GF sends message
app.post('/sendMessage', async (req, res) => {
    const { message, passcode } = req.body;
    if (passcode !== PASSCODE) return res.status(401).json({ error: 'Invalid passcode' });

    const newMessage = { sender: 'GF', message, timestamp: Date.now() };
    chatMessages.push(newMessage);

    // Send to Discord
    if (client.isReady()) {
        try {
            const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
            if (channel) await channel.send(`GF: ${message}`);
        } catch (err) {
            console.error('Discord send error:', err);
        }
    }

    res.json({ status: 'ok', messages: chatMessages });
});

// Bot reply from Discord
app.post('/botReply', (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'No message provided' });

    const newMessage = { sender: 'Bot', message, timestamp: Date.now() };
    chatMessages.push(newMessage);

    res.json({ status: 'ok', messages: chatMessages });
});

// Return chat history
app.get('/getMessages', (req, res) => {
    res.json(chatMessages);
});

// ----------------- Discord bot -----------------

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

// Forward messages from Discord to backend
client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return; // ignore bot messages

    // Only listen in the designated Discord channel
    if (msg.channel.id !== process.env.DISCORD_CHANNEL_ID) return;

    try {
        await fetch(`${BACKEND_URL}/botReply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg.content })
        });
    } catch (err) {
        console.error('Failed to forward Discord message to backend:', err);
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);

// ----------------- Start server -----------------
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
