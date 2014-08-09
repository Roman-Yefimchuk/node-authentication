"use strict";

var mongoose = require('mongoose');
var Schema = mongoose['Schema'];

module.exports = {
    createModel: function (modelName, obj, schemaBuilder) {
        var schema = new Schema(obj);

        if (schemaBuilder) {
            schemaBuilder(schema);
        }

        return mongoose.model(modelName, schema);
    }
};