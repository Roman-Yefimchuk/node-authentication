"use strict";

module.exports = function (db, developmentMode) {

    var ROOT_ID = '@root';

    var _ = require('underscore');

    var asyncEach = require('../utils/async-each');
    var security = require('../utils/security');

    var encodeBase64 = security.encodeBase64;
    var decodeBase64 = security.decodeBase64;

    function extractPropertyId(property) {
        if (property) {
            return (property['rid'] || property['@rid']).toString();
        }
    }

    function encodePropertyId(property) {
        if (property) {
            var id = extractPropertyId(property);
            return encodeBase64(id);
        }
    }

    function encodeId(id) {
        if (id) {
            return decodeBase64(id);
        }
    }

    function decodeId(id) {
        if (id) {
            return decodeBase64(id);
        }
    }

    function getUserPermissionsForWorkspace(userId, workspaceId, callback) {
        db.query("" +
            "SELECT reader, writer, admin " +
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
                    reader: permittedWorkspace.reader || false,
                    writer: permittedWorkspace.writer || false,
                    admin: permittedWorkspace.admin || false
                });
            } else {
                callback({
                    reader: false,
                    writer: false,
                    admin: false
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

    function addUserToGroup(userId, groupName, callback) {
        db.query("" +
            "UPDATE Group " +
            "ADD users = :userId " +
            "WHERE name = :name", {
            params: {
                userId: decodeId(userId),
                name: groupName
            }
        }).then(function (results) {
            callback();
        }).catch(function (error) {
            throw error;
        });
    }

    function removeUserFromGroup(userId, groupName, callback) {
        db.query("" +
            "UPDATE Group " +
            "REMOVE users = :userId " +
            "WHERE name = :name", {
            params: {
                userId: decodeId(userId),
                name: groupName
            }
        }).then(function (results) {
            callback();
        }).catch(function (error) {
            throw error;
        });
    }

    function getHierarchyLevel(workspaceId, callback) {
        if (workspaceId == ROOT_ID) {
            callback(0);
        } else {
            db.query("" +
                "SELECT hierarchyLevel " +
                "FROM Workspace " +
                "WHERE @rid = :id", {
                params: {
                    id: decodeId(workspaceId)
                }
            }).then(function (results) {
                var hierarchyLevel = results[0].hierarchyLevel;
                callback(hierarchyLevel);
            }).catch(function (error) {
                throw error;
            });
        }
    }

    function getWorkspaceName(workspaceId, callback) {
        if (workspaceId == ROOT_ID) {
            callback(ROOT_ID);
        } else {
            db.query("" +
                "SELECT name " +
                "FROM Workspace " +
                "WHERE @rid = :id", {
                params: {
                    id: decodeId(workspaceId)
                }
            }).then(function (results) {
                var name = results[0].name;
                callback(name);
            }).catch(function (error) {
                throw error;
            });
        }
    }

    function createWorkspaceImpl(name, creatorId, parentWorkspaceId, isDefault, callback) {
        getHierarchyLevel(parentWorkspaceId, function (hierarchyLevel) {
            db.query("" +
                "INSERT INTO Workspace (name, creatorId, parentWorkspaceId, creationDate, hierarchyLevel) " +
                "VALUES (:name, :creatorId, :parentWorkspaceId, :creationDate, :hierarchyLevel)", {
                params: {
                    name: name,
                    creatorId: creatorId,
                    parentWorkspaceId: parentWorkspaceId || ROOT_ID,
                    creationDate: _.now(),
                    hierarchyLevel: hierarchyLevel + 1
                }
            }).then(function (results) {
                var workspace = results[0];
                var workspaceId = encodePropertyId(workspace);

                addOwnWorkspace(creatorId, workspaceId, function () {
                    db.query("" +
                        "INSERT INTO PermittedWorkspace (userId, workspaceId, isOwn, isDefault, reader, writer, admin, parentWorkspaceId, isAvailable) " +
                        "VALUES (:userId, :workspaceId, :isOwn, :isDefault, :reader, :writer, :admin, :parentWorkspaceId, :isAvailable)", {
                        params: {
                            userId: creatorId,
                            workspaceId: workspaceId,
                            isOwn: true,
                            isDefault: isDefault,
                            reader: true,
                            writer: true,
                            admin: true,
                            parentWorkspaceId: parentWorkspaceId || ROOT_ID,
                            isAvailable: true
                        }
                    }).then(function (results) {
                        callback({
                            id: workspaceId,
                            name: workspace.name,
                            creatorId: workspace.creatorId,
                            creationDate: workspace.creationDate,
                            isAvailable: true
                        });
                    }).catch(function (error) {
                        throw error;
                    });
                });
            }).catch(function (error) {
                throw error;
            });
        });
    }

    function getParentWorkspaceId(workspaceId, callback) {
        if (workspaceId == ROOT_ID) {
            callback();
        } else {
            db.query("" +
                "SELECT parentWorkspaceId " +
                "FROM Workspace " +
                "WHERE @rid = :id", {
                params: {
                    id: decodeId(workspaceId)
                }
            }).then(function (results) {
                var parentWorkspaceId = results[0].parentWorkspaceId;
                callback(parentWorkspaceId, workspaceId);
            }).catch(function (error) {
                throw error;
            });
        }
    }

    function quickLoadHierarchy(workspaceId, callback) {

        var hierarchy = [];

        function quickLoadHierarchy(workspaceId) {
            if (workspaceId == ROOT_ID) {

                hierarchy.unshift(workspaceId);

                callback(hierarchy);
            } else {
                db.query("" +
                    "SELECT parentWorkspaceId " +
                    "FROM Workspace " +
                    "WHERE @rid = :id", {
                    params: {
                        id: decodeId(workspaceId)
                    }
                }).then(function (results) {

                    var parentWorkspaceId = results[0].parentWorkspaceId;
                    hierarchy.unshift(workspaceId);

                    quickLoadHierarchy(parentWorkspaceId);
                }).catch(function (error) {
                    throw error;
                });
            }
        }

        quickLoadHierarchy(workspaceId || ROOT_ID);
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
                        "WHERE @rid = " + extractPropertyId(userAccount), {
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

    function createUser(data, callback) {

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
                    accountId: encodePropertyId(userAccount)
                }
            }).then(function (results) {
                var user = results[0];
                var userId = encodePropertyId(user);

                addUserToGroup(userId, 'users', function () {

                    userAccount.userId = userId;

                    db.query("" +
                        "UPDATE UserAccount " +
                        "SET userId = :userId " +
                        "WHERE @rid = :id", {
                        params: {
                            userId: userId,
                            id: extractPropertyId(userAccount)
                        }
                    }).then(function (total) {
                        var userId = userAccount.userId;
                        var workspaceName = userAccount.displayName + '[' + userAccount.authorizationProvider + ']';

                        createDefaultWorkspace(workspaceName, userId, function (workspace) {

                            var workspaceId = workspace.id;
                            setUserWorkspaceId(userId, workspaceId, workspaceId, function () {
                                var account = wrapUserAccount(userAccount);
                                successCallback(account);
                            });
                        });
                    }).catch(function (error) {
                        failureCallback(error);
                    });
                });
            }).catch(function (error) {
                failureCallback(error);
            });
        }).catch(function (error) {
            failureCallback(error);
        });
    }

    function findUser(genericId, callback) {

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
                var account = wrapUserAccount(results[0]);
                successCallback(account);
            } else {
                successCallback();
            }
        }).catch(function (error) {
            failureCallback(error);
        });
    }

    function getItems(workspaceId, userId, callback) {
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
                    id: encodePropertyId(item),
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
    }

    function saveItem(workspaceId, userId, todoModel, callback) {
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
                itemId: encodePropertyId(item),
                creationDate: item.creationDate
            });
        }).catch(function (error) {
            throw error;
        });
    }

    function updateItems(workspaceId, userId, todoModels, callback) {
        asyncEach(todoModels, function (todoModel, index, next) {
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
    }

    function removeItems(workspaceId, userId, todoIds, callback) {
        asyncEach(todoIds, function (todoId, index, next) {
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
    }

    function setUserWorkspaceId(userId, workspaceId, rootWorkspaceId, callback) {
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
    }

    function getUserWorkspaceId(userId, callback) {
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
    }

    function createDefaultWorkspace(name, creatorId, callback) {
        createWorkspaceImpl(name, creatorId, ROOT_ID, true, callback);
    }

    function createWorkspace(name, creatorId, parentWorkspaceId, callback) {
        createWorkspaceImpl(name, creatorId, parentWorkspaceId, false, callback);
    }

    function updateWorkspace(workspaceId, data, callback) {
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
    }

    function removeWorkspace(userId, workspaceId, callback) {

        var removedWorkspaces = [];

        function pushWorkspace(workspace) {
            removedWorkspaces.push({
                id: encodePropertyId(workspace),
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

                    asyncEach(results, function (workspace, index, next) {
                        pushWorkspace(workspace);

                        var workspaceId = encodePropertyId(workspace);
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
            var workspaceId = encodePropertyId(workspace);

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
    }

    function getWorkspaces(userId, callback) {
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
                var workspaceId = encodeBase64(value);
                result.push(workspaceId);
            });

            callback(result);
        }).catch(function (error) {
            throw error;
        });
    }

    function getWorkspace(workspaceId, callback) {
        db.query("" +
            "SELECT name, creatorId, creationDate " +
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
    }

    function getDefaultWorkspaceId(userId, callback) {
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
    }

    function getUser(userId, callback) {
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
    }

    function getUsers(ids, callback) {
        var result = [];

        asyncEach(ids, function (userId, index, next) {
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
    }

    function loadHierarchy(userId, workspaceId, rootWorkspaceId, callback) {

        var result = [];

        function loadHierarchy(workspaceId) {
            if (rootWorkspaceId == workspaceId) {
                callback('success', result);
            } else {
                db.query("" +
                    "SELECT workspaceId, parentWorkspaceId " +
                    "FROM PermittedWorkspace " +
                    "WHERE userId = :userId AND workspaceId = :workspaceId", {
                    params: {
                        userId: userId,
                        workspaceId: workspaceId
                    }
                }).then(function (results) {
                    if (results.length > 0) {

                        var workspaceId = results[0].workspaceId;
                        var parentWorkspaceId = results[0].parentWorkspaceId;

                        result.unshift(workspaceId);

                        loadHierarchy(parentWorkspaceId);
                    } else {
                        callback('not_found');
                    }
                }).catch(function (error) {
                    throw error;
                });
            }
        }

        loadHierarchy(workspaceId);
    }

    function getPermittedWorkspaces(userId, parentWorkspaceId, callback) {
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

            asyncEach(permittedWorkspaces, function (permittedWorkspace, index, next) {
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

                        if (permittedWorkspace.isAvailable) {

                            result.push({
                                id: permittedWorkspace.workspaceId,
                                name: workspace.name,
                                creatorId: workspace.creatorId,
                                creationDate: workspace.creationDate,
                                childrenCount: childrenCount,
                                permissions: {
                                    reader: permittedWorkspace.reader,
                                    writer: permittedWorkspace.writer,
                                    admin: permittedWorkspace.admin
                                },
                                isAvailable: true
                            });

                            next();
                        } else {

                            result.push({
                                id: permittedWorkspace.workspaceId,
                                name: workspace.name,
                                creationDate: workspace.creationDate,
                                childrenCount: childrenCount,
                                isAvailable: false
                            });

                            next();
                        }
                    });
                }).catch(function (error) {
                    throw error;
                });
            }, function () {

                result = _.sortBy(result, function (item) {
                    return item.creationDate;
                });

                callback(result);
            });
        }).catch(function (error) {
            throw error;
        });
    }

    function getAllWorkspaces(parentWorkspaceId, callback) {
        db.query("" +
            "SELECT @rid, name " +
            "FROM Workspace " +
            "WHERE parentWorkspaceId = :parentWorkspaceId", {
            params: {
                parentWorkspaceId: parentWorkspaceId || ROOT_ID
            }
        }).then(function (results) {
            var workspaces = results;

            var result = [];

            asyncEach(workspaces, function (workspace, index, next) {

                var workspaceId = encodePropertyId(workspace);

                getChildrenCount(workspaceId, function (childrenCount) {
                    result.push({
                        id: workspaceId,
                        name: workspace.name,
                        childrenCount: childrenCount,
                        isAvailable: true
                    });

                    next();
                });

            }, function () {
                callback(result);
            });
        }).catch(function (error) {
            throw error;
        });
    }

    function getAllUsers(skip, limit, callback) {
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

                    asyncEach(usersAccount, function (userAccount, index, next) {
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
    }

    function getAllUsersWithPermissions(workspaceId, skip, limit, callback) {
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

                    asyncEach(usersAccount, function (userAccount, index, next) {
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
    }

    function isAccessGrantedForWorkspace(userId, workspaceId, callback) {
        getUserPermissionsForWorkspace(userId, workspaceId, function (permissions) {
            if (permissions.reader || permissions.writer || permissions.admin) {
                callback(true);
            } else {
                callback(false);
            }
        });
    }

    function setUsersPermissionsForWorkspace(workspaceId, parentWorkspaceId, collection, callback) {

        var accessResultCollection = [];

        asyncEach(collection, function (collectionItem, index, next) {

            var userId = collectionItem.userId;
            var permissions = collectionItem.permissions;
            var isAccessGranted = permissions.reader || permissions.writer || permissions.admin;

            if (isAccessGranted) {

                var isPermittedWorkspaceExist = function (workspaceId, callback) {

                    db.query("" +
                        "SELECT COUNT(*) AS count " +
                        "FROM PermittedWorkspace " +
                        "WHERE userId = :userId AND workspaceId = :workspaceId", {
                        params: {
                            userId: userId,
                            workspaceId: workspaceId
                        }
                    }).then(function (results) {
                        callback(results[0].count > 0);
                    }).catch(function (error) {
                        throw error;
                    });
                };

                isPermittedWorkspaceExist(workspaceId, function (isExist) {

                    if (isExist) {

                        db.query("" +
                            "UPDATE PermittedWorkspace " +
                            "SET reader = :reader, writer = :writer, admin = :admin, isAvailable = :isAvailable " +
                            "WHERE userId = :userId AND workspaceId = :workspaceId", {
                            params: {
                                reader: permissions.reader,
                                writer: permissions.writer,
                                admin: permissions.admin,
                                isAvailable: true,
                                userId: userId,
                                workspaceId: workspaceId
                            }
                        }).then(function (total) {

                            accessResultCollection.push({
                                userId: userId,
                                permissions: permissions,
                                status: 'access_updated'
                            });

                            next();
                        }).catch(function (error) {
                            throw error;
                        });
                    } else {

                        var addPermittedWorkspace = function (parentWorkspaceId, callback) {
                            db.query("" +
                                "INSERT INTO PermittedWorkspace (userId, workspaceId, isOwn, isDefault, reader, writer, admin, parentWorkspaceId, isAvailable) " +
                                "VALUES (:userId, :workspaceId, :isOwn, :isDefault, :reader, :writer, :admin, :parentWorkspaceId, :isAvailable)", {
                                params: {
                                    userId: userId,
                                    workspaceId: workspaceId,
                                    isOwn: false,
                                    isDefault: false,
                                    reader: permissions.reader,
                                    writer: permissions.writer,
                                    admin: permissions.admin,
                                    parentWorkspaceId: parentWorkspaceId,
                                    isAvailable: true
                                }
                            }).then(function (results) {
                                callback();
                            }).catch(function (error) {
                                throw error;
                            });
                        };

                        if ((parentWorkspaceId || ROOT_ID) == ROOT_ID) {

                            addPermittedWorkspace(ROOT_ID, function () {

                                accessResultCollection.push({
                                    userId: userId,
                                    permissions: permissions,
                                    hierarchy: [
                                        ROOT_ID,
                                        workspaceId
                                    ],
                                    status: 'access_provided'
                                });

                                next();
                            });
                        } else {

                            quickLoadHierarchy(workspaceId, function (hierarchy) {
                                asyncEach(hierarchy, function (id, index, next) {

                                    if (id == workspaceId) {

                                        getParentWorkspaceId(id, function (parentWorkspaceId) {
                                            addPermittedWorkspace(parentWorkspaceId, function () {
                                                next();
                                            });
                                        });
                                    } else {

                                        if (id != ROOT_ID) {

                                            isPermittedWorkspaceExist(id, function (isExist) {

                                                if (isExist) {
                                                    next();
                                                } else {

                                                    getParentWorkspaceId(id, function (parentWorkspaceId) {

                                                        db.query("" +
                                                            "INSERT INTO PermittedWorkspace (userId, workspaceId, isOwn, isDefault, parentWorkspaceId, isAvailable) " +
                                                            "VALUES (:userId, :workspaceId, :isOwn, :isDefault, :parentWorkspaceId, :isAvailable)", {
                                                            params: {
                                                                userId: userId,
                                                                workspaceId: id,
                                                                isOwn: false,
                                                                isDefault: false,
                                                                parentWorkspaceId: parentWorkspaceId,
                                                                isAvailable: false
                                                            }
                                                        }).then(function (results) {
                                                            next();
                                                        }).catch(function (error) {
                                                            throw error;
                                                        });
                                                    });
                                                }
                                            });

                                        } else {
                                            next();
                                        }
                                    }
                                }, function () {

                                    accessResultCollection.push({
                                        userId: userId,
                                        permissions: permissions,
                                        hierarchy: hierarchy,
                                        status: 'access_provided'
                                    });

                                    next();
                                });
                            });
                        }
                    }
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

                    function closeAccessForDisabledParent(workspaceId, nextWorkspaceId, callback) {
                        if (nextWorkspaceId != ROOT_ID) {
                            db.query("" +
                                "SELECT COUNT(*) AS count " +
                                "FROM PermittedWorkspace " +
                                "WHERE userId = :userId AND parentWorkspaceId = :parentWorkspaceId", {
                                params: {
                                    userId: userId,
                                    parentWorkspaceId: nextWorkspaceId
                                }
                            }).then(function (results) {
                                if (results[0].count > 0) {
                                    callback(workspaceId);
                                } else {
                                    db.query("" +
                                        "DELETE FROM PermittedWorkspace " +
                                        "RETURN BEFORE " +
                                        "WHERE userId = :userId AND workspaceId = :workspaceId", {
                                        params: {
                                            userId: userId,
                                            workspaceId: nextWorkspaceId
                                        }
                                    }).then(function (results) {
                                        var parentWorkspaceId = results[0].parentWorkspaceId;
                                        closeAccessForDisabledParent(nextWorkspaceId, parentWorkspaceId, callback);
                                    }).catch(function (error) {
                                        throw error;
                                    });
                                }
                            }).catch(function (error) {
                                throw error;
                            });
                        } else {
                            callback(workspaceId);
                        }
                    }

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
                            getParentWorkspaceId(workspaceId, function (parentWorkspaceId) {
                                closeAccessForDisabledParent(workspaceId, parentWorkspaceId, function (topLevelWorkspaceId) {

                                    accessResultCollection.push({
                                        userId: userId,
                                        status: 'access_closed',
                                        topLevelWorkspaceId: topLevelWorkspaceId
                                    });

                                    next();
                                });
                            });
                        }
                    }

                    closeAccessForChildren([workspaceId]);
                }).catch(function (error) {
                    throw error;
                });
            }
        }, function () {
            callback(accessResultCollection);
        });
    }

    return {
        createUser: createUser,
        findUser: findUser,
        getItems: getItems,
        saveItem: saveItem,
        updateItems: updateItems,
        removeItems: removeItems,
        setUserWorkspaceId: setUserWorkspaceId,
        getUserWorkspaceId: getUserWorkspaceId,
        createDefaultWorkspace: createDefaultWorkspace,
        createWorkspace: createWorkspace,
        updateWorkspace: updateWorkspace,
        removeWorkspace: removeWorkspace,
        getWorkspaces: getWorkspaces,
        getWorkspace: getWorkspace,
        getDefaultWorkspaceId: getDefaultWorkspaceId,
        getUser: getUser,
        getUsers: getUsers,
        loadHierarchy: loadHierarchy,
        getPermittedWorkspaces: getPermittedWorkspaces,
        getAllWorkspaces: getAllWorkspaces,
        getUsersCount: getUsersCount,
        getAllUsers: getAllUsers,
        getAllUsersWithPermissions: getAllUsersWithPermissions,
        isAccessGrantedForWorkspace: isAccessGrantedForWorkspace,
        setUsersPermissionsForWorkspace: setUsersPermissionsForWorkspace,
        addUserToGroup: addUserToGroup,
        removeUserFromGroup: removeUserFromGroup
    };
};