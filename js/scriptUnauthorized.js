const socket = io('http://localhost:3001');
const messageForm = document.getElementById('send-container');
const messageContainer = document.getElementById('message-container');
const messageInput = document.getElementById('message-input');

socket.emit('new-user', 'anonymous');

socket.on('chat-message', (data) => {
    appendMessage(`${data.name} : ${data.message}`);
    console.log(data);
});

socket.on('user-connected', (name) => {
    appendMessage(`${name} connected`);
    console.log(data);
});

socket.on('user-disconnected', (name) => {
    appendMessage(`${name} disconnected`);
    console.log(data);
});

messageForm.addEventListener('submit', e=>{
   e.preventDefault();
   const message = messageInput.value;
   appendMessage(`You : ${message}`);
   socket.emit('send-chat-message', message);
   messageInput.value = '';
});

function appendMessage(message){
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageContainer.append(messageElement);
}
