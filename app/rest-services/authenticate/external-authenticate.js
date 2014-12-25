"use strict";

module.exports = function (app, passport) {

    var ErrorCodes = require('../../../public/common-scripts/authenticate-error-codes');

    // facebook -------------------------------

    app.get('/sign-in/facebook', passport.authenticate('facebook', {
        scope: [
            'email'
        ]
    }));

    app.get('/sign-in/facebook/callback', function (request, response, next) {
        passport.authenticate('facebook', function (error, user, info) {

            if (error) {
                return next(error);
            }

            if (!user && info) {
                return response.redirect('#/login?error_code=' + ErrorCodes.USER_NOT_FOUND);
            } else {
                if (!user) {
                    return response.redirect('#/login');
                }
            }

            request.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                return response.redirect('#/home');
            });

        })(request, response, next);
    });

    // twitter --------------------------------

    app.get('/auth/twitter', function (request, response, next) {
        passport.authenticate('twitter', {
            scope: [
                'email'
            ]
        })(request, response, next);
    });

    app.get('/auth/twitter/callback', passport.authenticate('twitter'), function (request, response) {
        var user = request.user;
        if (user) {
            response.redirect('/#/home');
        } else {
            response.redirect('/');
        }
    });

    // google ---------------------------------

    app.get('/auth/google', function (request, response, next) {
        passport.authenticate('google', {
            scope: [
                'profile',
                'email'
            ]
        })(request, response, next);
    });

    app.get('/auth/google/callback', passport.authenticate('google'), function (request, response) {
        var user = request.user;
        if (user) {
            response.redirect('/#/home');
        } else {
            response.redirect('/');
        }
    });

    // linked-in ------------------------------

    app.get('/auth/linked-in', function (request, response, next) {
        passport.authenticate('linkedin', {
            scope: [
                'r_basicprofile',
                'r_emailaddress'
            ]
        })(request, response, next);
    });

    app.get('/auth/linked-in/callback', passport.authenticate('linkedin'), function (request, response) {
        var user = request.user;
        if (user) {
            response.redirect('/#/home');
        } else {
            response.redirect('/');
        }
    });

    // windows-live ---------------------------

    app.get('/auth/windows-live', function (request, response, next) {
        passport.authenticate('windowslive', {
            scope: [
                'wl.signin',
                'wl.basic'
            ]
        })(request, response, next);
    });

    app.get('/auth/windows-live/callback', passport.authenticate('windowslive'), function (request, response) {
        var user = request.user;
        if (user) {
            response.redirect('/#/home');
        } else {
            response.redirect('/');
        }
    });
};