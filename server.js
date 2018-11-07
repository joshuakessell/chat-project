// Dependencies
const express = require('express');
const app = express();
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const mysql = require('mysql');
var connection;

if (process.env.JAWSDB_URL) {
    connectoin = mysql.createConnection(process.env.JAWSDB_URL);
} else {
    connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'sequelize_passport'
    });
};

// Listen on PORT
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});

const io = require("socket.io")(server);


// Setting static directory
app.use(express.static(path.join(__dirname, 'app/public')));


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

// For Handlebars
app.set('views', './app/views');
app.engine('hbs', exphbs({
    extname: '.hbs'
}));
app.set('view engine', '.hbs');

// Models
var models = require("./app/models");

// Routes
const authRoute = require('./app/routes/auth.js')(app, passport);

// Load passport strategies
require('./app/config/passport/passport.js')(passport, models.user);

// Sync Database
models.sequelize.sync().then(function () {
    console.log('Nice! Database looks fine.')
}).catch(function (err) {
    console.log(err, "Something went wrong with the Database Update!")
});


// Chatroom

var numUsers = 0;

io.on('connection', (socket) => {
    var addedUser = false;

    // when the client emits 'new message', this listens and executes
    socket.on('new message', (data) => {
        // we tell the client to execute 'new message'
        socket.broadcast.emit('new message', {
            username: socket.id,
            message: data
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', (username) => {
        console.log(addedUser);
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        console.log('add user - server');
        socket.emit('login', {
            numUsers: numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', () => {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', () => {
        if (addedUser) {
            --numUsers;

            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});