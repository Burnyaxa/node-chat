const socket = io('http://localhost:3001');
const messageForm = document.getElementById('send-container');
const messageContainer = document.getElementById('message-container');
const messageInput = document.getElementById('message-input');

socket.emit('watch-history', name);

socket.on('chat-message', (data) => {
    appendMessage(`${data.name} : ${data.message}`);
    console.log(data);
});

function appendMessage(message){
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageContainer.append(messageElement);
}
