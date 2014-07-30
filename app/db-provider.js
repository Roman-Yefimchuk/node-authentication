module.exports = (function () {

    var Todo = require('./models/todo');
    var Workspace = require('./models/workspace');
    var WorkspaceRelation = require('./models/workspace-relation');

    return {
        getItems: function (userId, callback) {
            Todo.find({
                'userId': userId
            }, function (error, items) {
                callback(error, items);
            });
        },
        save: function (userId, todoModel, callback) {
            var todo = new Todo({
                'userId': userId,
                'title': todoModel.title,
                'completed': todoModel.completed
            });

            todo.save(function (error, model) {
                var itemId = model['_id'].toString();
                callback(error, itemId);
            });
        },
        update: function (userId, todoModels, callback) {
            var leave = false;
            for (var modelIndex = 0; modelIndex < todoModels.length; modelIndex++) {
                if (leave) {
                    break;
                }
                var todoModel = todoModels[modelIndex];
                Todo.findById(todoModel['_id'], function (error, model) {
                    if (error) {
                        callback(error);
                        leave = true;
                    } else {
                        model.title = todoModel.title;
                        model.completed = todoModel.completed;
                        model.save(function (error, model) {
                            if (error) {
                                callback(error);
                                leave = true;
                            }
                        });
                    }
                });
            }

            callback();
        },
        remove: function (userId, todoIds, callback) {
            var leave = false;
            for (var idIndex = 0; idIndex < todoIds.length; idIndex++) {
                if (leave) {
                    break;
                }
                var itemId = todoIds[idIndex];
                Todo.findById(itemId, function (error, model) {
                    if (error) {
                        callback(error);
                        leave = true;
                    } else {
                        if (model) {
                            model.remove(function (error) {
                                if (error) {
                                    callback(error);
                                    leave = true;
                                }
                            });
                        } else {
                            console.log('model[' + itemId + '] not exist');
                        }
                    }
                });
            }

            callback();
        },
        setUserWorkspaceId: function (userId, workspaceId, callback) {
            var workspaceRelation = new WorkspaceRelation({
                'userId': userId,
                'workspaceId': workspaceId
            });

            workspaceRelation.save(function (error) {
                if (error) {
                    throw error;
                }
                callback();
            })
        },
        getUserWorkspaceId: function (userId, callback) {
            WorkspaceRelation.findOne({
                'userId': userId
            }, function (error, model) {
                if (error) {
                    throw error;
                } else {
                    if (model) {
                        callback(model.workspaceId);
                    } else {
                        throw 'Workspace not found';
                    }
                }
            });
        },
        addWorkspace: function (name, creatorId, callback) {
            var workspace = new Workspace({
                'name': name,
                'creatorId': creatorId
            });

            workspace.save(function (error, model) {
                if (error) {
                    throw error;
                }
                var workspaceId = model['_id'].toString();
                callback(workspaceId);
            });
        },
        getWorkspace: function (workspaceId, callback) {
            Workspace.findById(workspaceId, function (error, model) {
                if (error) {
                    throw error;
                }
                callback(model);
            });
        },
        getAllWorkspaces: function (callback) {
            Workspace.find(function (error, workspaces) {
                if (error) {
                    throw error;
                }
                callback(workspaces);
            });
        }
    };
})();