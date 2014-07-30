var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var User = require('../app/models/user');

var configAuth = require('./auth');

var dbProvider = require('../app/db-provider');
var getUserContext = require('../app/context-provider')['getUserContext'];

module.exports = function (passport) {

    function addNewUser(user, done) {
        var userContext = getUserContext(user);

        var workspaceName = userContext.displayName + '[' + userContext.provider + ']';

        user.save(function (error, model) {

            if (error) {
                throw error;
            }

            var userId = userContext.userId;

            dbProvider.addWorkspace(workspaceName, userId, function (workspaceId) {
                dbProvider.setUserWorkspaceId(userId, workspaceId, function () {
                    done(null, user);
                })
            });
        });
    }

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (error, user) {
            done(error, user);
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

            User.findOne({
                'local.email': email
            }, function (error, user) {
                if (error) {
                    return done(error);
                }

                if (!user) {
                    return done(null, false, req.flash('loginMessage', 'No user found.'));
                }

                if (!user.validPassword(password)) {
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
                }
                else {
                    return done(null, user);
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

            User.findOne({
                'local.email': email
            }, function (error, existingUser) {

                if (error) {
                    return done(error);
                }

                if (existingUser) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                }

                if (req.user) {
                    var user = req.user;
                    user.local.email = email;
                    user.local.password = user.generateHash(password);

                    user.save(function (error) {
                        if (error) {
                            throw error;
                        }
                        return done(null, user);
                    });
                } else {
                    var newUser = new User();

                    newUser.local.email = email;
                    newUser.local.password = newUser.generateHash(password);

                    addNewUser(newUser, done);
                }
            });
        });
    }));

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({
        clientID: configAuth.facebookAuth.clientID,
        clientSecret: configAuth.facebookAuth.clientSecret,
        callbackURL: configAuth.facebookAuth.callbackURL,
        passReqToCallback: true
    }, function (req, token, refreshToken, profile, done) {

        process.nextTick(function () {

            if (!req.user) {

                User.findOne({
                    'facebook.id': profile.id
                }, function (error, user) {
                    if (error) {
                        return done(error);
                    }

                    if (user) {

                        if (!user.facebook.token) {
                            user.facebook.token = token;
                            user.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                            user.facebook.email = profile.emails[0].value;

                            user.save(function (error) {
                                if (error) {
                                    throw error;
                                }
                                return done(null, user);
                            });
                        }

                        return done(null, user);
                    } else {
                        var newUser = new User();

                        newUser.facebook.id = profile.id;
                        newUser.facebook.token = token;
                        newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                        newUser.facebook.email = profile.emails[0].value;

                        addNewUser(newUser, done);
                    }
                });

            } else {
                var user = req.user;

                user.facebook.id = profile.id;
                user.facebook.token = token;
                user.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                user.facebook.email = profile.emails[0].value;

                user.save(function (error) {
                    if (error) {
                        throw error;
                    }
                    return done(null, user);
                });
            }
        });
    }));

    // =========================================================================
    // TWITTER =================================================================
    // =========================================================================
    passport.use(new TwitterStrategy({
        consumerKey: configAuth.twitterAuth.consumerKey,
        consumerSecret: configAuth.twitterAuth.consumerSecret,
        callbackURL: configAuth.twitterAuth.callbackURL,
        passReqToCallback: true
    }, function (req, token, tokenSecret, profile, done) {

        process.nextTick(function () {

            if (!req.user) {

                User.findOne({
                    'twitter.id': profile.id
                }, function (error, user) {
                    if (error) {
                        return done(error);
                    }

                    if (user) {
                        if (!user.twitter.token) {
                            user.twitter.token = token;
                            user.twitter.username = profile.username;
                            user.twitter.displayName = profile.displayName;

                            user.save(function (error) {
                                if (error) {
                                    throw error;
                                }
                                return done(null, user);
                            });
                        }

                        return done(null, user);
                    } else {
                        var newUser = new User();

                        newUser.twitter.id = profile.id;
                        newUser.twitter.token = token;
                        newUser.twitter.username = profile.username;
                        newUser.twitter.displayName = profile.displayName;

                        addNewUser(newUser, done);
                    }
                });

            } else {
                var user = req.user;

                user.twitter.id = profile.id;
                user.twitter.token = token;
                user.twitter.username = profile.username;
                user.twitter.displayName = profile.displayName;

                user.save(function (error) {
                    if (error) {
                        throw error;
                    }
                    return done(null, user);
                });
            }
        });
    }));

    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({
        clientID: configAuth.googleAuth.clientID,
        clientSecret: configAuth.googleAuth.clientSecret,
        callbackURL: configAuth.googleAuth.callbackURL,
        passReqToCallback: true
    }, function (req, token, refreshToken, profile, done) {

        process.nextTick(function () {

            if (!req.user) {

                User.findOne({
                    'google.id': profile.id
                }, function (error, user) {
                    if (error) {
                        return done(error);
                    }

                    if (user) {
                        if (!user.google.token) {
                            user.google.token = token;
                            user.google.name = profile.displayName;
                            user.google.email = profile.emails[0].value;

                            user.save(function (error) {
                                if (error) {
                                    throw error;
                                }
                                return done(null, user);
                            });
                        }

                        return done(null, user);
                    } else {
                        var newUser = new User();

                        newUser.google.id = profile.id;
                        newUser.google.token = token;
                        newUser.google.name = profile.displayName;
                        newUser.google.email = profile.emails[0].value;

                        addNewUser(newUser, done);
                    }
                });

            } else {
                var user = req.user;

                user.google.id = profile.id;
                user.google.token = token;
                user.google.name = profile.displayName;
                user.google.email = profile.emails[0].value;

                user.save(function (error) {
                    if (error) {
                        throw error;
                    }
                    return done(null, user);
                });
            }
        });
    }));
};
