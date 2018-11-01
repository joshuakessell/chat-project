// Dependencies
const express = require('express');
const path = require('path');
const app = express();
const passport = require('passport')
const session = require('express-session')
const bodyParser = require('body-parser')
const env = require('dotenv').load();

// Listen on PORT
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});
const io = require('socket.io')(server);

// Setting up server to parse the body.
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// For Passport

app.use(session({
    secret: 'secret session',
    resave: true,
    saveUninitialized: true
})); // session secret

app.use(passport.initialize());

app.use(passport.session()); // persistent login sessions

//set the template engine, ejs
app.set('view engine', 'ejs');

// Setting static directory
app.use(express.static(path.join(__dirname, '/app/public')));

//Setting views directory
app.set('views', path.join(__dirname, '/app/views'));

//Routes
app.get('/', (req, res) => {
    res.render('index');
});

//Models
var models = require("./app/models");

//Sync Database
models.sequelize.sync().then(function () {
    console.log('Nice! Database looks fine')
}).catch(function (err) {
    console.log(err, "Something went wrong with the Database Update!")
});

//Chatroom

var users = 0;

io.on('connection', (socket) => {
    
    var addedUser = false;

    //Upon emitting 'add user', execute
    socket.on('add user', (username) => {
        if(addedUser) {
            return;
        };
        //storing username in socket session for this client
        socket.username = username;
        ++users;
        addedUser=true;
        socket.emit('login', {
            users: users
        });
        // echo globally that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            users: users
        });
        console.log(`${socket.username} connected`);
    });
    

    //listen on change_username
    socket.on('change username', (data) => {
        socket.username = data.username;
    });

    //listens for disconnect
    socket.on('disconnect', () => {
        if(addedUser) {
            --users;    
            socket.broadcast.emit('user left', {
                username: socket.username,
                users: users
            });
        console.log(`${socket.username} disconnected`);
        }
    });

    // listen on new message
    socket.on('new message', (data) => {
        socket.broadcast.emit('new message', {
            message: data,
            username: socket.username
        });
    });

    //listen on typing
    socket.on('typing', () => {
        socket.broadcast.emit('typing', {
            username: socket.username
        });  
    });

    //listen on stop typing
    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });
});