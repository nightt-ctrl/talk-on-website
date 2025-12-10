const chatBox = document.getElementById('chatBox');
const input = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

const PASSCODE = 'mayshbaby'; // must match your backend passcode

// Fetch messages from backend
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

        // Scroll to latest
        chatBox.scrollTop = chatBox.scrollHeight;
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

// Send on button click
sendBtn.addEventListener('click', sendMessage);

// Send on Enter key
input.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
});

// Poll every 2 seconds
setInterval(fetchMessages, 2000);

// Initial fetch
fetchMessages();
