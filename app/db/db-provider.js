module.exports = function (developmentMode) {

    var _ = require('underscore');

    var ObjectID = require('mongodb')['ObjectID'];
    var getUserContext = require('./../context-provider')['getUserContext'];

    var User = require('./models/user');
    var Todo = require('./models/todo');
    var Workspace = require('./models/workspace');
    var PermittedWorkspace = require('./models/permitted-workspace');

    function getUserPermissionsForWorkspace(workspaceId, user) {
        var permittedWorkspaces = user.permittedWorkspaces;
        for (var index = 0; index < permittedWorkspaces.length; index++) {
            var permittedWorkspace = permittedWorkspaces[index];
            if (workspaceId == permittedWorkspace.workspaceId) {
                var permissions = permittedWorkspace.permissions;
                return {
                    'readOnly': permissions.readOnly,
                    'collectionManager': permissions.collectionManager,
                    'accessManager': permissions.accessManager
                };
            }
        }
        return {
            'readOnly': false,
            'collectionManager': false,
            'accessManager': false
        };
    }

    function isCreator(workspaceId, user) {
        var permittedWorkspaces = user.permittedWorkspaces;
        for (var index = 0; index < permittedWorkspaces.length; index++) {
            var permittedWorkspace = permittedWorkspaces[index];
            if (workspaceId == permittedWorkspace.workspaceId) {
                return permittedWorkspace.isOwn;
            }
        }
        return false;
    }

    function addWorkspace(name, creatorId, isDefault, callback) {
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
                    'isOwn': true,
                    'isDefault': isDefault,
                    'permissions': {
                        'readOnly': true,
                        'collectionManager': true,
                        'accessManager': true
                    }
                }));

                model.save(function (error) {
                    if (error) {
                        throw error;
                    }

                    callback(workspaceId);
                });
            });
        });
    }

    return {
        getItems: function (workspaceId, userId, callback) {
            Todo.find({'workspaceId': workspaceId}, function (error, items) {
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
            var index = 0;
            var next = function () {
                if (index == todoModels.length) {
                    callback();
                } else {
                    var todoModel = todoModels[index];
                    Todo.findById(todoModel['_id'], function (error, model) {
                        if (error) {
                            throw error;
                        }

                        model.title = todoModel.title;
                        model.completed = todoModel.completed;
                        model.lastModifyInfo = {
                            date: Date.now(),
                            userId: userId
                        };
                        model.save(function (error) {
                            if (error) {
                                throw error;
                            }

                            index++;
                            next();
                        });
                    });
                }
            };

            next();
        },
        remove: function (workspaceId, userId, todoIds, callback) {
            var index = 0;
            var next = function () {
                if (index == todoIds.length) {
                    callback();
                } else {
                    Todo.findById(todoIds[index], function (error, model) {
                        if (error) {
                            throw  error;
                        }

                        if (model) {
                            model.remove(function (error) {
                                if (error) {
                                    throw error;
                                }

                                index++;
                                next();
                            });
                        }
                    });
                }
            };

            next();
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

                model.save(function (error, model) {
                    if (error) {
                        throw error;
                    }

                    var permissions = getUserPermissionsForWorkspace(workspaceId, model);
                    var isOwnWorkspace = isCreator(workspaceId, model);

                    callback(permissions, isOwnWorkspace);
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
            });
        },
        createDefaultWorkspace: function (name, creatorId, callback) {
            addWorkspace(name, creatorId, true, callback);
        },
        createWorkspace: function (name, creatorId, callback) {
            addWorkspace(name, creatorId, false, callback);
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
        getWorkspace: function (workspaceId, callback) {
            Workspace.findById(workspaceId, function (error, model) {
                if (error) {
                    throw error;
                }

                if (model) {
                    callback(model);
                } else {
                    throw 'Workspace not found';
                }
            });
        },
        getDefaultWorkspace: function (userId, callback) {
            User.findById(userId, function (error, model) {
                if (error) {
                    throw error;
                }

                if (model) {
                    var permittedWorkspaces = model.permittedWorkspaces;

                    for (var index = 0; index < permittedWorkspaces.length; index++) {
                        var permittedWorkspace = permittedWorkspaces[index];
                        if (permittedWorkspace.isDefault) {
                            var workspaceId = permittedWorkspace.workspaceId;
                            callback(workspaceId);
                        }
                    }
                } else {
                    throw 'User not found';
                }
            });
        },
        getUser: function (userId, callback) {
            User.findById(userId, function (error, model) {
                if (error) {
                    throw error;
                }

                if (model) {
                    var userContext = getUserContext(model);
                    callback({
                        id: userContext.userId,
                        displayName: userContext.displayName
                    });
                } else {
                    throw 'User not found';
                }
            });
        },
        getUsers: function (ids, callback) {

            var userIds = [];
            ids.forEach(function (id) {
                userIds.push({'_id': new ObjectID(id)});
            });

            User.find({'$or': userIds}, function (error, users) {
                if (error) {
                    throw error;
                }

                var result = [];

                users.forEach(function (user) {
                    var userContext = getUserContext(user);

                    result.push({
                        id: userContext.userId,
                        displayName: userContext.displayName
                    });
                });

                callback(result);
            });
        },
        getPermittedWorkspaces: function (userId, callback) {
            User.findById(userId, function (error, model) {
                if (error) {
                    throw error;
                }

                if (model) {
                    var permittedWorkspaces = model.permittedWorkspaces;

                    var workspaceIds = [];
                    permittedWorkspaces.forEach(function (permittedWorkspace) {
                        var id = permittedWorkspace.workspaceId;
                        workspaceIds.push({'_id': new ObjectID(id)});
                    });

                    Workspace.find({'$or': workspaceIds}, function (error, workspaces) {
                        if (error) {
                            throw  error;
                        }

                        function getWorkspace(permittedWorkspace) {
                            for (var index = 0; index < workspaces.length; index++) {
                                var workspace = workspaces[index];
                                var workspaceId = workspace['_id'].toString();
                                if (workspaceId == permittedWorkspace.workspaceId) {
                                    return workspace;
                                }
                            }
                        }

                        var result = [];

                        for (var index = 0; index < workspaces.length; index++) {
                            var permittedWorkspace = permittedWorkspaces[index];
                            var workspace = getWorkspace(permittedWorkspace);
                            result.push({
                                '_id': permittedWorkspace.workspaceId,
                                'name': workspace.name,
                                'creatorId': workspace.creatorId,
                                'permissions': permittedWorkspace.permissions
                            });
                        }

                        callback(result);
                    });
                } else {
                    throw 'User not found';
                }
            });
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
        },
        getAllUsersWithPermissions: function (workspaceId, callback) {
            User.find(function (error, users) {
                if (error) {
                    throw error;
                }

                var result = [];

                for (var userIndex = 0; userIndex < users.length; userIndex++) {
                    var user = users[userIndex];
                    var userContext = getUserContext(user);


                    result.push({
                        id: userContext.userId,
                        displayName: userContext.displayName,
                        permissions: getUserPermissionsForWorkspace(workspaceId, user),
                        isCreator: isCreator(workspaceId, user)
                    });
                }

                callback(result);
            });
        },
        setUsersPermissionsForWorkspace: function (workspaceId, collection, callback) {

            function isAccessDenied(permissions) {
                return !permissions.readOnly && !permissions.collectionManager && !permissions.accessManager;
            }

            function isAccessGranted(permissions) {
                return !isAccessDenied(permissions);
            }

            var userIds = [];
            collection.forEach(function (collectionItem) {
                userIds.push({'_id': new ObjectID(collectionItem.userId)});
            });

            User.find({'$or': userIds}, function (error, users) {
                if (error) {
                    throw error;
                }

                function getWorkspaceContainer(permittedWorkspaces) {
                    for (var workspaceIndex = 0; workspaceIndex < permittedWorkspaces.length; workspaceIndex++) {
                        var workspace = permittedWorkspaces[workspaceIndex];
                        if (workspace.workspaceId == workspaceId) {
                            return {
                                workspace: workspace,
                                remove: function () {
                                    permittedWorkspaces.splice(workspaceIndex, 1);
                                }
                            };
                        }
                    }
                }

                var index = 0;
                var next = function () {
                    if (users.length == index) {
                        callback();
                    } else {
                        var permissions = collection[index].permissions;
                        var model = users[index];
                        var permittedWorkspaces = model.permittedWorkspaces;

                        var workspaceContainer = getWorkspaceContainer(permittedWorkspaces);
                        if (workspaceContainer) {
                            var workspace = workspaceContainer.workspace;
                            if (isAccessDenied(permissions)) {
                                workspaceContainer.remove();
                            } else {
                                workspace.permissions = permissions;
                            }

                            model.save(function (error, model) {
                                if (error) {
                                    throw error;
                                }

                                index++;
                                next();
                            });
                        } else {
                            if (isAccessGranted(permissions)) {
                                permittedWorkspaces.push(new PermittedWorkspace({
                                    'workspaceId': workspaceId,
                                    'permissions': permissions
                                }));

                                model.save(function (error, model) {
                                    if (error) {
                                        throw error;
                                    }

                                    index++;
                                    next();
                                });
                            } else {
                                index++;
                                next();
                            }
                        }
                    }
                };

                next();
            });
        },
        getUserPermissionForWorkspace: function (userId, workspaceId, callback) {
        }
    };
};