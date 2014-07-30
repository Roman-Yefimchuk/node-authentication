var mongoose = require('mongoose');
var Schema = mongoose['Schema'];

var todoItemSchema = new Schema({
    id: {
        type: String
    },
    userId: {
        type: String
    },
    title: {
        type: String
    },
    completed: {
        type: Boolean
    },
    workspaceId: {
        type: String
    }
});

module.exports = mongoose.model('TodoItem', todoItemSchema);