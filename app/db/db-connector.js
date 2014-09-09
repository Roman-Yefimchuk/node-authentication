"use strict";

module.exports = {
    connect: function (callback, developmentMode) {

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

            function formatCommand(command, params) {
                var value = command;
                if (params) {
                    for (var key in params) {
                        if (params[key] != undefined) {
                            var pattern = new RegExp(':' + key, 'g');
                            if (typeof params[key] == 'string') {
                                value = value.replace(pattern, "'" + params[key] + "'");
                            } else {
                                value = value.replace(pattern, params[key]);
                            }
                        }
                    }
                }
                return value;
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

        var dbProvider = require('./db-provider')(dbWrapper, developmentMode);
        callback(dbProvider);
    }
};