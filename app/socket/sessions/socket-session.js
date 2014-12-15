"use strict";

(function (require) {

    var _ = require('underscore');

    module.exports = function (listenerSession) {

        var ListenerSession = listenerSession;
        var sockets = [];

        function SocketSession(socket, userId, workspaceId) {
            this.socket = socket;
            this.userId = userId;
            this.workspaceId = workspaceId;

            sockets.push(this);
        }

        SocketSession.prototype = {
            sendCommand: function (command, data) {
                var socket = this.socket;
                socket.emit(command, data);
            },
            close: function () {
                var userId = this.userId;
                var socket = this.socket;

                socket.disconnect();

                var listenerSession = ListenerSession.findByUserId(userId);
                if (listenerSession) {
                    listenerSession.leave();
                }

                sockets = _.without(sockets, this);
            }
        };

        SocketSession.findById = function (id) {
            return _.find(sockets, function (socketSession) {
                var socket = socketSession.socket;
                return socket.id == id;
            });
        };

        SocketSession.findByUserId = function (userId) {
            return _.findWhere(sockets, {
                userId: userId
            });
        };

        SocketSession.each = function (fn) {
            return _.forEach(sockets, fn);
        };

        return SocketSession;
    };

})(require);