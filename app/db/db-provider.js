module.exports = function (developmentMode) {

    var asyncCycle = require('../utils/async-cycle');

    var _ = require('underscore');

    var ObjectID = require('mongodb')['ObjectID'];

    var UserAccount = require('./models/user-account');
    var User = require('./models/user');
    var Todo = require('./models/todo');
    var Workspace = require('./models/workspace');
    var PermittedWorkspace = require('./models/permitted-workspace');

    function extractId(entity) {
        return entity['_id'].toString();
    }

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

            var workspaceId = extractId(model);

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

    function getUserAccount(accountId, callback) {
        UserAccount.findById(accountId, function (error, userAccount) {
            if (error) {
                throw error;
            }

            if (userAccount) {
                callback({
                    userId: userAccount.userId,
                    genericId: userAccount.genericId,
                    displayName: userAccount.displayName,
                    password: userAccount.password,
                    email: userAccount.email,
                    token: userAccount.token,
                    authorizationProvider: userAccount.authorizationProvider,
                    registeredDate: userAccount.registeredDate
                });
            } else {
                throw 'User account not found';
            }
        });
    }

    function wrapAccountUser(userAccount) {
        if (userAccount) {
            return {
                userId: userAccount.userId,
                genericId: userAccount.genericId,
                displayName: userAccount.displayName,
                password: userAccount.password,
                email: userAccount.email,
                token: userAccount.token,
                authorizationProvider: userAccount.authorizationProvider,
                registeredDate: userAccount.registeredDate,
                isAuthenticated: function () {
                    return !!userAccount.token;
                },
                update: function (accountData, callback) {

                    var successCallback = callback.success;
                    var failureCallback = callback.failure;

                    _.forEach([
                        'genericId',
                        'displayName',
                        'password',
                        'email',
                        'token',
                        'authorizationProvider'
                    ], function (key) {
                        if (key in accountData) {
                            userAccount[key] = accountData[key];
                        }
                    });

                    userAccount.save(function (error, userAccount) {
                        if (error) {
                            failureCallback(error);
                        }

                        successCallback(wrapAccountUser(userAccount));
                    });
                }
            };
        }
    }

    var dbProvider = {
        createUser: function (data, callback) {

            var successCallback = callback.success;
            var failureCallback = callback.failure;

            var userAccount = new UserAccount();

            try {
                _.forEach([
                    'genericId',
                    'displayName',
                    'password',
                    'email',
                    'token',
                    'authorizationProvider',
                    'registeredDate'
                ], function (key) {
                    if (key in data) {
                        userAccount[key] = data[key];
                    } else {
                        throw "Missing property '" + key + "'";
                    }
                });
            } catch (e) {
                failureCallback(e);
            }

            userAccount.save(function (error, userAccount) {
                if (error) {
                    failureCallback(error);
                }

                var user = new User();
                user.accountId = extractId(userAccount);

                user.save(function (error, user) {
                    if (error) {
                        failureCallback(error);
                    }

                    userAccount.userId = extractId(user);
                    userAccount.save(function (error, userAccount) {
                        if (error) {
                            failureCallback(error);
                        }

                        var userId = userAccount.userId;
                        var workspaceName = userAccount.displayName + '[' + userAccount.authorizationProvider + ']';

                        dbProvider.createDefaultWorkspace(workspaceName, userId, function (workspaceId) {
                            dbProvider.setUserWorkspaceId(userId, workspaceId, function () {
                                successCallback(wrapAccountUser(userAccount));
                            })
                        });
                    });
                });
            });
        },
        findUser: function (genericId, callback) {

            var successCallback = callback.success;
            var failureCallback = callback.failure;

            UserAccount.findOne({
                genericId: genericId
            }, function (error, userAccount) {
                if (error) {
                    failureCallback(error);
                }

                if (userAccount) {
                    successCallback(wrapAccountUser(userAccount));
                } else {
                    successCallback();
                }
            });
        },
        getItems: function (workspaceId, userId, callback) {
            Todo.find({
                'workspaceId': workspaceId
            }, function (error, items) {
                if (error) {
                    throw error;
                }

                var result = [];

                _.forEach(items, function (item) {
                    result.push({
                        id: extractId(item),
                        creatorId: item.creatorId,
                        title: item.title,
                        completed: item.completed,
                        workspaceId: item.workspaceId,
                        createdDate: item.createdDate
                    });
                });

                callback(result);
            });
        },
        save: function (workspaceId, userId, todoModel, callback) {
            var todo = new Todo({
                'workspaceId': workspaceId,
                'creatorId': userId,
                'title': todoModel.title,
                'completed': todoModel.completed
            });

            todo.save(function (error, item) {
                if (error) {
                    throw error;
                }

                var itemId = extractId(item);
                callback(itemId);
            });
        },
        update: function (workspaceId, userId, todoModels, callback) {
            asyncCycle(todoModels, function (todoModel, index, next) {
                Todo.findById(todoModel.id, function (error, model) {
                    if (error) {
                        throw error;
                    }

                    model.title = todoModel.title;
                    model.completed = todoModel.completed;

                    model.save(function (error) {
                        if (error) {
                            throw error;
                        }

                        next();
                    });
                });
            }, function () {
                callback();
            });
        },
        remove: function (workspaceId, userId, todoIds, callback) {
            asyncCycle(todoIds, function (todoId, index, next) {
                Todo.findById(todoId, function (error, model) {
                    if (error) {
                        throw  error;
                    }

                    if (model) {
                        model.remove(function (error) {
                            if (error) {
                                throw error;
                            }

                            next();
                        });
                    }
                });
            }, function () {
                callback();
            });
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
                    var workspaceId = model.currentWorkspaceId;
                    callback(workspaceId);
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
                    var workspaces = model.ownWorkspaces;
                    callback(workspaces);
                } else {
                    throw 'User not found';
                }
            });
        },
        getWorkspace: function (workspaceId, callback) {
            Workspace.findById(workspaceId, function (error, workspace) {
                if (error) {
                    throw error;
                }

                if (workspace) {
                    callback({
                        id: extractId(workspace),
                        name: workspace.name,
                        creatorId: workspace.creatorId,
                        createdDate: workspace.createdDate
                    });
                } else {
                    throw 'Workspace not found';
                }
            });
        },
        getDefaultWorkspaceId: function (userId, callback) {
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
            User.findById(userId, function (error, user) {
                if (error) {
                    throw error;
                }

                if (user) {
                    var accountId = user.accountId;
                    getUserAccount(accountId, function (userAccount) {
                        callback({
                            id: userAccount.userId,
                            displayName: userAccount.displayName,
                            registeredDate: userAccount.registeredDate
                        });
                    });
                } else {
                    throw 'User not found';
                }
            });
        },
        getUsers: function (ids, callback) {

            var userIds = [];
            _.forEach(ids, function (id) {
                userIds.push({
                    '_id': new ObjectID(id)
                });
            });

            User.find({
                '$or': userIds
            }, function (error, users) {
                if (error) {
                    throw error;
                }

                var result = [];

                asyncCycle(users, function (user, index, next) {
                    var accountId = user.accountId;

                    getUserAccount(accountId, function (userAccount) {
                        result.push({
                            id: userAccount.userId,
                            displayName: userAccount.displayName,
                            registeredDate: userAccount.registeredDate
                        });

                        next();
                    });
                }, function () {
                    callback(result);
                });
            });
        },
        getPermittedWorkspaces: function (userId, callback) {
            User.findById(userId, function (error, user) {
                if (error) {
                    throw error;
                }

                if (user) {
                    var permittedWorkspaces = user.permittedWorkspaces;

                    var workspaceIds = [];
                    _.forEach(permittedWorkspaces, function (permittedWorkspace) {
                        var id = permittedWorkspace.workspaceId;
                        workspaceIds.push({
                            '_id': new ObjectID(id)
                        });
                    });

                    Workspace.find({
                        '$or': workspaceIds
                    }, function (error, workspaces) {
                        if (error) {
                            throw  error;
                        }

                        function getWorkspace(permittedWorkspace) {
                            for (var index = 0; index < workspaces.length; index++) {
                                var workspace = workspaces[index];
                                var workspaceId = extractId(workspace);
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
                                id: permittedWorkspace.workspaceId,
                                name: workspace.name,
                                creatorId: workspace.creatorId,
                                createdDate: workspace.createdDate,
                                permissions: permittedWorkspace.permissions
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

                var result = [];

                _.forEach(workspaces, function (workspace) {
                    result.push({
                        id: extractId(workspace),
                        name: workspace.name,
                        creatorId: workspace.creatorId,
                        createdDate: workspace.createdDate
                    });
                });

                callback(result);
            });
        },
        getAllUsers: function (callback) {
            User.find(function (error, users) {
                if (error) {
                    throw error;
                }

                var result = [];

                asyncCycle(users, function (user, index, next) {
                    var accountId = user.accountId;

                    getUserAccount(accountId, function (userAccount) {
                        result.push({
                            id: userAccount.userId,
                            displayName: userAccount.displayName,
                            registeredDate: userAccount.registeredDate
                        });

                        next();
                    });
                }, function () {
                    callback(result);
                });
            });
        },
        getAllUsersWithPermissions: function (workspaceId, callback) {
            User.find(function (error, users) {
                if (error) {
                    throw error;
                }

                var result = [];

                asyncCycle(users, function (user, index, next) {
                    var accountId = user.accountId;

                    getUserAccount(accountId, function (userAccount) {
                        result.push({
                            id: userAccount.userId,
                            displayName: userAccount.displayName,
                            permissions: getUserPermissionsForWorkspace(workspaceId, user),
                            isCreator: isCreator(workspaceId, user),
                            registeredDate: userAccount.registeredDate
                        });

                        next();
                    });
                }, function () {
                    callback(result);
                });
            });
        },
        isAccessGrantedForWorkspace: function (userId, workspaceId, callback) {
            User.findById(userId, function (error, model) {
                if (error) {
                    throw  error;
                }

                if (model) {

                    function isAccessGranted(permittedWorkspaces) {
                        for (var index = 0; index < permittedWorkspaces.length; index++) {
                            var permittedWorkspace = permittedWorkspaces[index];
                            if (permittedWorkspace.workspaceId == workspaceId) {
                                var permissions = permittedWorkspace.permissions;
                                if (permissions.readOnly || permissions.collectionManager || permissions.accessManager) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    }

                    var permittedWorkspaces = model.permittedWorkspaces;
                    callback(isAccessGranted(permittedWorkspaces));
                } else {
                    throw 'User not found';
                }
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
            _.forEach(collection, function (collectionItem) {
                userIds.push({
                    '_id': new ObjectID(collectionItem.userId)
                });
            });

            User.find({
                '$or': userIds
            }, function (error, users) {
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

                asyncCycle(users, function (user, index, next) {
                    var permissions = collection[index].permissions;
                    var permittedWorkspaces = user.permittedWorkspaces;

                    var workspaceContainer = getWorkspaceContainer(permittedWorkspaces);
                    if (workspaceContainer) {
                        var workspace = workspaceContainer.workspace;
                        if (isAccessDenied(permissions)) {
                            workspaceContainer.remove();
                        } else {
                            workspace.permissions = permissions;
                        }

                        user.save(function (error, model) {
                            if (error) {
                                throw error;
                            }

                            next();
                        });
                    } else {
                        if (isAccessGranted(permissions)) {
                            permittedWorkspaces.push(new PermittedWorkspace({
                                'workspaceId': workspaceId,
                                'permissions': permissions
                            }));

                            user.save(function (error, model) {
                                if (error) {
                                    throw error;
                                }

                                next();
                            });
                        } else {
                            next();
                        }
                    }
                }, function () {
                    callback();
                });
            });
        },
        getUserPermissionForWorkspace: function (userId, workspaceId, callback) {
        }
    };

    return dbProvider;
};