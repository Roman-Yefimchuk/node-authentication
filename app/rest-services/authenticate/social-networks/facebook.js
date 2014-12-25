"use strict";

//https://developers.facebook.com/apps/

module.exports = function (app, passport, profileProvider) {

    var CLIENT_ID = '825915494093970';
    var CLIENT_SECRET = 'b1bef1cb2cfa573b9752f0c94bb2b6c8';

    var FacebookStrategy = require('passport-facebook').Strategy;
    var AuthenticateException = require('../../../authenticate-exception');
    var SignIn = require('../social-networks/handlers/sign-in');
    var SignUp = require('../social-networks/handlers/sign-up');

    (function signIn() {

        passport.use('sign-in[facebook]', new FacebookStrategy({
            clientID: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            callbackURL: "/sign-in/facebook/callback?state=sign_in",
            passReqToCallback: true
        }, function (request, token, refreshToken, profile, done) {
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

        app.get('/sign-in/facebook', passport.authenticate('sign-in[facebook]', {
            scope: [
                'email'
            ]
        }));

        app.get('/sign-in/facebook/callback', function (request, response, next) {
            var handler = SignIn.getHandler(request, response, next);
            passport.authenticate('sign-in[facebook]', handler)(request, response, next);
        });

    })();

    (function signUp() {

        passport.use('sign-up[facebook]', new FacebookStrategy({
            clientID: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            callbackURL: "/sign-up/facebook/callback?state=sign_up",
            passReqToCallback: true
        }, function (request, token, refreshToken, profile, done) {
            profileProvider.signUp({
                profile: {
                    genericId: profile.id,
                    displayName: profile.name['givenName'] + ' ' + profile.name['familyName'],
                    email: profile.emails[0].value,
                    token: token
                },
                name: 'facebook'
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

        app.get('/sign-up/facebook', passport.authenticate('sign-up[facebook]', {
            scope: [
                'email'
            ]
        }));

        app.get('/sign-up/facebook/callback', function (request, response, next) {
            var handler = SignUp.getHandler(request, response, next);
            passport.authenticate('sign-up[facebook]', handler)(request, response, next);
        });

    })();
};