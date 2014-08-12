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

function isDevelopmentMode() {
    var args = process['argv'];
    if (args.length > 2) {
        if (args[2] == 'development-mode') {
            console.log('Server started in [development] mode');
            return true;
        }
    }
    console.log('Server started in [standard] mode');
    return false;
}

var developmentMode = isDevelopmentMode();

var dbConnector = require('./app/db/db-connector');
dbConnector.connect(function (dbProvider) {

    require('./app/providers/authorization-provider')(passport, dbProvider);

    app.configure(function () {

        app.use(express.logger('dev'));
        app.use(express.cookieParser());
        app.use(express.bodyParser());

        app.set('view engine', 'ejs');

        var secret = require('./app/utils/security');
        app.use(express.session({
            secret: secret.randomString()
        }));

        app.use(passport.initialize());
        app.use(passport.session());
        app.use(flash());

    });

    require('./app/sockets-handler')(io, dbProvider, developmentMode);
    require('./app/routes')(app, passport, dbProvider, developmentMode);

    var serviceProvider = require('./app/providers/services-provider')(app, developmentMode);
    require('./app/services')(app, dbProvider, serviceProvider);

    server.listen(port);

    console.log('The magic happens on port ' + port);
}, developmentMode);
