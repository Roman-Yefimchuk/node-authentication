module.exports = function (db, developmentMode) {

    var asyncCycle = require('../utils/async-cycle');
    var security = require('../utils/security');

    var _ = require('underscore');

    var ObjectID = null;

    var UserAccount = null;
    var User = null;
    var Todo = null;
    var Workspace = null;
    var PermittedWorkspace = null;

    //TODO: done
    function extractId(entity) {
        return entity['@rid'].toString();
    }

    //TODO: done
    function encodeId(entity) {
        var id = extractId(entity);
        return security.encodeBase64(id);
    }

    //TODO: done
    function decodeId(id) {
        return security.decodeBase64(id);
    }

    //TODO: done
    function getUserPermissionsForWorkspace(userId, workspaceId, callback) {
        var queryRequest = db.query("SELECT * FROM PermittedWorkspace WHERE userId = :userId", {
            params: {
                userId: userId
            }
        });
        queryRequest.then(function (results) {
            var permittedWorkspaces = results;
            for (var index = 0; index < permittedWorkspaces.length; index++) {
                var permittedWorkspace = permittedWorkspaces[index];
                if (workspaceId == permittedWorkspace.workspaceId) {
                    callback({
                        'readOnly': permittedWorkspace.readOnly,
                        'collectionManager': permittedWorkspace.collectionManager,
                        'accessManager': permittedWorkspace.accessManager
                    });
                }
            }
            callback({
                'readOnly': false,
                'collectionManager': false,
                'accessManager': false
            });
        });
    }

    //TODO: done
    function isCreator(userId, workspaceId, callback) {
        var queryRequest = db.query("SELECT * FROM PermittedWorkspace WHERE userId = :userId", {
            params: {
                userId: userId
            }
        });
        queryRequest.then(function (results) {
            var permittedWorkspaces = results;
            for (var index = 0; index < permittedWorkspaces.length; index++) {
                var permittedWorkspace = permittedWorkspaces[index];
                if (workspaceId == permittedWorkspace.workspaceId) {
                    callback(permittedWorkspace.isOwn);
                }
            }
            callback(false);
        });
    }

    //TODO: done
    function addWorkspace(name, creatorId, isDefault, callback) {
        var queryRequest = db.query("INSERT INTO Workspace (name, creatorId, createDate) " +
            "VALUES (:name, :creatorId, :createDate)", {
            params: {
                name: name,
                creatorId: creatorId,
                createDate: _.now()
            }
        });
        queryRequest.then(function (results) {
            var workspace = results[0];
            var workspaceId = encodeId(workspace);

            var queryRequest = db.query("INSERT INTO PermittedWorkspace (userId, workspaceId, isOwn, isDefault, " +
                "readOnly, collectionManager, accessManager) VALUES (:userId, :workspaceId, :isOwn, :isDefault, " +
                ":readOnly, :collectionManager, :accessManager)", {
                params: {
                    userId: creatorId,
                    workspaceId: workspaceId,
                    isOwn: true,
                    isDefault: isDefault,
                    readOnly: true,
                    collectionManager: true,
                    accessManager: true
                }
            });
            queryRequest.then(function (results) {
                callback(workspaceId);
            });
        });
    }

    //TODO: done
    function getUserAccount(accountId, callback) {
        var queryRequest = db.query("SELECT * FROM UserAccount WHERE @rid = :accountId", {
            params: {
                accountId: decodeId(accountId)
            }
        });
        queryRequest.then(function (userAccount) {
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

    //TODO: done
    function formatParams(data, options) {
        var result = '';
        var mode = options && options.mode;
        var excludedKeys = options && options.excludedKeys;

        _.forEach(data, function (value, key) {
            if (!_.contains(excludedKeys, key)) {
                if (result.length > 0) {
                    result += ', ';
                }
                switch (mode) {
                    case 'keys':
                    {
                        result += key;
                        break;
                    }
                    case 'values':
                    {
                        result += ':' + key;
                        break;
                    }
                    default :
                    {
                        result += key + ' = :' + key;
                        break;
                    }
                }
            }
        });

        return result;
    }

    //TODO: done
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

                    var queryRequest = db.query("UPDATE UserAccount SET " + formatParams(accountData) +
                        " WHERE @rid = " + extractId(userAccount), {
                        params: accountData
                    });

                    queryRequest.then(function (userAccount) {
                        successCallback(wrapAccountUser(userAccount));
                    });
                }
            };
        }
    }

    var dbProvider = {

        //TODO: done
        createUser: function (data, callback) {

            var successCallback = callback.success;
            var failureCallback = callback.failure;

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
                    if (!(key in data)) {
                        throw "Missing property '" + key + "'";
                    }
                });
            } catch (e) {
                failureCallback(e);
            }

            var queryRequest = db.query("INSERT INTO UserAccount (genericId, displayName, password, email, token, " +
                "authorizationProvider, registeredDate) VALUES (:genericId, :displayName, :password, :email, " +
                ":token, :authorizationProvider, :registeredDate)", {
                params: {
                    genericId: data.genericId,
                    displayName: data.displayName,
                    password: data.password,
                    email: data.email,
                    token: data.token,
                    authorizationProvider: data.authorizationProvider,
                    registeredDate: data.registeredDate
                }
            });
            queryRequest.then(function (results) {
                var userAccount = results[0];

                var queryRequest = db.query("INSERT INTO User (accountId) VALUES (:accountId)", {
                    params: {
                        accountId: encodeId(userAccount)
                    }
                });
                queryRequest.then(function (results) {
                    var user = results[0];
                    var userId = encodeId(user);

                    userAccount.userId = userId;

                    var queryRequest = db.query("UPDATE UserAccount SET userId = :userId WHERE @rid = :id", {
                        params: {
                            userId: userId,
                            id: extractId(userAccount)
                        }
                    });
                    queryRequest.then(function (counts) {
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

        //TODO: done
        findUser: function (genericId, callback) {

            var successCallback = callback.success;
            var failureCallback = callback.failure;

            var queryRequest = db.query("SELECT * FROM UserAccount WHERE genericId = :genericId", {
                params: {
                    genericId: genericId
                }
            });
            queryRequest.then(function (results) {
                if (results.length > 0) {
                    successCallback(wrapAccountUser(results[0]));
                } else {
                    successCallback();
                }
            });
        },

        //TODO: done
        getItems: function (workspaceId, userId, callback) {
            var queryRequest = db.query("SELECT * FROM Todo WHERE workspaceId = :workspaceId", {
                params: {
                    workspaceId: workspaceId
                }
            });
            queryRequest.then(function (results) {
                var items = results;

                var result = [];

                _.forEach(items, function (item) {
                    result.push({
                        id: encodeId(item),
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

        //TODO: done
        save: function (workspaceId, userId, todoModel, callback) {
            var queryRequest = db.query("INSERT INTO Todo (workspaceId, creatorId, title, completed) VALUES (" +
                ":workspaceId, :creatorId, :title, :completed)", {
                params: {
                    workspaceId: workspaceId,
                    creatorId: userId,
                    title: todoModel.title,
                    completed: todoModel.completed
                }
            });
            queryRequest.then(function (results) {
                var item = results[0];
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

        //TODO: done
        setUserWorkspaceId: function (userId, workspaceId, callback) {
            var queryRequest = db.query("UPDATE User SET currentWorkspaceId = :currentWorkspaceId WHERE @rid = :id", {
                params: {
                    currentWorkspaceId: workspaceId,
                    id: decodeId(userId)
                }
            });
            queryRequest.then(function (counts) {
                if (counts > 0) {
                    getUserPermissionsForWorkspace(userId, workspaceId, function (permissions) {
                        isCreator(userId, workspaceId, function (isCreator) {
                            callback(permissions, isCreator);
                        })
                    });
                } else {
                    throw 'User not found';
                }
            });
        },

        //TODO: done
        getUserWorkspaceId: function (userId, callback) {
            var queryRequest = db.query("SELECT currentWorkspaceId FROM User WHERE @rid = :id", {
                params: {
                    id: decodeId(userId)
                }
            });
            queryRequest.then(function (results) {
                if (results.length > 0) {
                    var user = results[0];
                    var workspaceId = user.currentWorkspaceId;
                    callback(workspaceId);
                } else {
                    throw 'User not found';
                }
            });
        },

        //TODO: done
        createDefaultWorkspace: function (name, creatorId, callback) {
            addWorkspace(name, creatorId, true, callback);
        },

        //TODO: done
        createWorkspace: function (name, creatorId, callback) {
            addWorkspace(name, creatorId, false, callback);
        },

        //TODO: done
        getWorkspaces: function (userId, callback) {
            var queryRequest = db.query("SELECT workspaceId FROM OwnWorkspace WHERE userId = :userId", {
                params: {
                    userId: userId
                }
            });
            queryRequest.then(function (results) {

                var result = [];

                _.forEach(results, function (workspaceId) {
                    result.push(workspaceId);
                });

                callback(result);
            });
        },

        //TODO: done
        getWorkspace: function (workspaceId, callback) {
            var queryRequest = db.query("SELECT * FROM Workspace WHERE @rid = :workspaceId", {
                params: {
                    workspaceId: workspaceId
                }
            });
            queryRequest.then(function (results) {
                if (results.length > 0) {
                    var workspace = results[0];
                    callback({
                        id: workspaceId,
                        name: workspace.name,
                        creatorId: workspace.creatorId,
                        createdDate: workspace.createdDate
                    });
                } else {
                    throw 'Workspace not found';
                }
            });
        },

        //TODO: done
        getDefaultWorkspaceId: function (userId, callback) {
            var queryRequest = db.query("SELECT * FROM PermittedWorkspace WHERE userId = :userId", {
                params: {
                    userId: userId
                }
            });
            queryRequest.then(function (results) {
                if (results.length > 0) {
                    var permittedWorkspaces = results;
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
                                var workspaceId = encodeId(workspace);
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

        //TODO: done
        getAllWorkspaces: function (callback) {
            var queryRequest = db.query("SELECT * FROM Workspace");
            queryRequest.then(function (results) {
                var workspaces = results;

                var result = [];

                _.forEach(workspaces, function (workspace) {
                    result.push({
                        id: encodeId(workspace),
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