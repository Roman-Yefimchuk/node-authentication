"use strict";

//https://apps.twitter.com/

module.exports = function (app, passport, profileProvider) {

    var TwitterStrategy = require('passport-twitter').Strategy;
    var AuthenticateException = require('../../../authenticate-exception');
    var SignIn = require('../social-networks/handlers/sign-in');
    var SignUp = require('../social-networks/handlers/sign-up');

    (function signIn() {

        var CONSUMER_KEY = 'mCGwDGUw5KlrjaAgprKnOEfvy';
        var CONSUMER_SECRET = '1wtDNybALAgAX43OVkLzMHlv2LSJdMk7wV4QsiT5qqnFCMOXrA';

        passport.use('sign-in[twitter]', new TwitterStrategy({
            consumerKey: CONSUMER_KEY,
            consumerSecret: CONSUMER_SECRET,
            callbackURL: "/sign-in/twitter/callback?state=sign_in",
            passReqToCallback: true
        }, function (request, token, tokenSecret, profile, done) {
            profileProvider.signIn(profile.id, {
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

        app.get('/sign-in/twitter', passport.authenticate('sign-in[twitter]', {
            scope: [
                'email'
            ]
        }));

        app.get('/sign-in/twitter/callback', function (request, response, next) {
            var handler = SignIn.getHandler(request, response, next);
            passport.authenticate('sign-in[twitter]', handler)(request, response, next);
        });

    })();

    (function signUp() {

        var CONSUMER_KEY = '9hf7qs4eBiIBBXsqNazqRMiQb';
        var CONSUMER_SECRET = 'rewXmEyIewWU4BSykBfvkgp0HhBwrYoHOtZgDou7qDJF0OxMx1';

        passport.use('sign-up[twitter]', new TwitterStrategy({
            consumerKey: CONSUMER_KEY,
            consumerSecret: CONSUMER_SECRET,
            callbackURL: "/sign-up/twitter/callback?state=sign_up",
            passReqToCallback: true
        }, function (request, token, tokenSecret, profile, done) {
            profileProvider.signUp({
                profile: {
                    genericId: profile.id,
                    displayName: profile.displayName,
                    token: token
                },
                name: 'twitter'
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

        app.get('/sign-up/twitter', passport.authenticate('sign-up[twitter]', {
            scope: [
                'email'
            ]
        }));

        app.get('/sign-up/twitter/callback', function (request, response, next) {
            var handler = SignUp.getHandler(request, response, next);
            passport.authenticate('sign-up[twitter]', handler)(request, response, next);
        });

    })();
};