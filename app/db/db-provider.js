module.exports = (function () {

    var getUserContext = require('./../context-provider')['getUserContext'];

    var User = require('./models/user');
    var Todo = require('./models/todo');
    var Workspace = require('./models/workspace');
    var PermittedWorkspace = require('./models/permitted-workspace');
    var Permissions = require('./models/permissions');

    var dbProvider = {
        getItems: function (workspaceId, userId, callback) {
            Todo.find({
                'workspaceId': workspaceId
            }, function (error, items) {
                if (error) {
                    throw error;
                }

                callback(items);
            });
        },
        save: function (workspaceId, userId, todoModel, callback) {
            var todo = new Todo({
                'workspaceId': workspaceId,
                'userId': userId,
                'title': todoModel.title,
                'completed': todoModel.completed
            });

            todo.save(function (error, model) {
                if (error) {
                    throw error;
                }

                var itemId = model['_id'].toString();
                callback(itemId);
            });
        },
        update: function (workspaceId, userId, todoModels, callback) {
            for (var modelIndex = 0; modelIndex < todoModels.length; modelIndex++) {
                var todoModel = todoModels[modelIndex];
                Todo.findById(todoModel['_id'], function (error, model) {
                    if (error) {
                        throw error;
                    }

                    model.title = todoModel.title;
                    model.completed = todoModel.completed;
                    model.save(function (error) {
                        if (error) {
                            throw error;
                        }
                    });
                });
            }

            callback();
        },
        remove: function (workspaceId, userId, todoIds, callback) {
            for (var idIndex = 0; idIndex < todoIds.length; idIndex++) {
                var itemId = todoIds[idIndex];
                Todo.findById(itemId, function (error, model) {
                    if (error) {
                        throw  error;
                    }

                    if (model) {
                        model.remove(function (error) {
                            if (error) {
                                throw error;
                            }
                        });
                    }
                });
            }

            callback();
        },
        setUserPermissionForWorkspace: function (userId, workspaceId, permissions, callback) {
        },
        getUserPermissionForWorkspace: function (userId, workspaceId, callback) {
        },
        setUserWorkspaceId: function (userId, workspaceId, callback) {
            User.findById(userId, function (error, model) {
                if (error) {
                    throw error;
                }

                if (model) {
                    model.currentWorkspaceId = workspaceId;
                } else {
                    throw 'User not found';
                }

                model.save(function (error) {
                    if (error) {
                        throw error;
                    }
                    callback();
                })
            });
        },
        getUserWorkspaceId: function (userId, callback) {
            User.findById(userId, function (error, model) {
                if (error) {
                    throw error;
                }

                if (model) {
                    callback(model.currentWorkspaceId);
                } else {
                    throw 'Workspace not found';
                }

                model.save(function (error) {
                    if (error) {
                        throw error;
                    }
                    callback();
                })
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

                User.findById(creatorId, function (error, model) {
                    if (error) {
                        throw error;
                    }

                    var ownWorkspaces = model.ownWorkspaces;
                    ownWorkspaces.push(workspaceId);

                    var permittedWorkspaces = model.permittedWorkspaces;
                    permittedWorkspaces.push(new PermittedWorkspace({
                        'workspaceId': workspaceId,
                        'permissions': new Permissions({
                            'readOnly': true,
                            'collectionManager': true,
                            'accessManager': true
                        })
                    }));

                    model.save(function (error) {
                        if (error) {
                            throw error;
                        }

                        callback(workspaceId);
                    });
                });
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
        getWorkspaces: function (creatorId, callback) {
            User.findById(creatorId, function (error, model) {
                if (error) {
                    throw error;
                }

                if (model) {
                    callback(model.ownWorkspaces);
                } else {
                    throw 'User not found';
                }
            });
        },
        getPermittedWorkspaces: function (userId, callback) {
            /*            WorkspaceRelation.find({
             'userId': userId,
             '$or': [
             {
             'permissions.readOnly': true
             },
             {
             'permissions.collectionManager': true
             },
             {
             'permissions.accessManager': true
             }
             ]
             }, function (error, workspaces) {
             if (error) {
             throw error;
             }
             callback(workspaces);
             });*/
        },
        getAllWorkspaces: function (callback) {
            Workspace.find(function (error, workspaces) {
                if (error) {
                    throw error;
                }
                callback(workspaces);
            });
        },
        getAllUsers: function (callback) {
            User.find(function (error, users) {
                if (error) {
                    throw error;
                }
                for (var userIndex = 0; userIndex < users.length; userIndex++) {
                    var userContext = getUserContext(users[userIndex]);
                    users[userIndex] = {
                        id: userContext.userId,
                        displayName: userContext.displayName
                    };
                }
                callback(users);
            });
        }
    };

    return dbProvider;
})();