const chatBox = document.getElementById('chatBox');
const inputBox = document.getElementById('inputBox');
const sendBtn = document.getElementById('sendBtn');
const PASSCODE = 'mayshbaby'; // Must match backend

// Send message to backend
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

// Fetch messages from backend
async function fetchMessages() {
    try {
        const res = await fetch('/getMessages');
        const messages = await res.json();

        chatBox.innerHTML = messages
            .map(msg => {
                const time = new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const isGF = msg.sender === 'GF';
                const displayName = isGF ? 'you' : 'jeeva';

                return `
                    <div class="bubble ${isGF ? 'gf' : 'bot'}">
                        <div class="bubble-header">${displayName}</div>
                        <div class="bubble-text">${msg.message}</div>
                        <div class="bubble-time">${time}</div>
                    </div>
                `;
            })
            .join('');

        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) {
        console.error('Failed to fetch messages:', err);
    }
}

// Poll every 2 seconds
setInterval(fetchMessages, 2000);
fetchMessages();
