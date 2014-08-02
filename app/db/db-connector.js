var mongoose = require('mongoose');
var dbConfig = require('../../config/database');

module.exports = {
    connect: function (callback, developmentMode) {
        mongoose.connect(dbConfig['url']);

        var db = mongoose.connection;

        db.on('error', function (err) {
            console.log('connection error: ' + err.message);
        });

        db.once('open', function () {
            console.log("Connected to DB!");

            var dbProvider = require('./db-provider')(developmentMode);
            callback(dbProvider);
        });
    }
};