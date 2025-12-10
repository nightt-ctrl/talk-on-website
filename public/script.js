const chatBox = document.getElementById('chatBox');
const input = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

const PASSCODE = 'mayshbaby'; // must match backend

// Fetch messages from backend and render
async function fetchMessages() {
    try {
        const res = await fetch('/getMessages');
        const messages = await res.json();

        chatBox.innerHTML = messages.map(msg => {
            const time = new Date(msg.timestamp).toLocaleTimeString();
            return `<div class="message ${msg.sender === 'GF' ? 'gf' : 'bot'}">
                        <strong>${msg.sender}</strong>: ${msg.message} <span class="time">${time}</span>
                    </div>`;
        }).join('');

        chatBox.scrollTop = chatBox.scrollHeight; // auto-scroll
    } catch (err) {
        console.error('Failed to fetch messages:', err);
    }
}

// Send message to backend
async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    try {
        await fetch('/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, passcode: PASSCODE })
        });
        input.value = '';
        fetchMessages(); // refresh immediately
    } catch (err) {
        console.error('Failed to send message:', err);
    }
}

// Button click
sendBtn.addEventListener('click', sendMessage);

// Enter key
input.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
});

// Poll every 2 seconds
setInterval(fetchMessages, 2000);

// Initial fetch
fetchMessages();
