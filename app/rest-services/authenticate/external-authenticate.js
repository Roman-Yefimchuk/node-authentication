"use strict";

module.exports = function (app, passport) {

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

    // linked-in ------------------------------

    app.get('/auth/linked-in', passport.authenticate('linkedin', {
        scope: [
            'r_basicprofile',
            'r_emailaddress'
        ]
    }));

    app.get('/auth/linked-in/callback', passport.authenticate('linkedin', {
        successRedirect: '/#/home',
        failureRedirect: '/'
    }));

    // windows-live ---------------------------

    app.get('/auth/windows-live', passport.authenticate('windowslive', {
        scope: [
            'wl.signin',
            'wl.basic'
        ]
    }));

    app.get('/auth/windows-live/callback', passport.authenticate('windowslive', {
        successRedirect: '/#/home',
        failureRedirect: '/'
    }));

    // =============================================================================
    // AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
    // =============================================================================

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

    // linked-in ------------------------------

    app.get('/connect/linked-in', passport.authorize('linkedin', {
        scope: [
            'r_basicprofile',
            'r_emailaddress'
        ]
    }));

    app.get('/connect/linked-in/callback', passport.authorize('linkedin', {
        successRedirect: '/#/home',
        failureRedirect: '/'
    }));

    // windows-live ---------------------------

    app.get('/connect/windows-live', passport.authorize('windowslive', {
        scope: [
            'wl.signin',
            'wl.basic'
        ]
    }));

    app.get('/connect/windows-live/callback', passport.authorize('windowslive', {
        successRedirect: '/#/home',
        failureRedirect: '/'
    }));
};