const chatBox = document.getElementById('chatBox');
const inputBox = document.getElementById('inputBox');
const sendBtn = document.getElementById('sendBtn');
const PASSCODE = 'mayshbaby'; // Must match backend

// Send message to backend
sendBtn.addEventListener('click', async () => {
    const message = inputBox.value.trim();
    console.log('Send button clicked, message:', message);
    if (!message) return;
    inputBox.value = '';

    try {
        const res = await fetch('/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, passcode: PASSCODE })
        });
        const data = await res.json();
        console.log('Send response:', data);
    } catch (err) {
        console.error('Failed to send message:', err);
    }

    fetchMessages(); // immediately update chatbox
});

// Fetch messages from backend
async function fetchMessages() {
    try {
        const res = await fetch('/getMessages');
        const messages = await res.json();

        chatBox.innerHTML = messages.map(msg => {
            const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const cls = msg.sender === 'GF' ? 'gf' : 'bot';
            return `<div class="message ${cls}">
                        <strong>${msg.sender}</strong>: ${msg.message} <span class="time">${time}</span>
                    </div>`;
        }).join('');

        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) {
        console.error('Failed to fetch messages:', err);
    }
}

// Poll every 2 seconds
setInterval(fetchMessages, 2000);
fetchMessages(); // initial load
