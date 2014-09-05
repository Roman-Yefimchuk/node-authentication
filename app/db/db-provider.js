"use strict";

module.exports = function (db, developmentMode) {

    var ROOT_ID = '@root';

    var asyncCycle = require('../utils/async-cycle');
    var security = require('../utils/security');
    var _ = require('underscore');

    function extractId(entity) {
        return entity['@rid'].toString();
    }

    function encodeId(entity) {
        var id = extractId(entity);
        return security.encodeBase64(id);
    }

    function decodeId(id) {
        return security.decodeBase64(id);
    }

    function getUserPermissionsForWorkspace(userId, workspaceId, callback) {
        db.query("" +
            "SELECT readOnly, collectionManager, accessManager " +
            "FROM PermittedWorkspace " +
            "WHERE userId = :userId AND workspaceId = :workspaceId", {
            params: {
                userId: userId,
                workspaceId: workspaceId
            }
        }).then(function (results) {
            if (results.length > 0) {
                var permittedWorkspace = results[0];
                callback({
                    readOnly: permittedWorkspace.readOnly,
                    collectionManager: permittedWorkspace.collectionManager,
                    accessManager: permittedWorkspace.accessManager
                });
            } else {
                callback({
                    readOnly: false,
                    collectionManager: false,
                    accessManager: false
                });
            }
        });
    }

    function getUsersCount(callback) {
        db.query("" +
            "SELECT COUNT(*) AS count " +
            "FROM UserAccount", {
        }).then(function (results) {
            callback(results[0].count);
        });
    }

    function getChildrenCount(parentWorkspaceId, callback) {
        db.query("" +
            "SELECT COUNT(*) AS count " +
            "FROM Workspace " +
            "WHERE parentWorkspaceId = :parentWorkspaceId", {
            params: {
                parentWorkspaceId: parentWorkspaceId
            }
        }).then(function (results) {
            callback(results[0].count);
        });
    }

    function getPermittedChildrenCount(userId, parentWorkspaceId, callback) {
        db.query("" +
            "SELECT COUNT(*) AS count " +
            "FROM PermittedWorkspace " +
            "WHERE userId = :userId AND parentWorkspaceId = :parentWorkspaceId", {
            params: {
                userId: userId,
                parentWorkspaceId: parentWorkspaceId
            }
        }).then(function (results) {
            callback(results[0].count);
        });
    }

    function isCreator(userId, workspaceId, callback) {
        db.query("" +
            "SELECT isOwn " +
            "FROM PermittedWorkspace " +
            "WHERE userId = :userId AND workspaceId = :workspaceId", {
            params: {
                userId: userId,
                workspaceId: workspaceId
            }
        }).then(function (results) {
            if (results.length > 0) {
                var permittedWorkspace = results[0];
                callback(permittedWorkspace.isOwn);
            } else {
                callback(false);
            }
        });
    }

    function createWorkspace(name, creatorId, parentWorkspaceId, isDefault, callback) {
        db.query("" +
            "INSERT INTO Workspace (name, creatorId, parentWorkspaceId, createDate) " +
            "VALUES (:name, :creatorId, :parentWorkspaceId, :createDate)", {
            params: {
                name: name,
                creatorId: creatorId,
                parentWorkspaceId: parentWorkspaceId || ROOT_ID,
                createDate: _.now()
            }
        }).then(function (results) {
            var workspace = results[0];
            var workspaceId = encodeId(workspace);

            db.query("" +
                "INSERT INTO PermittedWorkspace (userId, workspaceId, isOwn, isDefault, readOnly, collectionManager, accessManager, parentWorkspaceId) " +
                "VALUES (:userId, :workspaceId, :isOwn, :isDefault, :readOnly, :collectionManager, :accessManager, :parentWorkspaceId)", {
                params: {
                    userId: creatorId,
                    workspaceId: workspaceId,
                    isOwn: true,
                    isDefault: isDefault,
                    readOnly: true,
                    collectionManager: true,
                    accessManager: true,
                    parentWorkspaceId: parentWorkspaceId || ROOT_ID
                }
            }).then(function (results) {
                callback({
                    id: workspaceId,
                    name: workspace.name,
                    creatorId: workspace.creatorId,
                    createdDate: workspace.createdDate
                });
            });
        });
    }

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

    function wrapUserAccount(userAccount) {
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

                    db.query("" +
                        "UPDATE UserAccount " +
                        "SET " + formatParams(accountData) + " " +
                        "WHERE @rid = " + extractId(userAccount), {
                        params: accountData
                    }).then(function (results) {
                        successCallback(wrapUserAccount(userAccount));
                    }).catch(function (error) {
                        failureCallback(error);
                    });
                }
            };
        }
    }

    var dbProvider = {
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

            db.query("" +
                "INSERT INTO UserAccount (genericId, displayName, password, email, token, authorizationProvider, registeredDate) " +
                "VALUES (:genericId, :displayName, :password, :email, :token, :authorizationProvider, :registeredDate)", {
                params: {
                    genericId: data.genericId,
                    displayName: data.displayName,
                    password: data.password,
                    email: data.email,
                    token: data.token,
                    authorizationProvider: data.authorizationProvider,
                    registeredDate: data.registeredDate
                }
            }).then(function (results) {
                var userAccount = results[0];

                db.query("" +
                    "INSERT INTO User (accountId) " +
                    "VALUES (:accountId)", {
                    params: {
                        accountId: encodeId(userAccount)
                    }
                }).then(function (results) {
                    var user = results[0];
                    var userId = encodeId(user);

                    userAccount.userId = userId;

                    db.query("" +
                        "UPDATE UserAccount " +
                        "SET userId = :userId " +
                        "WHERE @rid = :id", {
                        params: {
                            userId: userId,
                            id: extractId(userAccount)
                        }
                    }).then(function (total) {
                        var userId = userAccount.userId;
                        var workspaceName = userAccount.displayName + '[' + userAccount.authorizationProvider + ']';

                        dbProvider.createDefaultWorkspace(workspaceName, userId, function (workspace) {
                            var workspaceId = workspace.id;
                            dbProvider.setUserWorkspaceId(userId, workspaceId, function () {
                                successCallback(wrapUserAccount(userAccount));
                            });
                        });
                    }).catch(function (error) {
                        failureCallback(error);
                    });
                }).catch(function (error) {
                    failureCallback(error);
                });
            }).catch(function (error) {
                failureCallback(error);
            });
        },
        findUser: function (genericId, callback) {

            var successCallback = callback.success;
            var failureCallback = callback.failure;

            db.query("" +
                "SELECT * " +
                "FROM UserAccount " +
                "WHERE genericId = :genericId", {
                params: {
                    genericId: genericId
                }
            }).then(function (results) {
                if (results.length > 0) {
                    successCallback(wrapUserAccount(results[0]));
                } else {
                    successCallback();
                }
            }).catch(function (error) {
                failureCallback(error);
            });
        },
        getItems: function (workspaceId, userId, callback) {
            db.query("" +
                "SELECT * " +
                "FROM Todo " +
                "WHERE workspaceId = :workspaceId", {
                params: {
                    workspaceId: workspaceId
                }
            }).then(function (results) {
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
        saveItem: function (workspaceId, userId, todoModel, callback) {
            db.query("" +
                "INSERT INTO Todo (workspaceId, creatorId, title, completed, createdDate) " +
                "VALUES (:workspaceId, :creatorId, :title, :completed, :createdDate)", {
                params: {
                    workspaceId: workspaceId,
                    creatorId: userId,
                    title: todoModel.title,
                    completed: todoModel.completed,
                    createdDate: _.now()
                }
            }).then(function (results) {
                var item = results[0];
                callback({
                    itemId: encodeId(item),
                    createdDate: item.createdDate
                });
            });
        },
        updateItems: function (workspaceId, userId, todoModels, callback) {
            asyncCycle(todoModels, function (todoModel, index, next) {
                db.query("" +
                    "UPDATE Todo " +
                    "SET title = :title, completed = :completed " +
                    "WHERE @rid = :id", {
                    params: {
                        id: decodeId(todoModel.id),
                        title: todoModel.title,
                        completed: todoModel.completed
                    }
                }).then(function (total) {
                    next();
                });
            }, function () {
                callback();
            });
        },
        removeItems: function (workspaceId, userId, todoIds, callback) {
            asyncCycle(todoIds, function (todoId, index, next) {
                db.query("" +
                    "DELETE FROM Todo " +
                    "WHERE @rid = :id", {
                    params: {
                        id: decodeId(todoId)
                    }
                }).then(function (total) {
                    next();
                });
            }, function () {
                callback();
            });
        },
        setUserWorkspaceId: function (userId, workspaceId, callback) {
            db.query("" +
                "UPDATE User " +
                "SET currentWorkspaceId = :currentWorkspaceId " +
                "WHERE @rid = :id", {
                params: {
                    currentWorkspaceId: workspaceId,
                    id: decodeId(userId)
                }
            }).then(function (total) {
                if (total.length > 0) {
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
        getUserWorkspaceId: function (userId, callback) {
            db.query("" +
                "SELECT currentWorkspaceId " +
                "FROM User " +
                "WHERE @rid = :id", {
                params: {
                    id: decodeId(userId)
                }
            }).then(function (results) {
                if (results.length > 0) {
                    var user = results[0];
                    var workspaceId = user.currentWorkspaceId;
                    callback(workspaceId);
                } else {
                    throw 'User not found';
                }
            });
        },
        createDefaultWorkspace: function (name, creatorId, callback) {
            createWorkspace(name, creatorId, ROOT_ID, true, callback);
        },
        createWorkspace: function (name, creatorId, parentWorkspaceId, callback) {
            createWorkspace(name, creatorId, parentWorkspaceId, false, callback);
        },
        //TODO: return not only ID
        getWorkspaces: function (userId, callback) {
            db.query("" +
                "SELECT workspaceId " +
                "FROM OwnWorkspace " +
                "WHERE userId = :userId", {
                params: {
                    userId: userId
                }
            }).then(function (results) {

                var result = [];

                _.forEach(results, function (workspaceId) {
                    result.push(workspaceId);
                });

                callback(result);
            });
        },
        getWorkspace: function (workspaceId, callback) {
            db.query("" +
                "SELECT * " +
                "FROM Workspace " +
                "WHERE @rid = :id", {
                params: {
                    id: decodeId(workspaceId)
                }
            }).then(function (results) {
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
        getDefaultWorkspaceId: function (userId, callback) {
            db.query("" +
                "SELECT workspaceId " +
                "FROM PermittedWorkspace " +
                "WHERE userId = :userId AND isDefault = true", {
                params: {
                    userId: userId
                }
            }).then(function (results) {
                if (results.length > 0) {
                    var permittedWorkspace = results[0];
                    var workspaceId = permittedWorkspace.workspaceId;
                    callback(workspaceId);
                } else {
                    throw 'User not found';
                }
            });
        },
        getUser: function (userId, callback) {
            db.query("" +
                "SELECT displayName, registeredDate " +
                "FROM UserAccount " +
                "WHERE userId = :userId", {
                params: {
                    userId: userId
                }
            }).then(function (results) {
                if (results.length > 0) {
                    var userAccount = results[0];
                    callback({
                        id: userId,
                        displayName: userAccount.displayName,
                        registeredDate: userAccount.registeredDate
                    });
                } else {
                    throw 'User not found';
                }
            });
        },
        getUsers: function (ids, callback) {
            var result = [];

            asyncCycle(ids, function (userId, index, next) {
                db.query("" +
                    "SELECT displayName, registeredDate " +
                    "FROM UserAccount " +
                    "WHERE userId = :userId", {
                    params: {
                        userId: userId
                    }
                }).then(function (results) {

                    var userAccount = results[0];

                    result.push({
                        id: userId,
                        displayName: userAccount.displayName,
                        registeredDate: userAccount.registeredDate
                    });

                    next();
                });
            }, function () {
                callback(result);
            });
        },
        getPermittedWorkspaces: function (userId, parentWorkspaceId, callback) {
            db.query("" +
                "SELECT * " +
                "FROM PermittedWorkspace " +
                "WHERE userId = :userId AND parentWorkspaceId = :parentWorkspaceId", {
                params: {
                    userId: userId,
                    parentWorkspaceId: parentWorkspaceId || ROOT_ID
                }
            }).then(function (results) {
                var permittedWorkspaces = results;

                var result = [];

                asyncCycle(permittedWorkspaces, function (permittedWorkspace, index, next) {
                    db.query("" +
                        "SELECT * " +
                        "FROM Workspace " +
                        "WHERE @rid = :id", {
                        params: {
                            id: decodeId(permittedWorkspace.workspaceId)
                        }
                    }).then(function (results) {
                        var workspace = results[0];
                        var workspaceId = permittedWorkspace.workspaceId;

                        getPermittedChildrenCount(userId, workspaceId, function (childrenCount) {
                            result.push({
                                id: permittedWorkspace.workspaceId,
                                name: workspace.name,
                                creatorId: workspace.creatorId,
                                createdDate: workspace.createdDate,
                                childrenCount: childrenCount,
                                permissions: {
                                    readOnly: permittedWorkspace.readOnly,
                                    collectionManager: permittedWorkspace.collectionManager,
                                    accessManager: permittedWorkspace.accessManager
                                }
                            });

                            next();
                        });
                    });
                }, function () {
                    callback(result);
                });
            });
        },
        getAllWorkspaces: function (parentWorkspaceId, callback) {
            db.query("" +
                "SELECT * " +
                "FROM Workspace " +
                "WHERE parentWorkspaceId = :parentWorkspaceId", {
                params: {
                    parentWorkspaceId: parentWorkspaceId || ROOT_ID
                }
            }).then(function (results) {
                var workspaces = results;

                var result = [];

                asyncCycle(workspaces, function (workspace, index, next) {

                    var workspaceId = encodeId(workspace);

                    getChildrenCount(workspaceId, function (childrenCount) {
                        result.push({
                            id: encodeId(workspace),
                            name: workspace.name,
                            creatorId: workspace.creatorId,
                            createdDate: workspace.createdDate,
                            childrenCount: childrenCount
                        });

                        next();
                    });

                }, function () {
                    callback(result);
                });
            });
        },
        getUsersCount: function (callback) {
            getUsersCount(callback);
        },
        getAllUsers: function (skip, limit, callback) {
            getUsersCount(function (count) {
                if (count > 0) {
                    db.query("" +
                        "SELECT userId, displayName, registeredDate " +
                        "FROM UserAccount SKIP " + skip + " LIMIT " + limit, {
                    }).then(function (results) {
                        var usersAccount = results;

                        var users = [];

                        asyncCycle(usersAccount, function (userAccount, index, next) {
                            users.push({
                                id: userAccount.userId,
                                displayName: userAccount.displayName,
                                registeredDate: userAccount.registeredDate
                            });

                            next();
                        }, function () {
                            callback({
                                users: users,
                                count: count
                            });
                        });
                    });
                } else {
                    callback({
                        users: [],
                        count: 0
                    });
                }
            });
        },
        getAllUsersWithPermissions: function (workspaceId, skip, limit, callback) {
            getUsersCount(function (count) {
                if (count > 0) {
                    db.query("" +
                        "SELECT userId, displayName, registeredDate " +
                        "FROM UserAccount SKIP " + skip + " LIMIT " + limit, {
                    }).then(function (results) {
                        var usersAccount = results;

                        var users = [];

                        asyncCycle(usersAccount, function (userAccount, index, next) {
                            var userId = userAccount.userId;

                            getUserPermissionsForWorkspace(userId, workspaceId, function (permissions) {
                                isCreator(userId, workspaceId, function (isCreator) {
                                    users.push({
                                        id: userId,
                                        displayName: userAccount.displayName,
                                        permissions: permissions,
                                        isCreator: isCreator,
                                        registeredDate: userAccount.registeredDate
                                    });

                                    next();
                                })
                            });
                        }, function () {
                            callback({
                                users: users,
                                count: count
                            });
                        });
                    });
                } else {
                    callback({
                        users: [],
                        count: 0
                    });
                }
            });
        },
        isAccessGrantedForWorkspace: function (userId, workspaceId, callback) {
            getUserPermissionsForWorkspace(userId, workspaceId, function (permissions) {
                if (permissions.readOnly || permissions.collectionManager || permissions.accessManager) {
                    callback(true);
                } else {
                    callback(false);
                }
            });
        },
        setUsersPermissionsForWorkspace: function (workspaceId, collection, callback) {
            asyncCycle(collection, function (collectionItem, index, next) {
                var userId = collectionItem.userId;
                var permissions = collectionItem.permissions;
                var isAccessGranted = permissions.readOnly || permissions.collectionManager || permissions.accessManager;

                if (isAccessGranted) {
                    db.query("" +
                        "SELECT COUNT(*) AS count " +
                        "FROM PermittedWorkspace " +
                        "WHERE userId = :userId AND workspaceId = :workspaceId", {
                        params: {
                            userId: userId,
                            workspaceId: workspaceId
                        }
                    }).then(function (results) {
                        if (results[0].count > 0) {
                            db.query("" +
                                "UPDATE PermittedWorkspace " +
                                "SET readOnly = :readOnly, collectionManager = :collectionManager, accessManager = :accessManager " +
                                "WHERE userId = :userId AND workspaceId = :workspaceId", {
                                params: {
                                    userId: userId,
                                    workspaceId: workspaceId,
                                    readOnly: permissions.readOnly,
                                    collectionManager: permissions.collectionManager,
                                    accessManager: permissions.accessManager
                                }
                            }).then(function (total) {
                                next();
                            });
                        } else {
                            db.query("" +
                                "INSERT INTO PermittedWorkspace (userId, workspaceId, isOwn, isDefault, readOnly, collectionManager, accessManager) " +
                                "VALUES (:userId, :workspaceId, :isOwn, :isDefault, :readOnly, :collectionManager, :accessManager)", {
                                params: {
                                    userId: userId,
                                    workspaceId: workspaceId,
                                    isOwn: false,
                                    isDefault: false,
                                    readOnly: permissions.readOnly,
                                    collectionManager: permissions.collectionManager,
                                    accessManager: permissions.accessManager
                                }
                            }).then(function (results) {
                                next();
                            });
                        }
                    });
                } else {
                    db.query("" +
                        "DELETE FROM PermittedWorkspace " +
                        "WHERE userId = :userId AND workspaceId = :workspaceId", {
                        params: {
                            userId: userId,
                            workspaceId: workspaceId
                        }
                    }).then(function (total) {
                        next();
                    });
                }
            }, function () {
                callback();
            });
        }
    };

    return dbProvider;
};