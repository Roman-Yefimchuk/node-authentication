"use strict";

module.exports = function (app, passport, dbProvider, developmentMode) {

    var _ = require('underscore');

    app.get('/', function (req, res) {
        res.render('index.ejs');
    });

    app.get('/todo', function (req, res) {
        var userAccount = req.user;
        if (userAccount && userAccount.isAuthenticated()) {

            var userId = userAccount.userId;

            if (developmentMode) {
                console.log('render index page for user: ' + userId);
            }

            var renderHomePage = function (workspaceId, defaultWorkspaceId, externalNotification) {
                res.render('home.ejs', {
                    userId: userId,
                    displayName: userAccount.displayName,
                    authorizationProvider: userAccount.authorizationProvider,
                    workspaceId: workspaceId,
                    defaultWorkspaceId: defaultWorkspaceId,
                    externalNotification: externalNotification
                });
            };

            var checkWorkspace = function (workspaceId) {
                dbProvider.isAccessGrantedForWorkspace(userId, workspaceId, function (isAccessGranted) {
                    dbProvider.getDefaultWorkspaceId(userId, function (defaultWorkspaceId) {
                        if (isAccessGranted) {
                            renderHomePage(workspaceId, defaultWorkspaceId);
                        } else {
                            dbProvider.getWorkspace(workspaceId, function (workspace) {
                                renderHomePage(defaultWorkspaceId, defaultWorkspaceId, {
                                    type: 'warning',
                                    message: 'Access to workspace ' + workspace.name + ' closed'
                                });
                            });
                        }
                    });
                });
            };

            var workspaceId = req.flash('workspaceId');
            if (workspaceId && workspaceId.length > 0) {
                workspaceId = workspaceId[0];
                checkWorkspace(workspaceId);
            } else {
                dbProvider.getUserWorkspaceId(userId, function (workspaceId) {
                    checkWorkspace(workspaceId);
                });
            }
        } else {
            res.redirect('/');
        }
    });

    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    // locally --------------------------------

    // LOGIN ===============================

    app.get('/login', function (req, res) {
        res.render('login.ejs', {
            message: req.flash('loginMessage')
        });
    });

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/todo',
        failureRedirect: '/login',
        failureFlash: true
    }));

    // SIGNUP =================================

    app.get('/signup', function (req, res) {
        res.render('sign-up.ejs', {
            message: req.flash('signupMessage')
        });
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/todo',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    // facebook -------------------------------

    app.get('/auth/facebook', passport.authenticate('facebook', {
        scope: 'email'
    }));

    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/todo',
        failureRedirect: '/'
    }));

    // twitter --------------------------------

    app.get('/auth/twitter', passport.authenticate('twitter', {
        scope: 'email'
    }));

    app.get('/auth/twitter/callback', passport.authenticate('twitter', {
        successRedirect: '/todo',
        failureRedirect: '/'
    }));

    // google ---------------------------------

    app.get('/auth/google', passport.authenticate('google', {
        scope: [
            'profile',
            'email'
        ]
    }));

    app.get('/auth/google/callback', passport.authenticate('google', {
        successRedirect: '/todo',
        failureRedirect: '/'
    }));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
    app.get('/connect/local', function (req, res) {
        res.render('connect-local.ejs', {
            message: req.flash('loginMessage')
        });
    });

    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect: '/todo',
        failureRedirect: '/connect/local',
        failureFlash: true
    }));

    // facebook -------------------------------

    app.get('/connect/facebook', passport.authorize('facebook', {
        scope: 'email'
    }));

    app.get('/connect/facebook/callback', passport.authorize('facebook', {
        successRedirect: '/todo',
        failureRedirect: '/'
    }));

    // twitter --------------------------------

    app.get('/connect/twitter', passport.authorize('twitter', {
        scope: 'email'
    }));

    app.get('/connect/twitter/callback', passport.authorize('twitter', {
        successRedirect: '/todo',
        failureRedirect: '/'
    }));

    // google ---------------------------------

    app.get('/connect/google', passport.authorize('google', {
        scope: [
            'profile',
            'email'
        ]
    }));

    app.get('/connect/google/callback', passport.authorize('google', {
        successRedirect: '/todo',
        failureRedirect: '/'
    }));
};