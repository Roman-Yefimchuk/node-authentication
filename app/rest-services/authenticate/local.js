"use strict";

(function (require) {

    module.exports = function (app, passport, profileProvider, dbProvider) {

        var LocalStrategy = require('passport-local').Strategy;
        var AuthenticateException = require('../../authenticate-exception');
        var AuthenticateErrorCode = require('../../../public/common-scripts/authenticate-error-codes');
        var SecurityUtils = require('../../utils/security-utils');
        var RestApi = require('../../../public/common-scripts/rest-api');
        var JSON = require('json3');

        function send(response, data) {
            process.nextTick(function () {
                var json = JSON.stringify(data);
                response.send(json);
            });
        }

        (function signIn() {

            passport.use('sign-in[local]', new LocalStrategy({
                usernameField: 'email',
                passwordField: 'password',
                passReqToCallback: true
            }, function (request, email, password, done) {
                profileProvider.signIn(email, {
                    success: function (user) {
                        if (user) {
                            if (SecurityUtils.validPassword(user.password, password)) {
                                return done(null, user);
                            } else {
                                var error = new AuthenticateException(AuthenticateErrorCode.INVALID_PASSWORD);
                                return done(null, null, error);
                            }
                        } else {
                            var error = new AuthenticateException(AuthenticateErrorCode.USER_NOT_FOUND);
                            return done(null, null, error);
                        }
                    },
                    failure: function (error) {
                        if (error instanceof AuthenticateException) {
                            done(null, null, error);
                        } else {
                            done(error);
                        }
                    }
                });
            }));

            app.post(RestApi.SIGN_IN, function (request, response, next) {
                passport.authenticate('sign-in[local]', function (error, user, info) {

                    if (info instanceof AuthenticateException) {
                        send(response, {
                            status: false,
                            error: {
                                authenticateErrorCode: info.authenticateErrorCode
                            }
                        });
                    } else {

                        if (error) {
                            next(error);
                        }

                        if (request.isAuthenticated()) {
                            request.logout();
                        }

                        request.login(user, function (error) {

                            if (error) {
                                next(error);
                            } else {

                                var workspaceId = request.body['workspaceId'];
                                var rootWorkspaceId = request.body['rootWorkspaceId'];

                                dbProvider.setUserWorkspaceId(user.userId, workspaceId, rootWorkspaceId, function () {
                                    send(response, {
                                        status: true
                                    });
                                });
                            }

                        });

                    }

                })(request, response, next);
            });

        })();

        (function signUp() {

            passport.use('sign-up[local]', new LocalStrategy({
                usernameField: 'email',
                passwordField: 'password',
                passReqToCallback: true
            }, function (request, email, password, done) {
                profileProvider.signUp({
                    profile: {
                        genericId: email,
                        displayName: request.body['name'],
                        password: SecurityUtils.generateHash(password),
                        email: email,
                        token: SecurityUtils.randomString(),
                        authorizationProvider: 'local'
                    },
                    name: 'local'
                }, {
                    success: function (user) {
                        done(null, user);
                    },
                    failure: function (error) {
                        if (error instanceof AuthenticateException) {
                            done(null, null, error);
                        } else {
                            done(error);
                        }
                    }
                });
            }));

            app.post(RestApi.SIGN_UP, function (request, response, next) {
                passport.authenticate('sign-up[local]', function (error, user, info) {

                    if (info instanceof AuthenticateException) {
                        send(response, {
                            status: false,
                            error: {
                                authenticateErrorCode: info.authenticateErrorCode
                            }
                        });
                    } else {

                        if (error) {
                            next(error);
                        }

                        if (request.isAuthenticated()) {
                            request.logout();
                        }

                        request.login(user, function (error) {

                            if (error) {
                                next(error);
                            } else {
                                send(response, {
                                    status: true
                                });
                            }

                        });

                    }

                })(request, response, next);
            });

        })();

    };

})(require);