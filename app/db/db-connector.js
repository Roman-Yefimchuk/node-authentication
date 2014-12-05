"use strict";

(function (require) {

    module.exports = {
        connect: function (callback) {

            var databaseConfig = require('../../config/database-config');
            var Oriento = require('oriento');

            var server = Oriento({
                host: databaseConfig.host,
                port: databaseConfig.port,
                username: databaseConfig.server_username,
                password: databaseConfig.server_password
            });

            var db = server.use({
                name: databaseConfig.db_name,
                username: databaseConfig.db_username,
                password: databaseConfig.db_password
            });

            var dbWrapper = (function () {

                var _ = require('underscore');

                function formatCommand(command, params) {
                    var formattedCommand = command;

                    _.forEach(params, function (value, key) {

                        if (value != undefined) {
                            var pattern = new RegExp(':' + key, 'g');

                            if (typeof value == 'string') {
                                formattedCommand = formattedCommand.replace(pattern, "'" + value + "'");
                            } else {
                                formattedCommand = formattedCommand.replace(pattern, value);
                            }
                        }
                    });

                    return formattedCommand;
                }

                return {
                    query: function (command, options) {
                        options = options || {};
                        command = formatCommand(command, options.params);
                        options.params = null;
                        return db.query(command, options);
                    }
                }
            })();

            var dbProvider = require('./db-provider')(dbWrapper);
            callback(dbProvider);
        }
    };

})(require);