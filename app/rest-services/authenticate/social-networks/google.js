"use strict";

//https://code.google.com/apis/console

module.exports = function (app, passport, profileProvider) {

    var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
    var AuthenticateException = require('../../../authenticate-exception');
    var SignIn = require('../social-networks/handlers/sign-in');
    var SignUp = require('../social-networks/handlers/sign-up');

    (function signIn() {

        var CLIENT_ID = '135678940215-kiaviing77f181jhim8o6e2mij810qde.apps.googleusercontent.com';
        var CLIENT_SECRET = 'oE5mjmRrWPC1LBfa1fyo50VD';

        passport.use('sign-in[google]', new GoogleStrategy({
            clientID: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            callbackURL: "/sign-in/google/callback?state=sign_in",
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

        app.get('/sign-in/google', passport.authenticate('sign-in[google]', {
            scope: [
                'profile',
                'email'
            ]
        }));

        app.get('/sign-in/google/callback', function (request, response, next) {
            var handler = SignIn.getHandler(request, response, next);
            passport.authenticate('sign-in[google]', handler)(request, response, next);
        });

    })();

    (function signUp() {

        var CLIENT_ID = '259777870934-nkaflmvvnv55g1ekljath5i5e194j9n9.apps.googleusercontent.com';
        var CLIENT_SECRET = 'mbztJzGt4fPCB6CqIR1_Q33O';

        passport.use('sign-up[google]', new GoogleStrategy({
            clientID: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            callbackURL: "/sign-up/google/callback?state=sign_up",
            passReqToCallback: true
        }, function (request, token, refreshToken, profile, done) {
            profileProvider.signUp({
                profile: {
                    genericId: profile.id,
                    displayName: profile.displayName,
                    token: token,
                    email: profile._json['email'],
                    gender: profile._json['gender'] || null,
                    avatarUrl: profile._json['picture'] || null
                },
                name: 'google'
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

        app.get('/sign-up/google', passport.authenticate('sign-up[google]', {
            scope: [
                'profile',
                'email'
            ]
        }));

        app.get('/sign-up/google/callback', function (request, response, next) {
            var handler = SignUp.getHandler(request, response, next);
            passport.authenticate('sign-up[google]', handler)(request, response, next);
        });

    })();
};