"use strict";

(function (require) {

    var express = require('express');
    var app = express();
    var server = require('http').Server(app);
    var io = require('socket.io')(server);
    var passport = require('passport');
    var flash = require('connect-flash');

    var port = 8080;

    var Exception = require('./app/exception');

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

        require('./app/providers/authenticate-provider')(passport, dbProvider);

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

            {
                app.use(app.router);

                var path = require('path');
                var staticPath = express.static(__dirname + '/public');
                app.use('/public', staticPath);

                var acceptTypeDetector = function (request, handler) {
                    var accepted = request.accepted;
                    if (accepted.some(function (type) {
                        return type.value == 'text/html';
                    })) {
                        handler.html();
                    } else {
                        if (accepted.some(function (type) {
                            return type.value == 'application/json';
                        })) {
                            handler.json();
                        } else {
                            handler.unknown();
                        }
                    }
                };

                app.use(function (request, response, next) {
                    response.status(404);

                    var url = decodeURIComponent(request.url);

                    acceptTypeDetector(request, {
                        html: function () {
                            response.render('page-not-found.ejs', {
                                requestUrl: url
                            });
                        },
                        json: function () {
                            response.send({
                                status: false,
                                error: {
                                    status: Exception.PAGE_NOT_FOUND,
                                    message: 'Page ' + url + ' not found'
                                }
                            });
                        },
                        unknown: function () {
                            response = response.type('txt');
                            response.send('Page ' + url + ' not found');
                        }
                    });
                });

                app.use(function (error, request, response, next) {
                    response.status(error.status || 500);

                    function extractErrorMessage(error) {
                        return error.message || error;
                    }

                    acceptTypeDetector(request, {
                        html: function () {
                            response.render('internal-server-error.ejs', {
                                error: extractErrorMessage(error)
                            });
                        },
                        json: function () {
                            response.send({
                                status: false,
                                error: {
                                    status: Exception.INTERNAL_SERVER_ERROR,
                                    message: extractErrorMessage(error)
                                }
                            });
                        },
                        unknown: function () {
                            var message = extractErrorMessage(error);
                            response = response.type('txt');
                            response.send(message);
                        }
                    });
                });
            }
        });

        require('./app/sockets-handler')(io, dbProvider);

        require('./app/authenticate/local-authenticate')(app, passport, dbProvider);
        require('./app/authenticate/external-authenticate')(app, passport);

        var serviceProvider = require('./app/providers/services-provider')(app);
        require('./app/services')(app, dbProvider, serviceProvider);
        require('./app/session-manager')(app, dbProvider, serviceProvider);

        require('./app/client')(app, developmentMode);

        server.listen(port);

        console.log('The magic happens on port ' + port);

    }, developmentMode);

})(require);