const socketPort = 3001;
const port = 3000;
const io = require('socket.io')(socketPort);
const path = require('path');
const bcrypt = require('bcryptjs');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
app.use(express.json());

const users = {};

io.on('connection', socket => {
    console.log('new User');
    socket.on('new-user', name=>{
        users[socket.id] = name;
        socket.broadcast.emit('user-connected', name);
    });
    socket.on('send-chat-message', message => {
        console.log(message);
        socket.broadcast.emit('chat-message', { message: message, name: users[socket.id]});
    });
    socket.on('disconnect', ()=>{
        socket.broadcast.emit('user-disconnected', users[socket.id]);
        delete users[socket.id];
    });
});

app.use(express.static(path.join(__dirname, 'js')));
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

server.listen(port);

app.get('/chat', function (request, response){
    response.render('chat');
});

const userss = [];

app.get('/users', (req, res) => {
    res.json(userss);
});

app.post('/users', async (req, res) => {
    try {
        const salt =  await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        console.log(salt);
        console.log(hashedPassword);
        const user = { name: req.body.name, password: hashedPassword};
        userss.push(user);
        res.status(201).send();
    } catch {
        res.status(500).send();
    }
});

app.post('/users/login', async (req, res) => {
    const user = userss.find(user => user.name = req.body.name);
    if(user == null){
        return res.status(400).send('Cannot find user');
    }
    try{
        if(await bcrypt.compare(req.body.password, user.password)){
            res.send('Success');
        }
        else{
            res.send('not allowed');
        }
    }catch{
        res.status(500).send();
    }
});
