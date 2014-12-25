"use strict";

(function (require) {

    var Exception = require('../exception');
    var RestApi = require('../../public/common-scripts/rest-api');
    var EmailVerificationService = require('../email-verification-service');
    var EmailTransporter = require('../email-transporter');

    module.exports = function (app, dbProvider, serviceProvider) {

        serviceProvider.post(RestApi.VERIFY_EMAIL, function (request, response, resultCallback) {

            if (request.isAuthenticated()) {

                var user = request.user;
                var userId = user.userId;
                var email = request.body['email'];

                var token = (function () {
                    var verificationSession = EmailVerificationService.createSession(userId, email);
                    return verificationSession.token;
                })();

                EmailTransporter.sendEmailVerification({
                    userId: userId,
                    displayName: user.displayName
                }, email, token, {
                    success: function () {
                        resultCallback({
                            data: {
                                token: token
                            }
                        });
                    },
                    failure: function (error) {
                        throw new Exception(Exception.UNHANDLED_EXCEPTION, "Can't verify email", error);
                    }
                });

            } else {
                throw new Exception(Exception.NOT_AUTHENTICATED, 'You are not authenticated');
            }
        });

        serviceProvider.post(RestApi.ATTACH_EMAIL, function (request, response, resultCallback) {

            if (request.isAuthenticated()) {

                var user = request.user;
                var userId = user.userId;
                var email = request.body['email'];

                dbProvider.attachEmail(userId, email, {
                    success: function () {

                        var token = (function () {
                            var verificationSession = EmailVerificationService.createSession(userId, email);
                            return verificationSession.token;
                        })();

                        EmailTransporter.sendEmailVerification({
                            userId: userId,
                            displayName: user.displayName
                        }, email, token, {
                            success: function () {
                                resultCallback({
                                    data: {
                                        token: token
                                    }
                                });
                            },
                            failure: function (error) {
                                throw new Exception(Exception.UNHANDLED_EXCEPTION, "Can't verify email", error);
                            }
                        });
                    },
                    failure: function (error) {
                        throw new Exception(Exception.UNHANDLED_EXCEPTION, "Can't attach email", error);
                    }
                });

            } else {
                throw new Exception(Exception.NOT_AUTHENTICATED, 'You are not authenticated');
            }
        });

        app.get(RestApi.EMAIL_VERIFICATION, function (request, response) {

            if (request.isAuthenticated()) {

                var user = request.user;
                var token = request.params['token'];
                var userId = user.userId;

                var verificationSession = EmailVerificationService.getSession(token);
                if (verificationSession) {
                    if (verificationSession.userId == userId && verificationSession.token == token) {
                        if (verificationSession.isSessionExpired()) {
                            verificationSession.closeSession();
                            response.render('email-verification.ejs', {
                                status: 'SESSION_EXPIRED'
                            });
                        } else {
                            dbProvider.verifyEmail(userId, {
                                success: function () {
                                    verificationSession.closeSession();
                                    response.render('email-verification.ejs', {
                                        status: 'EMAIL_VERIFIED',
                                        userName: user.displayName,
                                        email: user.email
                                    });
                                },
                                failure: function () {
                                    response.render('email-verification.ejs', {
                                        status: 'INTERNAL_SERVER_ERROR'
                                    });
                                }
                            });
                        }
                    } else {
                        response.render('email-verification.ejs', {
                            status: 'INVALID_TOKEN'
                        });
                    }
                } else {
                    response.render('email-verification.ejs', {
                        status: 'SESSION_NOT_FOUND'
                    });
                }

            } else {
                response.render('email-verification.ejs', {
                    status: 'NOT_AUTHENTICATED'
                });
            }
        });
    };

})(require);