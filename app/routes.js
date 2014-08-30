"use strict";

module.exports = function (app, passport, dbProvider, developmentMode) {

    var _ = require('underscore');

    require('../app/client')(app, developmentMode);

    // locally --------------------------------

    // LOGIN ===============================

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/#/home',
        failureRedirect: '/login',
        failureFlash: true
    }));

    // SIGNUP =================================

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/#/home',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    // facebook -------------------------------

    app.get('/auth/facebook', passport.authenticate('facebook', {
        scope: [
            'email'
        ]
    }));

    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/#/home',
        failureRedirect: '/'
    }));

    // twitter --------------------------------

    app.get('/auth/twitter', passport.authenticate('twitter', {
        scope: [
            'email'
        ]
    }));

    app.get('/auth/twitter/callback', passport.authenticate('twitter', {
        successRedirect: '/#/home',
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
        successRedirect: '/#/home',
        failureRedirect: '/'
    }));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------

    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect: '/#/home',
        failureRedirect: '/connect/local',
        failureFlash: true
    }));

    // facebook -------------------------------

    app.get('/connect/facebook', passport.authorize('facebook', {
        scope: [
            'email'
        ]
    }));

    app.get('/connect/facebook/callback', passport.authorize('facebook', {
        successRedirect: '/#/home',
        failureRedirect: '/'
    }));

    // twitter --------------------------------

    app.get('/connect/twitter', passport.authorize('twitter', {
        scope: [
            'email'
        ]
    }));

    app.get('/connect/twitter/callback', passport.authorize('twitter', {
        successRedirect: '/#/home',
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
        successRedirect: '/#/home',
        failureRedirect: '/'
    }));
};