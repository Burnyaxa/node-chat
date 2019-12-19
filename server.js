if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const socketPort = 3001;
const port = 3000;
const io = require('socket.io')(socketPort);
const path = require('path');
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');

const MongoClient = require('mongodb').MongoClient;
const uri =
  'mongodb+srv://Burnyaxa:admin1337@cluster0-wztus.mongodb.net/chat';
const mongoClient = new MongoClient(uri, {
  useUnifiedTopology: true,
  useNewUrlParser: true
});
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false });




var users = [];

mongoClient.connect(function (err, client) {
  if (err) {
    return console.log(err);
  }
  const db = client.db('chat');
  const collection = db.collection('users');

  users = collection.find().toArray().then((doc) => {
    users = doc;
    console.log(users);
  })
})

console.log(users);

const initializePassport = require('./passport-config');
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
);

app.use(express.static(path.join(__dirname, 'js')));
app.use(express.static(path.join(__dirname, 'css')));
app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
  res.render('unauthorized.ejs');
});

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/chat',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const obj = {
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    };
    users.push(obj);
    console.log(obj);
    mongoClient.connect(function (err, client) {
      if (err) {
        return console.log(err);
      }
      const db = client.db('chat');
      const collection = db.collection('users');

      collection.insertOne(obj, (err, result) => {
        if (err) {
          return console.log(err);
        }
      });
    });

    res.redirect('/login');
  } catch {
    res.redirect('/register');
  }
})

app.delete('/logout', (req, res) => {
  req.logOut();
  res.redirect('/login');
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/chat');
  }
  next();
}

app.listen(port);

app.get('/chat', checkAuthenticated, (req, res) => {
  res.render('chat.ejs', { name: req.user.name });
});

app.get('/history', checkAuthenticated, (req, res) => {
  res.render('history.ejs', { name: req.user.name });
});

const userss = {};
var history = [];

io.on('connection', socket => {

  console.log('new User')
  socket.on('new-user', name => {
    console.log(name)
    userss[socket.id] = name;

    history.forEach((element) => {
      socket.emit('chat-message', element);
    })
    socket.broadcast.emit('user-connected', name);
  })
  socket.on('send-chat-message', message => {
    console.log(message)
    socket.broadcast.emit('chat-message', { message: message, name: userss[socket.id] });
    history.push({ message: message, name: userss[socket.id], id: Date.now().toString() });
    if (history.length == 6) {
      history = [];
      history.push({ message: message, name: userss[socket.id] })
    }
    if (history.length == 5) {
      console.log('SAVING!!');
      console.log(history);

      mongoClient.connect(function (err, client) {
        if (err) {
          return console.log(err);
        }
        const db = client.db('chat');
        const collection = db.collection('history');

        collection.insertMany(history, (err, result) => {
          if (err) {
            return console.log(err);
          }
        })
      })

    }
  })
  socket.on('disconnect', () => {
    socket.broadcast.emit('user-disconnected', userss[socket.id])
    delete userss[socket.id]
  })
  socket.on('watch-history', () => {
    var longHistory;

    mongoClient.connect(function (err, client) {
      if (err) {
        return console.log(err);
      }
      const db = client.db('chat');
      const collection = db.collection('history');

      collection.find().sort({ id: 1 }).toArray().then((data) => {
        //console.log(data)
        longHistory = data;
        longHistory.forEach((element) => {
          socket.emit('chat-message', element);
        })
      })
    })
  })
})
