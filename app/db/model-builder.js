var mongoose = require('mongoose');

module.exports = {
    createModel: function (modelName, obj, schemaBuilder) {
        var schema = new mongoose.Schema(obj);

        if (schemaBuilder) {
            schemaBuilder(schema);
        }

        return mongoose.model(modelName, schema);
    }
};