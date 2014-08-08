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

        var dbProvider = require('./db-provider')(db, developmentMode);
        callback(dbProvider);
    }
};