"use strict";

(function (require) {

    var LocalStrategy = require('passport-local').Strategy;
    var FacebookStrategy = require('passport-facebook').Strategy;
    var TwitterStrategy = require('passport-twitter').Strategy;
    var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
    var LinkedInStrategy = require('passport-linkedin').Strategy;
    var WindowsLiveStrategy = require('passport-windowslive').Strategy;

    var _ = require('underscore');

    var SecurityUtils = require('../utils/security-utils');
    var AuthorizationConfig = require('./../../config/authorization-config');
    var Exception = require('../exception');

    module.exports = function (passport, dbProvider) {

        passport.serializeUser(function (userProfile, done) {
            done(null, userProfile.genericId);
        });

        passport.deserializeUser(function (genericId, done) {
            dbProvider.findUser(genericId, {
                success: function (userProfile) {
                    done(null, userProfile);
                },
                failure: function (error) {
                    done(error);
                }
            });
        });

        // =========================================================================
        // LOCAL LOGIN =============================================================
        // =========================================================================

        passport.use('local-login', new LocalStrategy(AuthorizationConfig.local,
            function (request, email, password, done) {

                process.nextTick(function () {

                    dbProvider.findUser(email, {
                        success: function (userProfile) {
                            if (userProfile) {
                                if (SecurityUtils.validPassword(userProfile.password, password)) {
                                    return done(null, userProfile);
                                } else {
                                    var error = new Exception(Exception.INVALID_PASSWORD, 'Oops! Wrong password.');
                                    return done(null, null, error);
                                }
                            } else {
                                var error = new Exception(Exception.USER_NOT_FOUND, 'No user found.');
                                return done(null, null, error);
                            }
                        },
                        failure: function (error) {
                            error = new Exception(Exception.UNHANDLED_EXCEPTION, "Can't find user.", error);
                            done(null, null, error);
                        }
                    });
                });
            }));

        // =========================================================================
        // LOCAL SIGNUP ============================================================
        // =========================================================================

        passport.use('local-sign-up', new LocalStrategy(AuthorizationConfig.local,
            function (request, email, password, done) {

                process.nextTick(function () {

                    function generateToken() {
                        return SecurityUtils.randomString();
                    }

                    dbProvider.findUser(email, {
                        success: function (userProfile) {

                            if (userProfile) {
                                var error = new Exception(Exception.EMAIL_ALREADY_EXIST, 'That email is already taken.');
                                return done(null, null, error);
                            }

                            if (request.user) {
                                userProfile = request.user;
                                userProfile.update({
                                    displayName: request.body['name'],
                                    email: email,
                                    password: SecurityUtils.generateHash(password),
                                    token: generateToken()
                                }, {
                                    success: function (userProfile) {
                                        done(null, userProfile);
                                    },
                                    failure: function (error) {
                                        error = new Exception(Exception.UNHANDLED_EXCEPTION, "Can't update user.");
                                        done(null, null, error);
                                    }
                                });
                            } else {
                                dbProvider.createUser({
                                    genericId: email,
                                    displayName: request.body['name'],
                                    password: SecurityUtils.generateHash(password),
                                    email: email,
                                    token: generateToken(),
                                    authorizationProvider: 'local',
                                    registeredDate: _.now()
                                }, false, {
                                    success: function (userProfile) {
                                        done(null, userProfile);
                                    },
                                    failure: function (error) {
                                        error = new Exception(Exception.UNHANDLED_EXCEPTION, "Can't create user.");
                                        done(null, null, error);
                                    }
                                });
                            }
                        },
                        failure: function (error) {
                            error = new Exception(Exception.UNHANDLED_EXCEPTION, "Can't find user.", error);
                            done(null, null, error);
                        }
                    });
                });
            }));

        function externalAuthorization(userProfile, provider, done) {
            process.nextTick(function () {
                if (userProfile) {
                    userProfile.update({
                        genericId: provider.genericId,
                        token: provider.token,
                        displayName: provider.displayName,
                        email: provider.email
                    }, {
                        success: function (userProfile) {
                            done(null, userProfile);
                        },
                        failure: function (error) {
                            done(error);
                        }
                    });
                } else {
                    dbProvider.findUser(provider.genericId, {
                        success: function (userProfile) {
                            if (userProfile) {
                                if (userProfile.isAuthenticated()) {
                                    done(null, userProfile);
                                } else {
                                    userProfile.update({
                                        token: provider.token,
                                        displayName: provider.displayName,
                                        email: provider.email
                                    }, {
                                        success: function (userProfile) {
                                            done(null, userProfile);
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
                                    registeredDate: _.now()
                                }, !!provider.email, {
                                    success: function (userProfile) {
                                        done(null, userProfile);
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

        passport.use(new FacebookStrategy(AuthorizationConfig.facebook,
            function (request, token, refreshToken, profile, done) {

                var name = profile.name;

                externalAuthorization(request.user, {
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

        passport.use(new TwitterStrategy(AuthorizationConfig.twitter,
            function (request, token, tokenSecret, profile, done) {
                externalAuthorization(request.user, {
                    genericId: profile.id,
                    displayName: profile.displayName,
                    token: token,
                    name: 'twitter'
                }, done);
            }));

        // =========================================================================
        // GOOGLE ==================================================================
        // =========================================================================

        passport.use(new GoogleStrategy(AuthorizationConfig.google,
            function (request, token, refreshToken, profile, done) {
                externalAuthorization(request.user, {
                    genericId: profile.id,
                    displayName: profile.displayName,
                    token: token,
                    email: profile._json['email'],
                    name: 'google',
                    gender: profile._json['gender'] || null,
                    avatarUrl: profile._json['picture'] || null
                }, done);
            }));

        // =========================================================================
        // LINKED_IN ===============================================================
        // =========================================================================

        passport.use(new LinkedInStrategy(AuthorizationConfig.linkedIn,
            function (request, token, tokenSecret, profile, done) {
                externalAuthorization(request.user, {
                    genericId: profile.id,
                    displayName: profile.displayName,
                    token: token,
                    email: profile._json['email'],
                    name: 'linked-in',
                    gender: profile._json['gender'] || null,
                    avatarUrl: profile._json['picture'] || null
                }, done);
            }));

        // =========================================================================
        // WINDOWS_LIVE ============================================================
        // =========================================================================

        passport.use(new WindowsLiveStrategy(AuthorizationConfig.windowsLive,
            function (request, token, refreshToken, profile, done) {
                externalAuthorization(request.user, {
                    genericId: profile.id,
                    displayName: profile.displayName,
                    token: token,
                    email: profile._json['email'],
                    name: 'windows-live',
                    gender: profile._json['gender'] || null,
                    avatarUrl: profile._json['picture'] || null
                }, done);
            }));
    };
})(require);