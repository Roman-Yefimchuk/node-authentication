"use strict";

(function (require) {

    var RestApi = require('../../public/common-scripts/rest-api');
    var EmailVerificationService = require('../email-verification-service');

    module.exports = function (app) {

        app.get(RestApi.EMAIL_VERIFICATION, function (request, response) {

            var userAccount = request.user;
            if (userAccount && userAccount.isAuthenticated()) {

                var token = request.params['token'];
                var userId = userAccount.userId;

                var verificationSession = EmailVerificationService.getSession(token);
                if (verificationSession) {
                    if (verificationSession.userId == userId && verificationSession.token == token) {
                        if (verificationSession.isSessionExpired()) {
                            verificationSession.closeSession();
                            response.render('email-verification.ejs', {
                                status: 'SESSION_EXPIRED'
                            });
                        } else {
                            userAccount.update({
                                email: verificationSession.email
                            }, {
                                success: function (userAccount) {
                                    response.render('email-verification.ejs', {
                                        status: 'EMAIL_VERIFIED',
                                        userName: userAccount.displayName,
                                        email: userAccount.email
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