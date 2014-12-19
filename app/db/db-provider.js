"use strict";

(function (require) {

    module.exports = function (dbWrapper) {

        var RECORD_ID_PATTERN = /^\#\-?\d+\:\d+$/;
        var SYSTEM_ID_PATTERN = /^\@.+/;
        var ROOT_ID = '@root';
        var DEFAULT_PERMISSIONS = {
            reader: false,
            writer: false,
            admin: false
        };

        var q = require('q');
        var _ = require('underscore');

        var AsyncUtils = require('../../public/common-scripts/async-utils');
        var SecurityUtils = require('../utils/security-utils');
        var DbList = require('../db/db-list');
        var StringWrapper = require('../db/string-wrapper');

        var encodeBase64 = SecurityUtils.encodeBase64;
        var decodeBase64 = SecurityUtils.decodeBase64;

        function extractPropertyId(property) {
            if (property) {
                return (property['rid'] || property['@rid']).toString();
            }
        }

        function getUserPermissionsForWorkspace(userId, workspaceId, callback) {
            dbWrapper.query("" +
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
                    callback(DEFAULT_PERMISSIONS);
                }
            }).catch(function (error) {
                throw error;
            });
        }

        function getUsersCount(callback) {
            dbWrapper.query("" +
                "SELECT count(*) AS count " +
                "FROM UserAccount", {
            }).then(function (results) {
                callback(results[0].count);
            }).catch(function (error) {
                throw error;
            });
        }

        function getWorkspaceChildrenCount(parentWorkspaceId, callback) {
            dbWrapper.query("" +
                "SELECT count(*) AS count " +
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
            dbWrapper.query("" +
                "SELECT count(*) AS count " +
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
            dbWrapper.query("" +
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

        function isWorkspaceAvailable(userId, workspaceId, callback) {
            dbWrapper.query("" +
                "SELECT isAvailable " +
                "FROM PermittedWorkspace " +
                "WHERE userId = :userId AND workspaceId = :workspaceId", {
                params: {
                    userId: userId,
                    workspaceId: workspaceId
                }
            }).then(function (results) {
                if (results.length > 0) {
                    var permittedWorkspace = results[0];
                    callback(permittedWorkspace.isAvailable);
                } else {
                    callback(false);
                }
            }).catch(function (error) {
                throw error;
            });
        }

        function addOwnWorkspace(userId, workspaceId, callback) {
            dbWrapper.query("" +
                "UPDATE User " +
                "ADD ownWorkspaces = :workspaceId " +
                "WHERE @rid = :id", {
                params: {
                    id: userId,
                    workspaceId: workspaceId
                }
            }).then(function (results) {
                callback();
            }).catch(function (error) {
                throw error;
            });
        }

        function removeOwnWorkspace(userId, workspaceId, callback) {
            dbWrapper.query("" +
                "UPDATE User " +
                "REMOVE ownWorkspaces = :workspaceId " +
                "WHERE @rid = :id", {
                params: {
                    id: userId,
                    workspaceId: workspaceId
                }
            }).then(function (results) {
                callback();
            }).catch(function (error) {
                throw error;
            });
        }

        function addUserToGroup(userId, groupName, callback) {
            dbWrapper.query("" +
                "UPDATE Group " +
                "ADD users = :userId " +
                "WHERE name = :name", {
                params: {
                    userId: userId,
                    name: groupName
                }
            }).then(function (results) {
                callback();
            }).catch(function (error) {
                throw error;
            });
        }

        function removeUserFromGroup(userId, groupName, callback) {
            dbWrapper.query("" +
                "UPDATE Group " +
                "REMOVE users = :userId " +
                "WHERE name = :name", {
                params: {
                    userId: userId,
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
                dbWrapper.query("" +
                    "SELECT hierarchyLevel " +
                    "FROM Workspace " +
                    "WHERE @rid = :id", {
                    params: {
                        id: workspaceId
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
                dbWrapper.query("" +
                    "SELECT name " +
                    "FROM Workspace " +
                    "WHERE @rid = :id", {
                    params: {
                        id: workspaceId
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
                dbWrapper.query("" +
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
                    var workspaceId = extractPropertyId(workspace);

                    addOwnWorkspace(creatorId, workspaceId, function () {
                        dbWrapper.query("" +
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
                dbWrapper.query("" +
                    "SELECT parentWorkspaceId " +
                    "FROM Workspace " +
                    "WHERE @rid = :id", {
                    params: {
                        id: workspaceId
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
                    dbWrapper.query("" +
                        "SELECT parentWorkspaceId " +
                        "FROM Workspace " +
                        "WHERE @rid = :id", {
                        params: {
                            id: workspaceId
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
                    isEmailVerified: userAccount.isEmailVerified,
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

                        dbWrapper.query("" +
                            "UPDATE UserAccount " +
                            "SET " + formatParams(accountData) + " " +
                            "WHERE @rid = " + extractPropertyId(userAccount), {
                            params: accountData
                        }).then(function () {
                            successCallback(wrapUserAccount(userAccount));
                        }).catch(function (error) {
                            failureCallback(error);
                        });
                    }
                };
            }
        }

        function createUser(data, isEmailVerified, callback) {

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

            dbWrapper.query("" +
                "INSERT INTO UserAccount (genericId, displayName, password, email, token, authorizationProvider, registeredDate, isEmailVerified) " +
                "VALUES (:genericId, :displayName, :password, :email, :token, :authorizationProvider, :registeredDate, :isEmailVerified)", {
                params: {
                    genericId: data.genericId,
                    displayName: data.displayName,
                    password: data.password,
                    email: data.email,
                    token: data.token,
                    authorizationProvider: data.authorizationProvider,
                    registeredDate: data.registeredDate,
                    isEmailVerified: isEmailVerified
                }
            }).then(function (results) {
                var userAccount = results[0];

                dbWrapper.query("" +
                    "INSERT INTO User (accountId) " +
                    "VALUES (:accountId)", {
                    params: {
                        accountId: extractPropertyId(userAccount)
                    }
                }).then(function (results) {
                    var user = results[0];
                    var userId = extractPropertyId(user);

                    addUserToGroup(userId, 'users', function () {

                        userAccount.userId = userId;

                        dbWrapper.query("" +
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

            dbWrapper.query("" +
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

        function getTasks(workspaceId, callback) {
            dbWrapper.query("" +
                "SELECT * " +
                "FROM Task " +
                "WHERE workspaceId = :workspaceId", {
                params: {
                    workspaceId: workspaceId
                }
            }).then(function (results) {

                var tasks = [];

                _.forEach(results, function (item) {
                    tasks.push({
                        id: extractPropertyId(item),
                        creatorId: item.creatorId,
                        title: item.title,
                        completed: item.completed,
                        workspaceId: item.workspaceId,
                        creationDate: item.creationDate,
                        priority: item.priority
                    });
                });

                callback(tasks);
            }).catch(function (error) {
                throw error;
            });
        }

        function createTask(workspaceId, userId, data, callback) {
            dbWrapper.query("" +
                "INSERT INTO Task (workspaceId, creatorId, title, completed, creationDate, priority) " +
                "VALUES (:workspaceId, :creatorId, :title, :completed, :creationDate, :priority)", {
                params: {
                    workspaceId: workspaceId,
                    creatorId: userId,
                    title: data.title,
                    completed: data.completed,
                    creationDate: _.now(),
                    priority: data.priority
                }
            }).then(function (results) {
                var task = results[0];
                callback({
                    taskId: extractPropertyId(task),
                    creationDate: task.creationDate
                });
            }).catch(function (error) {
                throw error;
            });
        }

        function updateTasks(tasksModels, callback) {
            AsyncUtils.each(tasksModels, function (taskModel, index, next) {
                dbWrapper.query("" +
                    "UPDATE Task " +
                    "SET title = :title, completed = :completed, priority = :priority " +
                    "WHERE @rid = :id", {
                    params: {
                        id: taskModel.id,
                        title: taskModel.title,
                        completed: taskModel.completed,
                        priority: taskModel.priority
                    }
                }).then(function () {
                    next();
                }).catch(function (error) {
                    throw error;
                });
            }, function () {
                callback();
            });
        }

        function removeTasks(tasksIds, callback) {
            AsyncUtils.each(tasksIds, function (taskId, index, next) {
                dbWrapper.query("" +
                    "DELETE FROM Task " +
                    "WHERE @rid = :id", {
                    params: {
                        id: taskId
                    }
                }).then(function () {
                    next();
                }).catch(function (error) {
                    throw error;
                });
            }, function () {
                callback();
            });
        }

        function setUserWorkspaceId(userId, workspaceId, rootWorkspaceId, callback) {
            dbWrapper.query("" +
                "UPDATE User " +
                "SET currentWorkspaceId = :currentWorkspaceId, currentRootWorkspaceId = :currentRootWorkspaceId " +
                "WHERE @rid = :id", {
                params: {
                    currentWorkspaceId: workspaceId,
                    currentRootWorkspaceId: rootWorkspaceId,
                    id: userId
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
            dbWrapper.query("" +
                "SELECT currentWorkspaceId, currentRootWorkspaceId " +
                "FROM User " +
                "WHERE @rid = :id", {
                params: {
                    id: userId
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
            dbWrapper.query("" +
                "UPDATE Workspace " +
                "SET name = :name " +
                "WHERE @rid = :id", {
                params: {
                    id: workspaceId,
                    name: data.name
                }
            }).then(function (total) {
                callback();
            }).catch(function (error) {
                throw error;
            });
        }

        function removeWorkspace(userId, workspaceId, callback) {

            function removeRecords(workspaceId, callback) {
                AsyncUtils.parallel({
                    removeTasks: function (resolve, reject) {
                        dbWrapper.query("" +
                            "DELETE FROM Task " +
                            "WHERE workspaceId = :workspaceId", {
                            params: {
                                workspaceId: workspaceId
                            }
                        }).then(function () {
                            resolve();
                        }).catch(function (error) {
                            reject(error);
                        });
                    },
                    removeLectures: function (resolve, reject) {
                        dbWrapper.query("" +
                            "DELETE FROM Lecture " +
                            "WHERE workspaceId = :workspaceId", {
                            params: {
                                workspaceId: workspaceId
                            }
                        }).then(function () {
                            resolve();
                        }).catch(function (error) {
                            reject(error);
                        });
                    }
                }, function () {
                    callback();
                }, function (error) {
                    throw error;
                });
            }

            function removeChildren(stack, callback) {
                if (stack.length > 0) {
                    var parentWorkspaceId = stack.pop();

                    dbWrapper.query("" +
                        "DELETE FROM Workspace " +
                        "RETURN BEFORE " +
                        "WHERE parentWorkspaceId = :parentWorkspaceId", {
                        params: {
                            parentWorkspaceId: parentWorkspaceId
                        }
                    }).then(function (results) {

                        AsyncUtils.each(results, function (workspace, index, next) {

                            var workspaceId = extractPropertyId(workspace);
                            stack.push(workspaceId);

                            removeOwnWorkspace(workspace.creatorId, workspaceId, function () {
                                next();
                            });
                        }, function () {
                            dbWrapper.query("" +
                                "DELETE FROM PermittedWorkspace " +
                                "WHERE parentWorkspaceId = :parentWorkspaceId", {
                                params: {
                                    parentWorkspaceId: parentWorkspaceId
                                }
                            }).then(function (results) {
                                removeRecords(workspaceId, function () {
                                    removeChildren(stack, callback);
                                });
                            }).catch(function (error) {
                                throw error;
                            });
                        });
                    }).catch(function (error) {
                        throw error;
                    });
                } else {
                    callback();
                }
            }

            function removeWorkspace(topLevelWorkspaceIdCollection) {
                dbWrapper.query("" +
                    "DELETE FROM Workspace " +
                    "RETURN BEFORE " +
                    "WHERE @rid = :id", {
                    params: {
                        id: workspaceId
                    }
                }).then(function (results) {

                    var workspace = results[0];
                    var workspaceId = extractPropertyId(workspace);

                    removeOwnWorkspace(workspace.creatorId, workspaceId, function () {
                        dbWrapper.query("" +
                            "DELETE FROM PermittedWorkspace " +
                            "WHERE workspaceId = :workspaceId", {
                            params: {
                                workspaceId: workspaceId
                            }
                        }).then(function (results) {
                            removeRecords(workspaceId, function () {
                                removeChildren([workspaceId], function () {

                                    callback({
                                        workspaceName: workspace.name,
                                        topLevelWorkspaceIdCollection: topLevelWorkspaceIdCollection
                                    });
                                });
                            });
                        }).catch(function (error) {
                            throw error;
                        });
                    });
                }).catch(function (error) {
                    throw error;
                });
            }

            dbWrapper.query("" +
                "SELECT userId " +
                "FROM PermittedWorkspace " +
                "WHERE workspaceId = :workspaceId AND userId <> :userId", {
                params: {
                    workspaceId: workspaceId,
                    userId: userId
                }
            }).then(function (results) {

                getParentWorkspaceId(workspaceId, function (parentWorkspaceId) {
                    var collection = [];

                    _.forEach(results, function (item) {
                        collection.push({
                            userId: item.userId,
                            permissions: DEFAULT_PERMISSIONS
                        });
                    });

                    setUsersPermissionsForWorkspace(workspaceId, parentWorkspaceId, collection, function (accessResultCollection) {

                        _.forEach(accessResultCollection, function (item) {
                            item.status = null;
                        });

                        removeWorkspace(accessResultCollection);
                    });
                });
            }).catch(function (error) {
                throw error;
            });
        }

        function getWorkspaces(userId, callback) {
            dbWrapper.query("" +
                "SELECT expand(ownWorkspaces) " +
                "FROM User " +
                "WHERE @rid = :id", {
                params: {
                    id: userId
                }
            }).then(function (results) {

                var result = [];

                _.forEach(results, function (item) {
                    var workspaceId = item.value;
                    result.push(workspaceId);
                });

                callback(result);
            }).catch(function (error) {
                throw error;
            });
        }

        function getWorkspace(workspaceId, callback) {
            dbWrapper.query("" +
                "SELECT name, creatorId, creationDate " +
                "FROM Workspace " +
                "WHERE @rid = :id", {
                params: {
                    id: workspaceId
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
            dbWrapper.query("" +
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

        function getUserById(userId, callback) {
            dbWrapper.query("" +
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

        function getUsersById(ids, callback) {
            var result = [];

            AsyncUtils.each(ids, function (userId, index, next) {
                dbWrapper.query("" +
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
                    dbWrapper.query("" +
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
            dbWrapper.query("" +
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

                AsyncUtils.each(permittedWorkspaces, function (permittedWorkspace, index, next) {
                    dbWrapper.query("" +
                        "SELECT * " +
                        "FROM Workspace " +
                        "WHERE @rid = :id", {
                        params: {
                            id: permittedWorkspace.workspaceId
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
            dbWrapper.query("" +
                "SELECT @rid, name " +
                "FROM Workspace " +
                "WHERE parentWorkspaceId = :parentWorkspaceId", {
                params: {
                    parentWorkspaceId: parentWorkspaceId || ROOT_ID
                }
            }).then(function (results) {
                var workspaces = results;

                var result = [];

                AsyncUtils.each(workspaces, function (workspace, index, next) {

                    var workspaceId = extractPropertyId(workspace);

                    getWorkspaceChildrenCount(workspaceId, function (childrenCount) {
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
                    dbWrapper.query("" +
                        "SELECT userId, displayName, registeredDate " +
                        "FROM UserAccount SKIP :skip LIMIT :limit", {
                        params: {
                            skip: skip,
                            limit: limit
                        }
                    }).then(function (results) {
                        var usersAccount = results;

                        var users = [];

                        AsyncUtils.each(usersAccount, function (userAccount, index, next) {
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
                    dbWrapper.query("" +
                        "SELECT userId, displayName, registeredDate " +
                        "FROM UserAccount SKIP :skip LIMIT :limit", {
                        params: {
                            skip: skip,
                            limit: limit
                        }
                    }).then(function (results) {
                        var usersAccount = results;

                        var users = [];

                        AsyncUtils.each(usersAccount, function (userAccount, index, next) {
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

            AsyncUtils.each(collection, function (collectionItem, index, next) {

                var userId = collectionItem.userId;
                var permissions = collectionItem.permissions;
                var isAccessGranted = permissions.reader || permissions.writer || permissions.admin;

                if (isAccessGranted) {

                    var isPermittedWorkspaceExist = function (workspaceId, callback) {

                        dbWrapper.query("" +
                            "SELECT count(*) AS count " +
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

                            dbWrapper.query("" +
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
                                dbWrapper.query("" +
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
                                    AsyncUtils.each(hierarchy, function (id, index, next) {

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

                                                            dbWrapper.query("" +
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

                    dbWrapper.query("" +
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
                                isWorkspaceAvailable(userId, nextWorkspaceId, function (isAvailable) {

                                    if (isAvailable) {
                                        callback(workspaceId);
                                    } else {
                                        dbWrapper.query("" +
                                            "SELECT count(*) AS count " +
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
                                                dbWrapper.query("" +
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
                                    }
                                });
                            } else {
                                callback(workspaceId);
                            }
                        }

                        function closeAccessForChildren(stack) {
                            if (stack.length > 0) {
                                var parentWorkspaceId = stack.pop();

                                dbWrapper.query("" +
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

        /*TODO: begin_integration*/

        function createTag(data, callback) {
            dbWrapper.query("" +
                "INSERT INTO Tag (title, categoryId, authorId, description)" +
                "VALUES (:title, :categoryId, :authorId, :description", {
                params: {
                    title: data.title,
                    categoryId: data.categoryId,
                    authorId: data.authorId,
                    description: data.description
                }
            }).then(function (results) {
                var tagId = extractPropertyId(results[0]);
                callback(tagId);
            }).catch(function (error) {
                throw error;
            });
        }

        function getTagById(tagId, callback) {
            dbWrapper.query("" +
                "SELECT * " +
                "FROM Tag " +
                "WHERE @rid = :tagId", {
                params: {
                    tagId: tagId
                }
            }).then(function (results) {
                if (results.length > 0) {
                    var tag = results[0];
                    callback({
                        id: extractPropertyId(tag),
                        title: tag.title,
                        categoryId: tag.categoryId,
                        authorId: tag.authorId,
                        description: tag.description
                    });
                } else {
                    throw 'Tag not found';
                }
            }).catch(function (error) {
                throw error;
            });
        }

        function getTagsById(tagIds, callback) {
            dbWrapper.query("" +
                "SELECT * " +
                "FROM Tag " +
                "WHERE @rid IN [:recordCollection]", {
                params: {
                    recordCollection: (function () {
                        var recordCollection = [];
                        _.forEach(tagIds, function (tagId) {
                            var recordId = new StringWrapper(tagId);
                            recordCollection.push(recordId);
                        });
                        return new DbList(recordCollection);
                    })()
                }
            }).then(function (results) {
                if (results.length > 0) {
                    var tags = [];

                    _.forEach(results, function (tag) {
                        tags.push({
                            id: extractPropertyId(tag),
                            title: tag.title,
                            categoryId: tag.categoryId,
                            authorId: tag.authorId,
                            description: tag.description
                        });
                    });

                    callback(tags);
                } else {
                    callback([]);
                }
            }).catch(function (error) {
                throw error;
            });
        }

        function findTagsByName(namePart, callback) {
            dbWrapper.query("" +
                "SELECT * " +
                "FROM Tag " +
                "WHERE title.indexOf(:namePart) > 0", {
                params: {
                    namePart: namePart
                }
            }).then(function (results) {
                var tags = [];

                _.forEach(results, function (tag) {
                    tags.push({
                        id: extractPropertyId(tag),
                        title: tag.title,
                        categoryId: tag.categoryId,
                        authorId: tag.authorId,
                        description: tag.description
                    });
                });

                callback(tags);
            }).catch(function (error) {
                throw error;
            });
        }

        function updateTag(tagId, data, callback) {
            dbWrapper.query("" +
                "UPDATE Tag " +
                "SET title = :title, categoryId = :categoryId, description = :description " +
                "WHERE @rid = :tagId", {
                params: {
                    title: data.title,
                    categoryId: data.categoryId,
                    description: data.description,
                    tagId: tagId
                }
            }).then(function (results) {
                callback();
            }).catch(function (error) {
                throw error;
            });
        }

        function removeTag(tagId, callback) {
            dbWrapper.query("" +
                "DELETE FROM Tag " +
                "WHERE @rid = :tagId", {
                params: {
                    tagId: tagId
                }
            }).then(function (results) {
                callback();
            }).catch(function (error) {
                throw error;
            });
        }

        function createCategory(data, callback) {
            dbWrapper.query("" +
                "INSERT INTO Category (title, authorId, parentCategoryId, description)" +
                "VALUES (:title, :authorId, :parentCategoryId, :description)", {
                params: {
                    title: data.title,
                    authorId: data.authorId,
                    parentCategoryId: data.parentCategoryId || ROOT_ID,
                    description: data.description
                }
            }).then(function (results) {
                var categoryId = extractPropertyId(results[0]);
                callback(categoryId);
            }).catch(function (error) {
                throw error;
            });
        }

        function getCategoryChildrenCount(parentCategoryId, callback) {
            dbWrapper.query("" +
                "SELECT count(*) AS count " +
                "FROM Category " +
                "WHERE parentCategoryId = :parentCategoryId", {
                params: {
                    parentCategoryId: parentCategoryId
                }
            }).then(function (results) {
                callback(results[0].count);
            }).catch(function (error) {
                throw error;
            });
        }

        function getCategoryById(categoryId, callback) {
            dbWrapper.query("" +
                "SELECT * " +
                "FROM Category " +
                "WHERE @rid = :categoryId", {
                params: {
                    categoryId: categoryId
                }
            }).then(function (results) {
                if (results.length > 0) {

                    var category = results[0];
                    var categoryId = extractPropertyId(category);

                    getCategoryChildrenCount(categoryId, function (childrenCount) {
                        callback({
                            id: categoryId,
                            title: category.title,
                            parentCategoryId: category.parentCategoryId,
                            authorId: category.authorId,
                            description: category.description,
                            childrenCount: childrenCount
                        });
                    });
                } else {
                    throw 'Category not found';
                }
            }).catch(function (error) {
                throw error;
            });
        }

        function getCategoriesById(categoryIds, callback) {
            dbWrapper.query("" +
                "SELECT * " +
                "FROM Category " +
                "WHERE @rid IN [:recordCollection]", {
                params: {
                    recordCollection: (function () {
                        var recordCollection = [];
                        _.forEach(categoryIds, function (tagId) {
                            var recordId = new StringWrapper(tagId);
                            recordCollection.push(recordId);
                        });
                        return new DbList(recordCollection);
                    })()
                }
            }).then(function (results) {
                var categories = [];

                AsyncUtils.each(results, function (category, index, next) {

                    var categoryId = extractPropertyId(category);

                    getCategoryChildrenCount(categoryId, function (childrenCount) {
                        categories.push({
                            id: categoryId,
                            title: category.title,
                            parentCategoryId: category.parentCategoryId,
                            authorId: category.authorId,
                            description: category.description,
                            childrenCount: childrenCount
                        });
                        next();
                    });
                }, function () {
                    callback(categories);
                });
            }).catch(function (error) {
                throw error;
            });
        }

        function findCategoriesByName(namePart, callback) {
            dbWrapper.query("" +
                "SELECT * " +
                "FROM Category " +
                "WHERE title.indexOf(:namePart) > 0", {
                params: {
                    namePart: namePart
                }
            }).then(function (results) {
                var categories = [];

                AsyncUtils.each(results, function (category, index, next) {

                    var categoryId = extractPropertyId(category);

                    getCategoryChildrenCount(categoryId, function (childrenCount) {
                        categories.push({
                            id: categoryId,
                            title: category.title,
                            parentCategoryId: category.parentCategoryId,
                            authorId: category.authorId,
                            description: category.description,
                            childrenCount: childrenCount
                        });
                        next();
                    });
                }, function () {
                    callback(categories);
                });

            }).catch(function (error) {
                throw error;
            });
        }

        function updateCategory(categoryId, data, callback) {
            dbWrapper.query("" +
                "UPDATE Category " +
                "SET title = :title, description = :description " +
                "WHERE @rid = :categoryId", {
                params: {
                    title: data.title,
                    description: data.description,
                    categoryId: categoryId
                }
            }).then(function (results) {
                callback();
            }).catch(function (error) {
                throw error;
            });
        }

        function removeCategory(categoryId, callback) {

            function removeChildren(stack, callback) {
                if (stack.length > 0) {

                    var parentCategoryId = stack.pop();

                    dbWrapper.query("" +
                        "DELETE FROM Category " +
                        "RETURN BEFORE " +
                        "WHERE parentCategoryId = :parentCategoryId", {
                        params: {
                            parentCategoryId: parentCategoryId
                        }
                    }).then(function (results) {

                        _.forEach(results, function (category) {
                            var categoryId = extractPropertyId(category);
                            stack.push(categoryId);
                        });

                        removeChildren(stack, callback);

                    }).catch(function (error) {
                        throw error;
                    });
                } else {
                    callback();
                }
            }

            dbWrapper.query("" +
                "DELETE FROM Category " +
                "WHERE @rid = :categoryId", {
                params: {
                    categoryId: categoryId
                }
            }).then(function () {
                removeChildren([categoryId], callback);
            }).catch(function (error) {
                throw error;
            });
        }

        function createLink(data, callback) {
            dbWrapper.query("" +
                "INSERT INTO Link(title, authorId, url, description, usedLectures) " +
                "VALUES(:title, :authorId, :url, :description, [])", {
                params: {
                    title: data.title,
                    authorId: data.authorId,
                    url: data.url,
                    description: data.description
                }
            }).then(function (results) {
                var linkId = extractPropertyId(results[0]);
                callback(linkId);
            }).catch(function (error) {
                throw error;
            });
        }

        function attachLink(linkId, lectureId, callback) {
            //TODO: check duplicated linkId
            dbWrapper.query("" +
                "UPDATE Link " +
                "ADD usedLectures = :lectureId " +
                "WHERE @rid = :linkId", {
                params: {
                    linkId: linkId,
                    lectureId: lectureId
                }
            }).then(function (results) {
                callback();
            }).catch(function (error) {
                throw error;
            });
        }

        function detachLink(linkId, lectureId, callback) {
            dbWrapper.query("" +
                "UPDATE Link " +
                "REMOVE usedLectures = :lectureId " +
                "WHERE @rid = :linkId", {
                params: {
                    linkId: linkId,
                    lectureId: lectureId
                }
            }).then(function (results) {
                callback();
            }).catch(function (error) {
                throw error;
            });
        }

        function getAttachedLinksByLectureId(lectureId, callback) {
            dbWrapper.query("" +
                "SELECT * " +
                "FROM Link " +
                "WHERE :lectureId IN usedLectures", {
                params: {
                    lectureId: lectureId
                }
            }).then(function (results) {
                var links = [];

                _.forEach(results, function (link) {
                    links.push({
                        id: extractPropertyId(link),
                        authorId: link.authorId,
                        title: link.title,
                        url: link.url,
                        description: link.description
                    });
                });

                callback(links);
            }).catch(function (error) {
                throw error;
            });
        }

        function getLinkById(linkId, callback) {
            dbWrapper.query("" +
                "SELECT * " +
                "FROM Link " +
                "WHERE @rid = :linkId", {
                params: {
                    linkId: linkId
                }
            }).then(function (results) {
                if (results.length > 0) {
                    var link = results[0];
                    callback({
                        id: extractPropertyId(link),
                        authorId: link.authorId,
                        title: link.title,
                        url: link.url,
                        description: link.description
                    });
                } else {
                    throw 'Link not found';
                }
            }).catch(function (error) {
                throw error;
            });
        }

        function getLinksById(linkIds, callback) {
            dbWrapper.query("" +
                "SELECT * " +
                "FROM Link " +
                "WHERE @rid IN [:recordCollection]", {
                params: {
                    recordCollection: (function () {
                        var recordCollection = [];
                        _.forEach(linkIds, function (linkId) {
                            var recordId = new StringWrapper(linkId);
                            recordCollection.push(recordId);
                        });
                        return new DbList(recordCollection);
                    })()
                }
            }).then(function (results) {
                if (results.length > 0) {
                    var links = [];

                    _.forEach(results, function (link) {
                        links.push({
                            id: extractPropertyId(link),
                            authorId: link.authorId,
                            title: link.title,
                            url: link.url,
                            description: link.description
                        });
                    });

                    callback(links);
                } else {
                    callback([]);
                }
            }).catch(function (error) {
                throw error;
            });
        }

        function updateLink(linkId, data, callback) {
            dbWrapper.query("" +
                "UPDATE Link " +
                "SET title = :title, url = :url, description = :description " +
                "WHERE @rid = :linkId", {
                params: {
                    title: data.title,
                    url: data.url,
                    description: data.description,
                    linkId: linkId
                }
            }).then(function (results) {
                callback();
            }).catch(function (error) {
                throw error;
            });
        }

        function removeLink(linkId, callback) {
            dbWrapper.query("" +
                "DELETE FROM Link " +
                "WHERE @rid = :linkId", {
                params: {
                    linkId: linkId
                }
            }).then(function (results) {
                callback();
            }).catch(function (error) {
                throw error;
            });
        }

        function createLecture(data, callback) {
            dbWrapper.query("" +
                "INSERT INTO Lecture (title, authorId, workspaceId, description, tags, creationDate) " +
                "VALUES (:title, :authorId, :workspaceId, :description, [:tags], :creationDate)", {
                params: {
                    title: data.title,
                    authorId: data.authorId,
                    workspaceId: data.workspaceId,
                    description: data.description,
                    tags: new DbList(data.tags),
                    creationDate: _.now()
                }
            }).then(function (results) {
                var lecture = results[0];
                callback({
                    lectureId: extractPropertyId(lecture),
                    creationDate: lecture.creationDate
                });
            }).catch(function (error) {
                throw error;
            });
        }

        function getLectureById(lectureId, callback) {
            dbWrapper.query("" +
                "SELECT title, authorId, workspaceId, description, creationDate " +
                "FROM Lecture " +
                "WHERE @rid = :lectureId", {
                params: {
                    lectureId: lectureId
                }
            }).then(function (results) {
                if (results.length > 0) {

                    var getLectureTags = function (lectureId, callback) {
                        dbWrapper.query("" +
                            "SELECT EXPAND(tags) " +
                            "FROM Lecture " +
                            "WHERE lectureId = :lectureId", {
                            params: {
                                lectureId: lectureId
                            }
                        }).then(function (results) {
                            var tags = [];
                            if (results.length > 0) {
                                AsyncUtils.each(results, function (tagId, index, next) {
                                    getTagById(tagId, function (tag) {
                                        tags.push(tag);
                                        next();
                                    });
                                }, function () {
                                    callback(tags);
                                });
                            } else {
                                callback(tags);
                            }
                        }).catch(function (error) {
                            throw error;
                        });
                    };

                    var getLectureStatisticCharts = function (lectureId, callback) {
                        callback([]);
                    };

                    var lecture = results[0];

                    AsyncUtils.parallel({
                        user: function (resolve, reject) {
                            var authorId = lecture.authorId;
                            getUserById(authorId, function (user) {
                                resolve(user);
                            });
                        },
                        tags: function (resolve, reject) {
                            getLectureTags(lectureId, function (tags) {
                                resolve(tags);
                            });
                        },
                        statisticCharts: function (resolve, reject) {
                            getLectureStatisticCharts(lectureId, function (statisticCharts) {
                                resolve(statisticCharts);
                            });
                        },
                        links: function (resolve, reject) {
                            getAttachedLinksByLectureId(lectureId, function (links) {
                                resolve(links);
                            });
                        },
                        condition: function (resolve, reject) {
                            getLectureCondition(lectureId, function (condition) {
                                resolve(condition);
                            });
                        }
                    }, function (result) {
                        callback({
                            id: lectureId,
                            title: lecture.title,
                            author: (function () {
                                var user = result.user;
                                return {
                                    id: user.id,
                                    name: user.displayName,
                                    registeredDate: user.registeredDate
                                }
                            })(),
                            workspaceId: lecture.workspaceId,
                            description: lecture.description,
                            tags: result.tags,
                            statisticCharts: result.statisticCharts,
                            links: result.links,
                            creationDate: lecture.creationDate,
                            condition: result.condition
                        });
                    }, function (error) {
                        throw error;
                    });
                } else {
                    throw 'getLectureById -> Lecture not found';
                }
            }).catch(function (error) {
                throw error;
            });
        }

        function getLecturesByWorkspaceId(workspaceId, callback) {
            dbWrapper.query("" +
                "SELECT @rid " +
                "FROM Lecture " +
                "WHERE workspaceId = :workspaceId", {
                params: {
                    workspaceId: workspaceId
                }
            }).then(function (results) {

                var lectures = [];

                if (results.length > 0) {
                    AsyncUtils.each(results, function (lecture, index, next) {
                        var lectureId = extractPropertyId(lecture);
                        getLectureById(lectureId, function (lecture) {
                            lectures.push(lecture);
                            next();
                        });
                    }, function () {
                        callback(lectures);
                    });
                } else {
                    callback(lectures);
                }
            }).catch(function (error) {
                throw error;
            });
        }

        function getLecturesByAuthorId(authorId, callback) {
            dbWrapper.query("" +
                "SELECT @rid " +
                "FROM Lecture " +
                "WHERE authorId = :authorId", {
                params: {
                    authorId: authorId
                }
            }).then(function (results) {

                var lectures = [];

                if (results.length > 0) {
                    AsyncUtils.each(results, function (lecture, index, next) {
                        var lectureId = extractPropertyId(lecture);
                        getLectureById(lectureId, function (lecture) {
                            lectures.push(lecture);
                            next();
                        });
                    }, function () {
                        callback(lectures);
                    });
                } else {
                    callback(lectures);
                }
            }).catch(function (error) {
                throw error;
            });
        }

        function getActiveLectures(callback) {
            dbWrapper.query("" +
                "SELECT lectureId " +
                "FROM ActiveLecture " +
                "WHERE status <> 'stopped'", {
            }).then(function (results) {

                var lectures = [];

                AsyncUtils.each(results, function (activeLecture, index, next) {
                    var lectureId = activeLecture.lectureId;
                    getLectureById(lectureId, function (lecture) {
                        lectures.push(lecture);
                        next();
                    });
                }, function () {
                    callback(lectures);
                });
            }).catch(function (error) {
                throw error;
            });
        }

        function updateLecture(lectureId, data, callback) {
            dbWrapper.query("" +
                "UPDATE Lecture " +
                "SET title = :title, description = :description " +
                "WHERE @rid = :lectureId", {
                params: {
                    title: data.title,
                    description: data.description,
                    lectureId: lectureId
                }
            }).then(function (results) {
                callback();
            }).catch(function (error) {
                throw error;
            });
        }

        function removeLecture(lectureId, callback) {
            dbWrapper.query("" +
                "DELETE FROM Lecture " +
                "WHERE @rid = :lectureId", {
                params: {
                    lectureId: lectureId
                }
            }).then(function (total) {

                dbWrapper.query("" +
                    "UPDATE Link " +
                    "REMOVE usedLectures = :lectureId " +
                    "WHERE :lectureId IN usedLectures", {
                    params: {
                        lectureId: lectureId
                    }
                }).then(function (results) {
                    callback();
                }).catch(function (error) {
                    throw error;
                });

            }).catch(function (error) {
                throw error;
            });
        }

        function loadStatisticForLecture(lectureId, callback) {
            callback([]);
        }

        function updateStatisticForLecture(lectureId, statisticData, callback) {
            callback();
        }

        function getLectureCondition(lectureId, callback) {
            dbWrapper.query("" +
                "SELECT count(*) AS count " +
                "FROM ActiveLecture " +
                "WHERE lectureId = :lectureId", {
                params: {
                    lectureId: lectureId
                }
            }).then(function (results) {
                if (results[0].count > 0) {

                    dbWrapper.query("" +
                        "SELECT status, lecturerId " +
                        "FROM ActiveLecture " +
                        "WHERE lectureId = :lectureId", {
                        params: {
                            lectureId: lectureId
                        }
                    }).then(function (results) {
                        var activeLecture = results[0];

                        callback({
                            status: activeLecture.status,
                            lecturerId: activeLecture.lecturerId
                        });
                    }).catch(function (error) {
                        throw error;
                    });

                } else {
                    callback({
                        status: 'stopped'
                    });
                }
            }).catch(function (error) {
                throw error;
            });
        }

        function updateLectureStatus(lectureId, lecturerId, status, callback) {
            dbWrapper.query("" +
                "SELECT count(*) AS count " +
                "FROM ActiveLecture " +
                "WHERE lectureId = :lectureId", {
                params: {
                    lectureId: lectureId
                }
            }).then(function (results) {

                if (results[0].count > 0) {

                    if (status == 'stopped') {
                        dbWrapper.query("" +
                            "DELETE FROM ActiveLecture " +
                            "WHERE lectureId = :lectureId", {
                            params: {
                                lectureId: lectureId
                            }
                        }).then(function (total) {
                            callback();
                        }).catch(function (error) {
                            throw error;
                        });
                    } else {
                        dbWrapper.query("" +
                            "UPDATE ActiveLecture " +
                            "SET status = :status, lecturerId = :lecturerId " +
                            "WHERE lectureId = :lectureId", {
                            params: {
                                lectureId: lectureId,
                                status: status,
                                lecturerId: lecturerId
                            }
                        }).then(function (total) {
                            callback();
                        }).catch(function (error) {
                            throw error;
                        });
                    }
                } else {
                    if (status == 'started') {
                        dbWrapper.query("" +
                            "INSERT INTO ActiveLecture (lectureId, lecturerId, status) " +
                            "VALUES (:lectureId, :lecturerId, :status)", {
                            params: {
                                lectureId: lectureId,
                                lecturerId: lecturerId,
                                status: status
                            }
                        }).then(function (total) {
                            callback();
                        }).catch(function (error) {
                            throw error;
                        });
                    } else {
                        throw 'updateLectureStatus-> Lecture not found';
                    }
                }
            }).catch(function (error) {
                throw error;
            });
        }

        function createQuestion(lectureId, questionModel, callback) {
            dbWrapper.query("" +
                "INSERT INTO Question (title, lectureId, creationDate, type, data) " +
                "VALUES (:title, :lectureId, :creationDate, :type, :data)", {
                params: {
                    title: questionModel.title,
                    lectureId: lectureId,
                    creationDate: _.now(),
                    type: questionModel.type,
                    data: JSON.stringify(questionModel.data)
                }
            }).then(function (results) {
                var question = results[0];
                var questionId = extractPropertyId(question);
                callback({
                    questionId: questionId,
                    creationDate: question.creationDate
                });
            }).catch(function (error) {
                throw error;
            });
        }

        function updateQuestion(questionId, questionModel, callback) {
            dbWrapper.query("" +
                "UPDATE Question " +
                "SET title = :title, type = :type, data = :data " +
                "WHERE @rid = :questionId", {
                params: {
                    title: questionModel.title,
                    type: questionModel.type,
                    data: JSON.stringify(questionModel.data),
                    questionId: questionId
                }
            }).then(function (total) {
                callback();
            }).catch(function (error) {
                throw error;
            });
        }

        function removeQuestion(questionId, callback) {
            dbWrapper.query("" +
                "DELETE FROM Question " +
                "WHERE @rid = :questionId", {
                params: {
                    questionId: questionId
                }
            }).then(function (total) {
                callback();
            }).catch(function (error) {
                throw error;
            });
        }

        function getQuestionById(questionId, callback) {
            dbWrapper.query("" +
                "SELECT * " +
                "FROM Question " +
                "WHERE @rid = :questionId", {
                params: {
                    questionId: questionId
                }
            }).then(function (results) {
                if (results.length > 0) {
                    var model = results[0];

                    callback({
                        id: questionId,
                        title: model.title,
                        lectureId: model.lectureId,
                        creationDate: model.creationDate,
                        type: model.type,
                        data: JSON.parse(model.data)
                    });
                } else {
                    throw 'Question not found';
                }
            }).catch(function (error) {
                throw error;
            });
        }

        function getQuestionsByLectureId(lectureId, callback) {
            dbWrapper.query("" +
                "SELECT * " +
                "FROM Question " +
                "WHERE lectureId = :lectureId", {
                params: {
                    lectureId: lectureId
                }
            }).then(function (results) {

                var result = [];

                if (results.length > 0) {
                    _.forEach(results, function (question) {
                        result.push({
                            id: extractPropertyId(question),
                            title: question.title,
                            lectureId: question.lectureId,
                            creationDate: question.creationDate,
                            type: question.type,
                            data: JSON.parse(question.data)
                        });
                    });
                }

                callback(result);
            }).catch(function (error) {
                throw error;
            });
        }

        function getUserProfile(userId, callback) {
            db.query("" +
                "SELECT displayName AS name, email, avatarUrl, gender, birthday " +
                "FROM UserAccount " +
                "WHERE @rid = :userId", {
                params: {
                    userId: userId
                }
            }).then(function (results) {
                if (results.length > 0) {
                    var userProfile = results[0];
                    callback({
                        userId: userId,
                        name: userProfile.name,
                        email: userProfile.email,
                        avatarUrl: userProfile.avatarUrl,
                        gender: userProfile.gender || 'not_defined',
                        birthday: userProfile.birthday
                    });
                } else {
                    throw 'User not found';
                }
            }).catch(function (error) {
                throw error;
            });
        }

        function updateUserProfile(userId, data, callback) {
            db.query("" +
                "UPDATE User " +
                "SET displayName = :name, gender = :gender, birthday = :birthday " +
                "WHERE @rid = :userId", {
                params: {
                    userId: userId,
                    name: data.name,
                    gender: data.gender,
                    birthday: data.birthday || 0
                }
            }).then(function (results) {
                callback();
            }).catch(function (error) {
                throw error;
            });
        }

        /*TODO: end_integration*/

        function isSystemId(id) {
            if (id) {
                return SYSTEM_ID_PATTERN.test(id);
            }
            return false;
        }

        function decodeId(id) {
            if (isSystemId(id)) {
                return id;
            } else {
                if (id) {
                    return decodeBase64(id);
                }
            }
        }

        function encodeId(id) {
            if (isSystemId(id)) {
                return id;
            } else {
                if (id) {
                    return encodeBase64(id);
                }
            }
        }

        function decodeObject(object, properties) {
            if (object) {
                _.forEach(properties, function (property) {
                    object[property] = decodeId(object[property]);
                });
            }
        }

        function encodeObject(object, properties) {
            if (object) {
                _.forEach(properties, function (property) {
                    object[property] = encodeId(object[property]);
                });
            }
        }

        function getAccountEncoder(handler) {
            return {
                success: function (userAccount) {

                    encodeObject(userAccount, [
                        'userId'
                    ]);

                    handler.success(userAccount);
                },
                failure: function (error) {
                    handler.failure(error);
                }
            };
        }

        function verifyEmail(userId, handler) {
            dbWrapper.query("" +
                "UPDATE UserAccount " +
                "SET isEmailVerified = true " +
                "WHERE userId = :userId", {
                params: {
                    userId: userId
                }
            }).then(function () {
                handler.success();
            }).catch(function (error) {
                handler.failure(error);
            });
        }

        function attachEmail(userId, email, handler) {
            dbWrapper.query("" +
                "UPDATE UserAccount " +
                "SET email = :email, isEmailVerified = false " +
                "WHERE userId = :userId", {
                params: {
                    email: email,
                    userId: userId
                }
            }).then(function () {
                handler.success();
            }).catch(function (error) {
                handler.failure(error);
            });
        }

        return {
            createUser: function (data, isEmailVerified, handler) {
                createUser(data, isEmailVerified, getAccountEncoder(handler));
            },
            findUser: function (genericId, handler) {
                findUser(genericId, getAccountEncoder(handler));
            },
            verifyEmail: function (userId, handler) {
                userId = decodeId(userId);
                verifyEmail(userId, handler);
            },
            attachEmail: function (userId, email, handler) {
                userId = decodeId(userId);
                attachEmail(userId, email, handler);
            },
            getTasks: function (workspaceId, callback) {

                workspaceId = decodeId(workspaceId);

                getTasks(workspaceId, function (tasks) {

                    _.forEach(tasks, function (task) {
                        encodeObject(task, [
                            'id',
                            'creatorId',
                            'workspaceId'
                        ]);
                    });

                    callback(tasks);
                });
            },
            createTask: function (workspaceId, userId, data, callback) {

                workspaceId = decodeId(workspaceId);

                createTask(workspaceId, userId, data, function (task) {

                    encodeObject(task, [
                        'taskId'
                    ]);

                    callback(task);
                });
            },
            updateTasks: function (tasksModels, callback) {

                _.forEach(tasksModels, function (taskModel) {
                    decodeObject(taskModel, [
                        'id'
                    ]);
                });

                updateTasks(tasksModels, callback);
            },
            removeTasks: function (tasksIds, callback) {

                _.forEach(tasksIds, function (taskId, index) {
                    tasksIds[index] = decodeId(taskId);
                });

                removeTasks(tasksIds, callback);
            },
            setUserWorkspaceId: function (userId, workspaceId, rootWorkspaceId, callback) {

                userId = decodeId(userId);
                workspaceId = decodeId(workspaceId);
                rootWorkspaceId = decodeId(rootWorkspaceId);

                setUserWorkspaceId(userId, workspaceId, rootWorkspaceId, callback);
            },
            getUserWorkspaceId: function (userId, callback) {

                userId = decodeId(userId);

                getUserWorkspaceId(userId, function (workspaceId, rootWorkspaceId) {

                    workspaceId = encodeId(workspaceId);
                    rootWorkspaceId = encodeId(rootWorkspaceId);

                    callback(workspaceId, rootWorkspaceId);
                });
            },
            createDefaultWorkspace: function (name, creatorId, callback) {

                creatorId = decodeId(creatorId);

                createDefaultWorkspace(name, creatorId, function (workspace) {

                    encodeObject(workspace, [
                        'id',
                        'creatorId'
                    ]);

                    callback(workspace);
                });
            },
            createWorkspace: function (name, creatorId, parentWorkspaceId, callback) {

                creatorId = decodeId(creatorId);
                parentWorkspaceId = decodeId(parentWorkspaceId);

                createWorkspace(name, creatorId, parentWorkspaceId, function (workspace) {

                    encodeObject(workspace, [
                        'id',
                        'creatorId'
                    ]);

                    callback(workspace);
                });
            },
            updateWorkspace: function (workspaceId, data, callback) {

                workspaceId = decodeId(workspaceId);

                updateWorkspace(workspaceId, data, callback);
            },
            removeWorkspace: function (userId, workspaceId, callback) {

                userId = decodeId(userId);
                workspaceId = decodeId(workspaceId);

                removeWorkspace(userId, workspaceId, function (result) {

                    _.forEach(result.topLevelWorkspaceIdCollection, function (item) {
                        encodeObject(item, [
                            'userId',
                            'topLevelWorkspaceId'
                        ]);
                    });

                    callback(result);
                });
            },
            getWorkspaces: function (userId, callback) {

                userId = decodeId(userId);

                getWorkspaces(userId, function (result) {

                    _.forEach(result, function (workspaceId, index) {
                        result[index] = encodeId(workspaceId);
                    });

                    callback(result);
                });
            },
            getWorkspace: function (workspaceId, callback) {

                workspaceId = decodeId(workspaceId);

                getWorkspace(workspaceId, function (workspace) {

                    encodeObject(workspace, [
                        'id',
                        'creatorId'
                    ]);

                    callback(workspace);
                });
            },
            getDefaultWorkspaceId: function (userId, callback) {

                userId = decodeId(userId);

                getDefaultWorkspaceId(userId, function (workspaceId) {
                    workspaceId = encodeId(workspaceId);
                    callback(workspaceId);
                });
            },
            getUser: function (userId, callback) {

                userId = decodeId(userId);

                getUserById(userId, function (user) {

                    encodeObject(user, [
                        'id'
                    ]);

                    callback(user);
                });
            },
            getUsers: function (ids, callback) {

                _.forEach(ids, function (id, index) {
                    ids[index] = decodeId(id);
                });

                getUsersById(ids, function (users) {

                    _.forEach(users, function (user) {
                        encodeObject(user, [
                            'id'
                        ]);
                    });

                    callback(users);
                });
            },
            loadHierarchy: function (userId, workspaceId, rootWorkspaceId, callback) {

                userId = decodeId(userId);
                workspaceId = decodeId(workspaceId);
                rootWorkspaceId = decodeId(rootWorkspaceId);

                loadHierarchy(userId, workspaceId, rootWorkspaceId, function (status, hierarchy) {

                    if (hierarchy) {
                        _.forEach(hierarchy, function (id, index) {
                            hierarchy[index] = encodeId(id);
                        });
                    }

                    callback(status, hierarchy);
                });
            },
            getPermittedWorkspaces: function (userId, parentWorkspaceId, callback) {

                userId = decodeId(userId);
                parentWorkspaceId = decodeId(parentWorkspaceId);

                getPermittedWorkspaces(userId, parentWorkspaceId, function (workspaces) {

                    _.forEach(workspaces, function (workspace) {

                        if (workspace.isAvailable) {
                            encodeObject(workspace, [
                                'id',
                                'creatorId'
                            ]);
                        } else {
                            encodeObject(workspace, [
                                'id'
                            ]);
                        }
                    });

                    callback(workspaces);
                });
            },
            getAllWorkspaces: function (parentWorkspaceId, callback) {

                parentWorkspaceId = decodeId(parentWorkspaceId);

                getAllWorkspaces(parentWorkspaceId, function (workspaces) {

                    _.forEach(workspaces, function (workspace) {
                        encodeObject(workspace, [
                            'id'
                        ]);
                    });

                    callback(workspaces);
                });
            },
            getUsersCount: function (callback) {
                getUsersCount(callback);
            },
            getAllUsers: function (skip, limit, callback) {
                getAllUsers(skip, limit, function (result) {

                    _.forEach(result.users, function (user) {
                        encodeObject(user, [
                            'id'
                        ]);
                    });

                    callback(result);
                });
            },
            getAllUsersWithPermissions: function (workspaceId, skip, limit, callback) {

                workspaceId = decodeId(workspaceId);

                getAllUsersWithPermissions(workspaceId, skip, limit, function (result) {

                    _.forEach(result.users, function (user) {
                        encodeObject(user, [
                            'id'
                        ]);
                    });

                    callback(result);
                });
            },
            isAccessGrantedForWorkspace: function (userId, workspaceId, callback) {

                userId = decodeId(userId);
                workspaceId = decodeId(workspaceId);

                isAccessGrantedForWorkspace(userId, workspaceId, callback);
            },
            setUsersPermissionsForWorkspace: function (workspaceId, parentWorkspaceId, collection, callback) {

                workspaceId = decodeId(workspaceId);
                parentWorkspaceId = decodeId(parentWorkspaceId);

                _.forEach(collection, function (item) {
                    decodeObject(item, [
                        'userId'
                    ]);
                });

                setUsersPermissionsForWorkspace(workspaceId, parentWorkspaceId, collection, function (accessResultCollection) {

                    _.forEach(accessResultCollection, function (item) {
                        switch (item.status) {
                            case 'access_provided':
                            {
                                encodeObject(item, [
                                    'userId'
                                ]);

                                var hierarchy = item.hierarchy;
                                _.forEach(hierarchy, function (id, index) {
                                    hierarchy[index] = encodeId(id);
                                });

                                break;
                            }
                            case 'access_updated':
                            {
                                encodeObject(item, [
                                    'userId'
                                ]);
                                break;
                            }
                            case 'access_closed':
                            {
                                encodeObject(item, [
                                    'userId',
                                    'topLevelWorkspaceId'
                                ]);
                                break;
                            }
                        }
                    });

                    callback(accessResultCollection);
                });
            },
            addUserToGroup: function (userId, groupName, callback) {
                userId = decodeId(userId);
                addUserToGroup(userId, groupName, callback);
            },
            removeUserFromGroup: function (userId, groupName, callback) {
                userId = decodeId(userId);
                removeUserFromGroup(userId, groupName, callback);
            },
            /*TODO: begin_integration*/
            createTag: function (data, callback) {
                decodeObject(data, [
                    'categoryId',
                    'authorId'
                ]);
                createTag(data, function (tagId) {
                    tagId = encodeId(tagId);
                    callback(tagId);
                });
            },
            getTagById: function (tagId, callback) {
                tagId = decodeId(tagId);
                getTagById(tagId, function (tag) {
                    encodeObject(tag, [
                        'id',
                        'categoryId',
                        'authorId'
                    ]);
                    callback(tag);
                });
            },
            getTagsById: function (tagIds, callback) {

                _.forEach(tagIds, function (tagId, index) {
                    tagIds[index] = decodeId(tagId);
                });

                getTagsById(tagIds, function (tags) {

                    _.forEach(tags, function (tag) {
                        encodeObject(tag, [
                            'id',
                            'categoryId',
                            'authorId'
                        ]);
                    });

                    callback(tags);
                });
            },
            findTagsByName: function (namePart, callback) {
                findTagsByName(namePart, function (tags) {

                    _.forEach(tags, function (tag) {
                        encodeObject(tag, [
                            'id',
                            'categoryId',
                            'authorId'
                        ]);
                    });

                    callback(tags);
                });
            },
            updateTag: function (tagId, data, callback) {
                tagId = decodeId(tagId);

                decodeObject(data, [
                    'categoryId'
                ]);

                updateTag(tagId, data, callback);
            },
            removeTag: function (tagId, callback) {
                tagId = decodeId(tagId);
                removeTag(tagId, callback);
            },
            createCategory: function (data, callback) {
                decodeObject(data, [
                    'authorId',
                    'parentCategoryId'
                ]);
                createCategory(data, function (categoryId) {
                    categoryId = encodeId(categoryId);
                    callback(categoryId);
                });
            },
            getCategoryById: function (categoryId, callback) {
                categoryId = decodeId(categoryId);
                getCategoryById(categoryId, function (category) {
                    encodeObject(category, [
                        'id',
                        'parentCategoryId',
                        'authorId'
                    ]);
                    callback(category);
                });
            },
            getCategoriesById: function (categoryIds, callback) {

                _.forEach(categoryIds, function (categoryId, index) {
                    categoryIds[index] = decodeId(categoryId);
                });

                getCategoriesById(categoryIds, function (categories) {

                    _.forEach(categories, function (category) {
                        encodeObject(category, [
                            'id',
                            'parentCategoryId',
                            'authorId'
                        ]);
                    });

                    callback(categories);
                });
            },
            findCategoriesByName: function (namePart, callback) {
                findCategoriesByName(namePart, function (categories) {

                    _.forEach(categories, function (category) {
                        encodeObject(category, [
                            'id',
                            'parentCategoryId',
                            'authorId'
                        ]);
                    });

                    callback(categories);
                })
            },
            updateCategory: function (categoryId, data, callback) {
                categoryId = decodeId(categoryId);
                updateCategory(categoryId, data, callback);
            },
            removeCategory: function (categoryId, callback) {
                categoryId = decodeId(categoryId);
                removeCategory(categoryId, callback);
            },
            createLink: function (data, callback) {
                decodeObject(data, [
                    'authorId'
                ]);
                createLink(data, function (linkId) {
                    linkId = encodeId(linkId);
                    callback(linkId);
                });
            },
            attachLink: function (linkId, lectureId, callback) {
                linkId = decodeId(linkId);
                lectureId = decodeId(lectureId);
                attachLink(linkId, lectureId, callback);
            },
            detachLink: function (linkId, lectureId, callback) {
                linkId = decodeId(linkId);
                lectureId = decodeId(lectureId);
                detachLink(linkId, lectureId, callback);
            },
            getAttachedLinksByLectureId: function (lectureId, callback) {
                lectureId = decodeId(lectureId);
                getAttachedLinksByLectureId(lectureId, function (links) {

                    _.forEach(links, function (tag) {
                        encodeObject(tag, [
                            'id',
                            'authorId'
                        ]);
                    });

                    callback(links);
                });
            },
            getLinkById: function (linkId, callback) {
                linkId = decodeId(linkId);
                getLinkById(linkId, function (link) {
                    encodeObject(link, [
                        'id',
                        'authorId'
                    ]);
                    callback(link);
                });
            },
            getLinksById: function (linkIds, callback) {

                _.forEach(linkIds, function (linkId, index) {
                    linkIds[index] = decodeId(linkId);
                });

                getLinksById(linkIds, function (links) {

                    _.forEach(links, function (link) {
                        encodeObject(link, [
                            'id',
                            'authorId'
                        ]);
                    });

                    callback(links);
                });
            },
            updateLink: function (linkId, data, callback) {
                linkId = decodeId(linkId);
                updateLink(linkId, data, callback);
            },
            removeLink: function (linkId, callback) {
                linkId = decodeId(linkId);
                removeLink(linkId, callback);
            },
            createLecture: function (data, callback) {

                decodeObject(data, [
                    'authorId',
                    'workspaceId'
                ]);

                createLecture(data, function (lecture) {
                    encodeObject(lecture, [
                        'lectureId'
                    ]);
                    callback(lecture);
                });
            },
            getLectureById: function (lectureId, callback) {
                lectureId = decodeId(lectureId);
                getLectureById(lectureId, function (lecture) {

                    encodeObject(lecture, [
                        'id',
                        'authorId',
                        'workspaceId'
                    ]);

                    encodeObject(lecture.author, [
                        'id'
                    ]);

                    _.forEach(lecture.links, function (link) {
                        encodeObject(link, [
                            'id',
                            'authorId'
                        ]);
                    });

                    if (lecture.condition['status'] != 'stopped') {
                        encodeObject(lecture.condition, [
                            'lecturerId'
                        ]);
                    }

                    callback(lecture);
                });
            },
            getLecturesByWorkspaceId: function (workspaceId, callback) {
                workspaceId = decodeId(workspaceId);
                getLecturesByWorkspaceId(workspaceId, function (lectures) {

                    _.forEach(lectures, function (lecture) {

                        encodeObject(lecture, [
                            'id',
                            'authorId',
                            'workspaceId'
                        ]);

                        encodeObject(lecture.author, [
                            'id'
                        ]);

                        _.forEach(lecture.links, function (link) {
                            encodeObject(link, [
                                'id',
                                'authorId'
                            ]);
                        });

                        if (lecture.condition['status'] != 'stopped') {
                            encodeObject(lecture.condition, [
                                'lecturerId'
                            ]);
                        }
                    });

                    callback(lectures);
                })
            },
            getLecturesByAuthorId: function (authorId, callback) {
                authorId = decodeId(authorId);
                getLecturesByAuthorId(authorId, function (lectures) {

                    _.forEach(lectures, function (lecture) {

                        encodeObject(lecture, [
                            'id',
                            'authorId',
                            'workspaceId'
                        ]);

                        encodeObject(lecture.author, [
                            'id'
                        ]);

                        _.forEach(lecture.links, function (link) {
                            encodeObject(link, [
                                'id',
                                'authorId'
                            ]);
                        });

                        if (lecture.condition['status'] != 'stopped') {
                            encodeObject(lecture.condition, [
                                'lecturerId'
                            ]);
                        }
                    });

                    callback(lectures);
                })
            },
            getActiveLectures: function (callback) {
                getActiveLectures(function (lectures) {

                    _.forEach(lectures, function (lecture) {

                        encodeObject(lecture, [
                            'id',
                            'authorId',
                            'workspaceId'
                        ]);

                        encodeObject(lecture.author, [
                            'id'
                        ]);

                        _.forEach(lecture.links, function (link) {
                            encodeObject(link, [
                                'id',
                                'authorId'
                            ]);
                        });

                        if (lecture.condition['status'] != 'stopped') {
                            encodeObject(lecture.condition, [
                                'lecturerId'
                            ]);
                        }
                    });

                    callback(lectures);
                });
            },
            updateLecture: function (lectureId, data, callback) {
                lectureId = decodeId(lectureId);
                updateLecture(lectureId, data, callback);
            },
            removeLecture: function (lectureId, callback) {
                lectureId = decodeId(lectureId);
                removeLecture(lectureId, callback);
            },
            loadStatisticForLecture: function (lectureId, callback) {
                loadStatisticForLecture(lectureId, callback);
            },
            updateStatisticForLecture: function (lectureId, statisticData, callback) {
                updateStatisticForLecture(lectureId, statisticData, callback);
            },
            getLectureCondition: function (lectureId, callback) {
                lectureId = encodeId(lectureId);
                getLectureCondition(lectureId, function (condition) {
                    if (condition.status != 'stopped') {
                        encodeObject(condition, [
                            'lecturerId'
                        ]);
                    }
                    callback(condition);
                });
            },
            updateLectureStatus: function (lectureId, lecturerId, status, callback) {
                lectureId = decodeId(lectureId);
                lecturerId = decodeId(lecturerId);
                updateLectureStatus(lectureId, lecturerId, status, callback);
            },
            createQuestion: function (lectureId, questionModel, callback) {
                lectureId = decodeId(lectureId);
                createQuestion(lectureId, questionModel, function (question) {

                    encodeObject(question, [
                        'questionId'
                    ]);

                    callback(question);
                });
            },
            updateQuestion: function (questionId, questionModel, callback) {
                questionId = decodeId(questionId);
                updateQuestion(questionId, questionModel, callback);
            },
            removeQuestion: function (questionId, callback) {
                questionId = decodeId(questionId);
                removeQuestion(questionId, callback);
            },
            getQuestionById: function (questionId, callback) {

                questionId = decodeId(questionId);

                getQuestionById(questionId, function (question) {

                    encodeObject(question, [
                        'id',
                        'lectureId'
                    ]);

                    callback(question);
                });
            },
            getQuestionsByLectureId: function (lectureId, callback) {

                lectureId = decodeId(lectureId);

                getQuestionsByLectureId(lectureId, function (questions) {
                    _.forEach(questions, function (question) {
                        encodeObject(question, [
                            'id',
                            'lectureId'
                        ]);
                    });

                    callback(questions);
                });
            },
            getUserProfile: function (userId, callback) {
                userId = decodeId(userId);
                getUserProfile(userId, function (userProfile) {

                    encodeObject(userProfile, [
                        'userId'
                    ]);

                    callback(userProfile);
                });
            },
            updateUserProfile: function (userId, data, callback) {
                userId = decodeId(userId);
                updateUserProfile(userId, data, callback);
            }
            /*TODO: end_integration*/
        };
    };

})(require);