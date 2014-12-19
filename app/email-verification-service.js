"use strict";

(function (require) {

    var _ = require('underscore');

    var sessions = [];
    var VerificationSession = (function () {

        var EXPIRED_TIME = 1000 * 60 * 10;
        var SecurityUtils = require('../app/utils/security-utils');

        function VerificationSession(userId, email) {
            this.userId = userId;
            this.email = email;
            this.timestamp = _.now();
            this.token = (function () {
                var token = SecurityUtils.randomString();
                while (true) {
                    if (_.findWhere(sessions, {
                        token: token
                    })) {
                        token = SecurityUtils.randomString();
                    } else {
                        return token;
                    }
                }
            })();
        }

        VerificationSession.prototype = {
            isSessionExpired: function () {
                var timestamp = this.timestamp;
                return _.now() - timestamp >= EXPIRED_TIME;
            },
            closeSession: function () {
                sessions = _.without(sessions, this);
            }
        };

        return VerificationSession;

    })();

    function createSession(userId, email) {

        if (sessions.length > 100) {

            var expiredSessions = [];

            _.forEach(sessions, function (session) {
                if (session.isSessionExpired()) {
                    expiredSessions.push(session);
                }
            });

            if (expiredSessions.length > 0) {
                sessions = _.difference(sessions, expiredSessions);
            }
        }

        var verificationSession = new VerificationSession(userId, email);
        sessions.push(verificationSession);

        return verificationSession;
    }

    function getSession(token) {
        return _.findWhere(sessions, {
            token: token
        })
    }

    module.exports = {
        createSession: createSession,
        getSession: getSession
    };

})(require);