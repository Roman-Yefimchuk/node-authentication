var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var security = require('../utils/security');
var authorizationConfig = require('./../../config/authorization-config');

module.exports = function (passport, dbProvider) {

    passport.serializeUser(function (userAccount, done) {
        done(null, userAccount.genericId);
    });

    passport.deserializeUser(function (genericId, done) {
        dbProvider.findUser(genericId, {
            success: function (userAccount) {
                done(null, userAccount);
            },
            failure: function (error) {
                done(error);
            }
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================

    passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, function (req, email, password, done) {

        process.nextTick(function () {

            dbProvider.findUser(email, {
                success: function (userAccount) {
                    if (userAccount) {
                        if (security.validPassword(userAccount, password)) {
                            return done(null, userAccount, req.flash('workspaceId', req.body['workspaceId']));
                        } else {
                            return done(null, null, req.flash('loginMessage', 'Oops! Wrong password.'));
                        }
                    } else {
                        return done(null, null, req.flash('loginMessage', 'No user found.'));
                    }
                },
                failure: function (error) {
                    done(error);
                }
            });
        });
    }));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, function (req, email, password, done) {

        process.nextTick(function () {

            function generateToken() {
                var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
                var length = 64;

                var str = '';
                for (var index = 0; index < length; index++) {
                    str += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return str;
            }

            dbProvider.findUser(email, {
                success: function (userAccount) {
                    if (userAccount) {
                        return done(null, null, req.flash('signupMessage', 'That email is already taken.'));
                    }

                    if (req.user) {
                        userAccount = req.user;
                        userAccount.update({
                            displayName: req.body['name'],
                            email: email,
                            password: security.generateHash(password),
                            token: generateToken()
                        }, {
                            success: function (userAccount) {
                                done(null, userAccount);
                            },
                            failure: function (error) {
                                done(error);
                            }
                        });
                    } else {
                        dbProvider.createUser({
                            genericId: email,
                            displayName: req.body['name'],
                            password: security.generateHash(password),
                            email: email,
                            token: generateToken(),
                            authorizationProvider: 'local',
                            registeredDate: Date.now()
                        }, {
                            success: function (userAccount) {
                                done(null, userAccount);
                            },
                            failure: function (error) {
                                done(error);
                            }
                        });
                    }
                },
                failure: function (error) {
                    done(error);
                }
            });
        });
    }));

    function externalAuthorization(userAccount, provider, done) {
        process.nextTick(function () {
            if (userAccount) {
                userAccount.update({
                    genericId: provider.genericId,
                    token: provider.token,
                    displayName: provider.displayName,
                    email: provider.email
                }, {
                    success: function (userAccount) {
                        done(null, userAccount);
                    },
                    failure: function (error) {
                        done(error);
                    }
                });
            } else {
                dbProvider.findUser(provider.genericId, {
                    success: function (userAccount) {
                        if (userAccount) {
                            if (userAccount.isAuthenticated()) {
                                done(null, userAccount);
                            } else {
                                userAccount.update({
                                    token: provider.token,
                                    displayName: provider.displayName,
                                    email: provider.email
                                }, {
                                    success: function (userAccount) {
                                        done(null, userAccount);
                                    },
                                    failure: function (error) {
                                        done(error);
                                    }
                                });
                            }
                        } else {
                            dbProvider.createUser({
                                genericId: provider.genericId,
                                displayName: provider.displayName,
                                password: undefined,
                                email: provider.email,
                                token: provider.token,
                                authorizationProvider: provider.name,
                                registeredDate: Date.now()
                            }, {
                                success: function (userAccount) {
                                    done(null, userAccount);
                                },
                                failure: function (error) {
                                    done(error);
                                }
                            });
                        }
                    },
                    failure: function (error) {
                        done(error);
                    }
                })
            }
        });
    }

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================

    passport.use(new FacebookStrategy({
        clientID: authorizationConfig.facebookAuth.clientID,
        clientSecret: authorizationConfig.facebookAuth.clientSecret,
        callbackURL: authorizationConfig.facebookAuth.callbackURL,
        passReqToCallback: true
    }, function (req, token, refreshToken, profile, done) {

        var name = profile.name;

        externalAuthorization(req.user, {
            genericId: profile.id,
            displayName: name.givenName + ' ' + name.familyName,
            email: profile.emails[0].value,
            token: token,
            name: 'facebook'
        }, done);
    }));

    // =========================================================================
    // TWITTER =================================================================
    // =========================================================================

    passport.use(new TwitterStrategy({
        consumerKey: authorizationConfig.twitterAuth.consumerKey,
        consumerSecret: authorizationConfig.twitterAuth.consumerSecret,
        callbackURL: authorizationConfig.twitterAuth.callbackURL,
        passReqToCallback: true
    }, function (req, token, tokenSecret, profile, done) {
        externalAuthorization(req.user, {
            genericId: profile.id,
            displayName: profile.displayName,
            token: token,
            name: 'twitter'
        }, done);
    }));

    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================

    passport.use(new GoogleStrategy({
        clientID: authorizationConfig.googleAuth.clientID,
        clientSecret: authorizationConfig.googleAuth.clientSecret,
        callbackURL: authorizationConfig.googleAuth.callbackURL,
        passReqToCallback: true
    }, function (req, token, refreshToken, profile, done) {
        externalAuthorization(req.user, {
            genericId: profile.id,
            displayName: profile.displayName,
            token: token,
            email: profile.emails[0].value,
            name: 'google'
        }, done);
    }));
};
