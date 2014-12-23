"use strict";

module.exports = {
    local: {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    facebook: {
        clientID: "825915494093970",
        clientSecret: "b1bef1cb2cfa573b9752f0c94bb2b6c8",
        callbackURL: "http://127.0.0.1:8080/auth/facebook/callback",
        passReqToCallback: true
    },
    twitter: {
        consumerKey: "mCGwDGUw5KlrjaAgprKnOEfvy",
        consumerSecret: "1wtDNybALAgAX43OVkLzMHlv2LSJdMk7wV4QsiT5qqnFCMOXrA",
        callbackURL: "http://127.0.0.1:8080/auth/twitter/callback",
        passReqToCallback: true
    },
    google: {
        clientID: "141013532908-t6cpgavtkg3i4o8naissn327dqdnbd7s.apps.googleusercontent.com",
        clientSecret: "d6c4D5z-C8GwV2TH6bcjOsE3",
        callbackURL: "http://127.0.0.1:8080/auth/google/callback",
        passReqToCallback: true
    },
    linkedIn: {
        consumerKey: "75oy0osw5vv50v",
        consumerSecret: "xCXQHBNAvbPfDkbs",
        callbackURL: "http://127.0.0.1:8080/auth/linked-in/callback",
        passReqToCallback: true
    },
    windowsLive: {
        clientID: "000000004013AAB6",
        clientSecret: "KSnH0VhpKJmsxhjgyhvMYrAcHvj0B3cc",
        callbackURL: "http://127.0.0.1:8080/auth/windows-live/callback",
        passReqToCallback: true
    }
};