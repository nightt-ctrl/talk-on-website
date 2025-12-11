const chatBox = document.getElementById('chatBox');
const inputBox = document.getElementById('inputBox');
const sendBtn = document.getElementById('sendBtn');
const PASSCODE = 'mayshbaby'; // Must match backend

let lastMessageCount = 0; // Track how many messages are already displayed

// ---------------- Send message to backend ----------------
sendBtn.addEventListener('click', async () => {
    const message = inputBox.value.trim();
    if (!message) return;
    inputBox.value = '';

    try {
        await fetch('/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, passcode: PASSCODE })
        });
    } catch (err) {
        console.error('Failed to send message:', err);
    }

    fetchMessages();
});

// ---------------- Fetch messages from backend ----------------
async function fetchMessages() {
    try {
        const res = await fetch('/getMessages');
        const messages = await res.json();

        // Only append new messages
        const newMessages = messages.slice(lastMessageCount);

        newMessages.forEach(msg => {
            const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const cls = msg.sender === 'GF' ? 'gf' : 'bot';
            const displayName = msg.sender === 'GF' ? 'you' : 'jeeva';

            const bubble = document.createElement('div');
            bubble.className = `bubble ${cls}`;
            bubble.innerHTML = `<div class="bubble-header">${displayName}</div>
                                <div class="bubble-text">${msg.message}</div>
                                <div class="bubble-time">${time}</div>`;

            // Remove animation class to prevent looping
            bubble.style.animation = 'none';

            chatBox.appendChild(bubble);
        });

        // Update count
        if (newMessages.length > 0) {
            lastMessageCount = messages.length;
        }

    } catch (err) {
        console.error('Failed to fetch messages:', err);
    }
}

// ---------------- Poll every 2 seconds ----------------
setInterval(fetchMessages, 2000);
fetchMessages();
