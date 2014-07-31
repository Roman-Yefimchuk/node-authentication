// server.js

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var passport = require('passport');
var flash = require('connect-flash');

var port = 8080;

{
    var path = require('path');
    var name = path.join(__dirname, 'public');
    var static = express.static(name);
    app.use(static);
}

var dbConnector = require('./app/db/db-connector');
dbConnector.connect(function (dbProvider) {

    require('./config/passport')(passport); // pass passport for configuration

    app.configure(function () {

        // set up our express application
        app.use(express.logger('dev')); // log every request to the console
        app.use(express.cookieParser()); // read cookies (needed for auth)
        app.use(express.bodyParser()); // get information from html forms

        app.set('view engine', 'ejs'); // set up ejs for templating

        // required for passport
        app.use(express.session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
        app.use(passport.initialize());
        app.use(passport.session()); // persistent login sessions
        app.use(flash()); // use connect-flash for flash messages stored in session

    });

    require('./app/sockets-handler')(io);
    require('./app/routes.js')(app, passport, dbProvider);

    server.listen(port);

    console.log('The magic happens on port ' + port);
});
