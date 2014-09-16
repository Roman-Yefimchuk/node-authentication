"use strict";

module.exports = function (db, developmentMode) {

    var ROOT_ID = '@root';

    var syncCycle = require('../utils/sync-cycle');
    var security = require('../utils/security');
    var _ = require('underscore');

    function extractId(entity) {
        if (entity) {
            return entity['@rid'].toString();
        }
    }

    function encodeId(entity) {
        if (entity) {
            var id = extractId(entity);
            return security.encodeBase64(id);
        }
    }

    function decodeId(id) {
        if (id) {
            return security.decodeBase64(id);
        }
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
        }).catch(function (error) {
            throw error;
        });
    }

    function getUsersCount(callback) {
        db.query("" +
            "SELECT COUNT(*) AS count " +
            "FROM UserAccount", {
        }).then(function (results) {
            callback(results[0].count);
        }).catch(function (error) {
            throw error;
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
        }).catch(function (error) {
            throw error;
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
        }).catch(function (error) {
            throw error;
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
        }).catch(function (error) {
            throw error;
        });
    }

    function addOwnWorkspace(userId, workspaceId, callback) {
        db.query("" +
            "UPDATE User " +
            "ADD ownWorkspaces = :workspaceId " +
            "WHERE @rid = :id", {
            params: {
                id: decodeId(userId),
                workspaceId: decodeId(workspaceId)
            }
        }).then(function (results) {
            callback();
        }).catch(function (error) {
            throw error;
        });
    }

    function removeOwnWorkspace(userId, workspaceId, callback) {
        db.query("" +
            "UPDATE User " +
            "REMOVE ownWorkspaces = :workspaceId " +
            "WHERE @rid = :id", {
            params: {
                id: decodeId(userId),
                workspaceId: decodeId(workspaceId)
            }
        }).then(function (results) {
            callback();
        }).catch(function (error) {
            throw error;
        });
    }

    function createWorkspace(name, creatorId, parentWorkspaceId, isDefault, callback) {
        db.query("" +
            "INSERT INTO Workspace (name, creatorId, parentWorkspaceId, creationDate) " +
            "VALUES (:name, :creatorId, :parentWorkspaceId, :creationDate)", {
            params: {
                name: name,
                creatorId: creatorId,
                parentWorkspaceId: parentWorkspaceId || ROOT_ID,
                creationDate: _.now()
            }
        }).then(function (results) {
            var workspace = results[0];
            var workspaceId = encodeId(workspace);

            addOwnWorkspace(creatorId, workspaceId, function () {
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
                        creationDate: workspace.creationDate
                    });
                }).catch(function (error) {
                    throw error;
                });
            });
        }).catch(function (error) {
            throw error;
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
                    "INSERT INTO User (accountId, role) " +
                    "VALUES (:accountId, :role)", {
                    params: {
                        accountId: encodeId(userAccount),
                        role: 'user'
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
                            dbProvider.setUserWorkspaceId(userId, workspaceId, workspaceId, function () {
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
                        creationDate: item.creationDate
                    });
                });

                callback(result);
            }).catch(function (error) {
                throw error;
            });
        },
        saveItem: function (workspaceId, userId, todoModel, callback) {
            db.query("" +
                "INSERT INTO Todo (workspaceId, creatorId, title, completed, creationDate) " +
                "VALUES (:workspaceId, :creatorId, :title, :completed, :creationDate)", {
                params: {
                    workspaceId: workspaceId,
                    creatorId: userId,
                    title: todoModel.title,
                    completed: todoModel.completed,
                    creationDate: _.now()
                }
            }).then(function (results) {
                var item = results[0];
                callback({
                    itemId: encodeId(item),
                    creationDate: item.creationDate
                });
            }).catch(function (error) {
                throw error;
            });
        },
        updateItems: function (workspaceId, userId, todoModels, callback) {
            syncCycle(todoModels, function (todoModel, index, next) {
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
                }).catch(function (error) {
                    throw error;
                });
            }, function () {
                callback();
            });
        },
        removeItems: function (workspaceId, userId, todoIds, callback) {
            syncCycle(todoIds, function (todoId, index, next) {
                db.query("" +
                    "DELETE FROM Todo " +
                    "WHERE @rid = :id", {
                    params: {
                        id: decodeId(todoId)
                    }
                }).then(function (total) {
                    next();
                }).catch(function (error) {
                    throw error;
                });
            }, function () {
                callback();
            });
        },
        setUserWorkspaceId: function (userId, workspaceId, rootWorkspaceId, callback) {
            db.query("" +
                "UPDATE User " +
                "SET currentWorkspaceId = :currentWorkspaceId, currentRootWorkspaceId = :currentRootWorkspaceId " +
                "WHERE @rid = :id", {
                params: {
                    currentWorkspaceId: workspaceId,
                    currentRootWorkspaceId: rootWorkspaceId,
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
            }).catch(function (error) {
                throw error;
            });
        },
        getUserWorkspaceId: function (userId, callback) {
            db.query("" +
                "SELECT currentWorkspaceId, currentRootWorkspaceId " +
                "FROM User " +
                "WHERE @rid = :id", {
                params: {
                    id: decodeId(userId)
                }
            }).then(function (results) {
                if (results.length > 0) {
                    var user = results[0];

                    var workspaceId = user.currentWorkspaceId;
                    var rootWorkspaceId = user.currentRootWorkspaceId;

                    callback(workspaceId, rootWorkspaceId);
                } else {
                    throw 'User not found';
                }
            }).catch(function (error) {
                throw error;
            });
        },
        createDefaultWorkspace: function (name, creatorId, callback) {
            createWorkspace(name, creatorId, ROOT_ID, true, callback);
        },
        createWorkspace: function (name, creatorId, parentWorkspaceId, callback) {
            createWorkspace(name, creatorId, parentWorkspaceId, false, callback);
        },
        updateWorkspace: function (workspaceId, data, callback) {
            db.query("" +
                "UPDATE Workspace " +
                "SET name = :name " +
                "WHERE @rid = :id", {
                params: {
                    id: decodeId(workspaceId),
                    name: data.name
                }
            }).then(function (total) {
                callback();
            }).catch(function (error) {
                throw error;
            });
        },
        removeWorkspace: function (userId, workspaceId, callback) {

            var removedWorkspaces = [];

            function pushWorkspace(workspace) {
                removedWorkspaces.push({
                    id: encodeId(workspace),
                    name: workspace.name
                });
            }

            function removeRecords(workspaceId, callback) {
                db.query("" +
                    "DELETE FROM Todo " +
                    "WHERE workspaceId = :workspaceId", {
                    params: {
                        workspaceId: workspaceId
                    }
                }).then(function (total) {
                    callback();
                }).catch(function (error) {
                    throw error;
                });
            }

            function removeChildren(stack) {
                if (stack.length > 0) {
                    var parentWorkspaceId = stack.pop();

                    db.query("" +
                        "DELETE FROM Workspace " +
                        "RETURN BEFORE " +
                        "WHERE parentWorkspaceId = :parentWorkspaceId", {
                        params: {
                            parentWorkspaceId: parentWorkspaceId
                        }
                    }).then(function (results) {

                        syncCycle(results, function (workspace, index, next) {
                            pushWorkspace(workspace);

                            var workspaceId = encodeId(workspace);
                            stack.push(workspaceId);

                            removeOwnWorkspace(workspace.creatorId, workspaceId, function () {
                                next();
                            });
                        }, function () {
                            db.query("" +
                                "DELETE FROM PermittedWorkspace " +
                                "WHERE parentWorkspaceId = :parentWorkspaceId", {
                                params: {
                                    parentWorkspaceId: parentWorkspaceId
                                }
                            }).then(function (results) {
                                removeRecords(workspaceId, function () {
                                    removeChildren(stack);
                                });
                            }).catch(function (error) {
                                throw error;
                            });
                        });
                    }).catch(function (error) {
                        throw error;
                    });
                } else {
                    callback(removedWorkspaces);
                }
            }

            db.query("" +
                "DELETE FROM Workspace " +
                "RETURN BEFORE " +
                "WHERE @rid = :id", {
                params: {
                    id: decodeId(workspaceId)
                }
            }).then(function (results) {

                var workspace = results[0];
                var workspaceId = encodeId(workspace);

                pushWorkspace(workspace);

                removeOwnWorkspace(workspace.creatorId, workspaceId, function () {
                    db.query("" +
                        "DELETE FROM PermittedWorkspace " +
                        "WHERE workspaceId = :workspaceId", {
                        params: {
                            workspaceId: workspaceId
                        }
                    }).then(function (results) {
                        removeRecords(workspaceId, function () {
                            removeChildren([workspaceId]);
                        });
                    }).catch(function (error) {
                        throw error;
                    });
                });
            }).catch(function (error) {
                throw error;
            });
        },
        getWorkspaces: function (userId, callback) {
            db.query("" +
                "SELECT expand(ownWorkspaces) " +
                "FROM User " +
                "WHERE @rid = :id", {
                params: {
                    id: decodeId(userId)
                }
            }).then(function (results) {

                var result = [];

                _.forEach(results, function (item) {
                    var value = item.value;
                    var workspaceId = security.encodeBase64(value);
                    result.push(workspaceId);
                });

                callback(result);
            }).catch(function (error) {
                throw error;
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
                        creationDate: workspace.creationDate
                    });
                } else {
                    throw 'Workspace not found';
                }
            }).catch(function (error) {
                throw error;
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
            }).catch(function (error) {
                throw error;
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
            }).catch(function (error) {
                throw error;
            });
        },
        getUsers: function (ids, callback) {
            var result = [];

            syncCycle(ids, function (userId, index, next) {
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
                }).catch(function (error) {
                    throw error;
                });
            }, function () {
                callback(result);
            });
        },
        loadHierarchy: function (userId, workspaceId, rootWorkspaceId, callback) {

            var result = [];

            function loadHierarchy(workspaceId) {
                if (rootWorkspaceId == workspaceId) {
                    callback('success', result.reverse());
                } else {
                    db.query("" +
                        "SELECT * " +
                        "FROM PermittedWorkspace " +
                        "WHERE userId = :userId AND workspaceId = :workspaceId", {
                        params: {
                            userId: userId,
                            workspaceId: workspaceId
                        }
                    }).then(function (results) {
                        if (results.length > 0) {
                            var permittedWorkspace = results[0];

                            dbProvider.isAccessGrantedForWorkspace(userId, workspaceId, function (isAccessGranted) {
                                if (isAccessGranted) {

                                    var workspaceId = permittedWorkspace.workspaceId;
                                    result.push(workspaceId);

                                    loadHierarchy(permittedWorkspace.parentWorkspaceId);
                                } else {
                                    callback('access_denied');
                                }
                            });
                        } else {
                            callback('not_found');
                        }
                    }).catch(function (error) {
                        throw error;
                    });
                }
            }

            loadHierarchy(workspaceId);
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

                syncCycle(permittedWorkspaces, function (permittedWorkspace, index, next) {
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
                                creationDate: workspace.creationDate,
                                childrenCount: childrenCount,
                                permissions: {
                                    readOnly: permittedWorkspace.readOnly,
                                    collectionManager: permittedWorkspace.collectionManager,
                                    accessManager: permittedWorkspace.accessManager
                                }
                            });

                            next();
                        });
                    }).catch(function (error) {
                        throw error;
                    });
                }, function () {
                    callback(result);
                });
            }).catch(function (error) {
                throw error;
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

                syncCycle(workspaces, function (workspace, index, next) {

                    var workspaceId = encodeId(workspace);

                    getChildrenCount(workspaceId, function (childrenCount) {
                        result.push({
                            id: encodeId(workspace),
                            name: workspace.name,
                            creatorId: workspace.creatorId,
                            creationDate: workspace.creationDate,
                            childrenCount: childrenCount
                        });

                        next();
                    });

                }, function () {
                    callback(result);
                });
            }).catch(function (error) {
                throw error;
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
                        "FROM UserAccount SKIP :skip LIMIT :limit", {
                        params: {
                            skip: skip,
                            limit: limit
                        }
                    }).then(function (results) {
                        var usersAccount = results;

                        var users = [];

                        syncCycle(usersAccount, function (userAccount, index, next) {
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
                    }).catch(function (error) {
                        throw error;
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
                        "FROM UserAccount SKIP :skip LIMIT :limit", {
                        params: {
                            skip: skip,
                            limit: limit
                        }
                    }).then(function (results) {
                        var usersAccount = results;

                        var users = [];

                        syncCycle(usersAccount, function (userAccount, index, next) {
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
                    }).catch(function (error) {
                        throw error;
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
        setUsersPermissionsForWorkspace: function (workspaceId, parentWorkspaceId, collection, callback) {
            syncCycle(collection, function (collectionItem, index, next) {

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
                            }).catch(function (error) {
                                throw error;
                            });
                        } else {
                            db.query("" +
                                "INSERT INTO PermittedWorkspace (userId, workspaceId, isOwn, isDefault, readOnly, collectionManager, accessManager, parentWorkspaceId) " +
                                "VALUES (:userId, :workspaceId, :isOwn, :isDefault, :readOnly, :collectionManager, :accessManager, :parentWorkspaceId)", {
                                params: {
                                    userId: userId,
                                    workspaceId: workspaceId,
                                    isOwn: false,
                                    isDefault: false,
                                    readOnly: permissions.readOnly,
                                    collectionManager: permissions.collectionManager,
                                    accessManager: permissions.accessManager,
                                    parentWorkspaceId: parentWorkspaceId || ROOT_ID
                                }
                            }).then(function (results) {
                                next();
                            }).catch(function (error) {
                                throw error;
                            });
                        }
                    }).catch(function (error) {
                        throw error;
                    });
                } else {
                    db.query("" +
                        "DELETE FROM PermittedWorkspace " +
                        "RETURN BEFORE " +
                        "WHERE userId = :userId AND workspaceId = :workspaceId", {
                        params: {
                            userId: userId,
                            workspaceId: workspaceId
                        }
                    }).then(function (results) {

                        var workspaceId = results[0].workspaceId;

                        function closeAccessForChildren(stack) {
                            if (stack.length > 0) {
                                var parentWorkspaceId = stack.pop();

                                db.query("" +
                                    "DELETE FROM PermittedWorkspace " +
                                    "RETURN BEFORE " +
                                    "WHERE userId = :userId AND parentWorkspaceId = :parentWorkspaceId", {
                                    params: {
                                        userId: userId,
                                        parentWorkspaceId: parentWorkspaceId
                                    }
                                }).then(function (results) {

                                    _.forEach(results, function (permittedWorkspace) {
                                        var workspaceId = permittedWorkspace.workspaceId;
                                        stack.push(workspaceId);
                                    });

                                    closeAccessForChildren(stack);
                                }).catch(function (error) {
                                    throw error;
                                });
                            } else {
                                next();
                            }
                        }

                        closeAccessForChildren([workspaceId]);
                    }).catch(function (error) {
                        throw error;
                    });
                }
            }, function () {
                callback();
            });
        }
    };

    return dbProvider;
};