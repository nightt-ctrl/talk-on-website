const chatWindow = document.getElementById('chat');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const PASSCODE = 'gf123'; // Replace with env if needed

const fetchMessages = async () => {
    try {
        const res = await fetch('/getMessages');
        const data = await res.json();
        chatWindow.innerHTML = data.map(m => `<div><strong>${m.sender}:</strong> ${m.message}</div>`).join('');
        chatWindow.scrollTop = chatWindow.scrollHeight;
    } catch (err) {
        console.error(err);
    }
};

sendBtn.addEventListener('click', async () => {
    const message = messageInput.value.trim();
    if (!message) return;
    await fetch('/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, passcode: PASSCODE })
    });
    messageInput.value = '';
    fetchMessages();
});

// Poll every 2 seconds
setInterval(fetchMessages, 2000);
fetchMessages();
