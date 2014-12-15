"use strict";

(function (require) {

    var _ = require('underscore');

    module.exports = function () {

        var listenerSessions = [];

        var ListenerSession = function (userId, lectureSession, socketSession) {
            this.userId = userId;
            this.lectureSession = lectureSession;
            this.socketSession = socketSession;
            this.requestCount = 0;
            this.understandingValue = 0;

            listenerSessions.push(this);
        };

        ListenerSession.prototype = {
            join: function () {
                var listeners = this.lectureSession['listeners'];
                listeners.push(this);
            },
            leave: function () {
                var listeners = this.lectureSession['listeners'];
                this.lectureSession['listeners'] = _.without(listeners, this);

                listenerSessions = _.without(listenerSessions, this);
            }
        };

        ListenerSession.findByUserId = function (userId) {
            return _.findWhere(listenerSessions, {
                userId: userId
            });
        };

        ListenerSession.each = function (fn) {
            return _.forEach(listenerSessions, fn);
        };

        return ListenerSession;
    };

})(require);