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

            this.isClosed = false;
        }

        VerificationSession.prototype = {
            isSessionExpired: function () {
                var timestamp = this.timestamp;
                return _.now() - timestamp >= EXPIRED_TIME;
            },
            closeSession: function () {
                this.isClosed = true;
            }
        };

        return VerificationSession;

    })();

    function createSession(userId, email) {

        var session = _.findWhere(sessions, {
            userId: userId
        });
        if (session) {
            session.closeSession();
        }

        if (sessions.length > 0xFF) {

            var inactiveSessions = [];

            _.forEach(sessions, function (session) {
                if (session.isSessionExpired() || session.isClosed) {
                    inactiveSessions.push(session);
                }
            });

            if (inactiveSessions.length > 0) {
                sessions = _.difference(sessions, inactiveSessions);
            }
        }

        var verificationSession = new VerificationSession(userId, email);
        sessions.push(verificationSession);

        return verificationSession;
    }

    function getSession(token) {

        var session = _.findWhere(sessions, {
            token: token
        });

        if (session && session.isClosed) {
            return null;
        }

        return session;
    }

    module.exports = {
        createSession: createSession,
        getSession: getSession
    };

})(require);