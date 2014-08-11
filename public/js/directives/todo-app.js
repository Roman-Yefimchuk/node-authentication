"use strict";

app.directive('todoApplication', [

    '$location',
    'apiProvider',
    'socketProvider',
    'notificationProvider',
    'filterFilter',
    '$rootScope',

    function ($location, apiProvider, socketProvider, notificationProvider, filterFilter, $rootScope) {
        return {
            restrict: 'A',
            scope: {
                defaultWorkspaceId: '@',
                workspaceId: '@',
                userId: '@',
                userName: '@',
                authorizationProvider: '@'
            },
            templateUrl: '/views/todo-view.html',
            controller: function ($scope) {

                function getWorkspaceId() {
                    return $scope.currentWorkspace['id'];
                }

                function changeNotification(userId, messageBuilder, type) {
                    if (!type) {
                        type = 'info';
                    }

                    apiProvider.getUser(userId, function (user) {
                        var userName = user.displayName;

                        var message = messageBuilder(userName);
                        notificationProvider.notify(message, type);
                    });
                }

                function permissionsChangeNotification(userId, workspaceId, messageBuilder, type) {
                    if (!type) {
                        type = 'info';
                    }

                    apiProvider.getUser(userId, function (user) {
                        var userName = user.displayName;

                        apiProvider.getWorkspace(workspaceId, function (workspace) {
                            var workspaceName = workspace.name;

                            var message = messageBuilder(userName, workspaceName);
                            notificationProvider.notify(message, type);
                        });
                    });
                }

                $scope.presentUsers = [];
                $scope.workspaces = [];
                $scope.currentWorkspace = undefined;
                $scope.permissions = {
                    readOnly: false,
                    collectionManager: false,
                    accessManager: false
                };

                $scope.updatePermissions = function (userId, workspaceId, permissions) {
                    permissionsChangeNotification(userId, workspaceId, function (userName, workspaceName) {

                        if (_.findWhere($scope.workspaces, { id: workspaceId })) {
                            if (getWorkspaceId() == workspaceId) {
                                $scope.permissions = permissions;
                            }
                        } else {
                            apiProvider.getWorkspace(workspaceId, function (workspace) {
                                $scope.workspaces.push(workspace);
                            });
                        }

                        return "User " + userName + " updated you permissions for workspace " + workspaceName;
                    });
                };

                $scope.closeAccess = function (userId, workspaceId) {
                    permissionsChangeNotification(userId, workspaceId, function (userName, workspaceName) {

                        $scope.workspaces = _.filter($scope.workspaces, function (workspace) {
                            return workspace.id != workspaceId;
                        });

                        if (getWorkspaceId() == workspaceId) {
                            $scope.currentWorkspace = _.findWhere($scope.workspaces, {
                                id: $scope.defaultWorkspaceId
                            });
                        }

                        return "User " + userName + " closed access for you to workspace " + workspaceName;
                    }, 'warning');
                };

                $scope.userJoined = function (userId, callback) {
                    apiProvider.getUser(userId, function (user) {
                        $scope.presentUsers.push(userId);
                        callback(user);
                    });
                };

                $scope.userHasLeft = function (userId, callback) {
                    apiProvider.getUser(userId, function (user) {
                        $scope.presentUsers = $scope.presentUsers.filter(function (value) {
                            return value != userId;
                        });
                        callback(user);
                    });
                };

                $scope.canReadOnly = function () {
                    var permissions = $scope.permissions;
                    if (permissions.readOnly && !permissions.collectionManager) {
                        return true;
                    }
                    return !permissions.collectionManager;
                };

                $scope.canManageCollection = function () {
                    var permissions = $scope.permissions;
                    return permissions.collectionManager;
                };

                $scope.canManageAccess = function () {
                    var permissions = $scope.permissions;
                    return permissions.accessManager;
                };

                $scope.$watch('workspaceId', function (workspaceId) {

                    var socketConnection = socketProvider.openCollection('http://127.0.0.1:8080/', $scope, workspaceId);
                    $scope.socketConnection = socketConnection;

                    notificationProvider.info("Hello " + $scope.userName + "!");

                    apiProvider.getPermittedWorkspaces(function (workspaces) {
                        $scope.workspaces = workspaces;

                        $scope.$watch('currentWorkspace', function (workspace) {
                            if (workspace) {
                                var workspaceId = getWorkspaceId();

                                apiProvider.setUserWorkspace(workspaceId, function (data) {

                                    socketConnection.changedWorkspace();
                                    socketConnection.updatePresentUsers();

                                    $scope.permissions = data.permissions;
                                    $scope.isOwnWorkspace = data.isOwnWorkspace;

                                    apiProvider.items(workspaceId, function (items) {
                                        $scope.todos = items;
                                    });
                                });
                            }
                        });

                        $scope.currentWorkspace = _.findWhere(workspaces, {
                            id: workspaceId
                        });
                    });
                });

                $scope.todos = [];
                $scope.newTodo = '';
                $scope.editedTodo = null;

                $scope.$watch('todos', function () {

                    $scope.remainingCount = filterFilter($scope.todos, {
                        completed: false
                    }).length;

                    $scope.doneCount = $scope.todos.length - $scope.remainingCount;
                    $scope.allChecked = !$scope.remainingCount;
                }, true);

                if ($location.path() === '') {
                    $location.path('/');
                }

                $scope.location = $location;

                $scope.$watch('location.path()', function (path) {
                    $scope.statusFilter = (path === '/active') ?
                    { completed: false } : (path === '/completed') ?
                    { completed: true } : null;
                });

                $scope.addedItem = function (userId, item) {
                    changeNotification(userId, function (userName) {

                        $scope.todos.push(item);

                        return "User " + userName + " added item";
                    });
                };

                $scope.updatedItems = function (userId, items) {
                    changeNotification(userId, function (userName) {

                        _.forEach(items, function (item) {

                            var todo = _.findWhere($scope.todos, {
                                id: item.id
                            });

                            todo.title = item.title;
                            todo.completed = item.completed;
                        });

                        return "User " + userName + " updated " + items.length + " item(s)";
                    });
                };

                $scope.removedItems = function (userId, itemIds) {
                    changeNotification(userId, function (userName) {

                        $scope.todos = _.filter($scope.todos, function (todo) {
                            return !_.contains(itemIds, todo.id);
                        });

                        return "User " + userName + " removed " + itemIds.length + " item(s)";
                    });
                };

                $scope.addTodo = function () {
                    var newTodo = $scope.newTodo.trim();
                    if (!newTodo.length) {
                        return;
                    }

                    var item = {
                        title: newTodo,
                        completed: false
                    };

                    apiProvider.save(getWorkspaceId(), {
                        title: item.title,
                        completed: item.completed
                    }, function (itemId) {
                        item.id = itemId;

                        $scope.todos.push(item);
                        $scope.newTodo = '';

                        var socketConnection = $scope.socketConnection;
                        socketConnection.addedItem(item);
                    });
                };

                $scope.editTodo = function (todo) {
                    if ($scope.permissions.collectionManager) {
                        $scope.editedTodo = todo;
                    }
                };

                $scope.doneEditing = function (todo) {
                    $scope.editedTodo = null;
                    todo.title = todo.title.trim();

                    if (!todo.title) {
                        $scope.removeTodo(todo);
                    } else {
                        apiProvider.update(getWorkspaceId(), [todo], function () {
                            var socketConnection = $scope.socketConnection;
                            socketConnection.updatedItems([todo]);
                        });
                    }
                };

                $scope.removeTodo = function (todo) {
                    apiProvider.remove(getWorkspaceId(), [todo.id], function () {
                        $scope.todos.splice($scope.todos.indexOf(todo), 1);

                        var socketConnection = $scope.socketConnection;
                        socketConnection.removedItems([todo.id]);
                    });
                };

                $scope.clearDoneTodos = function () {
                    var ids = [];
                    $scope.todos.forEach(function (todo) {
                        if (todo.completed) {
                            ids.push(todo.id);
                        }
                    });

                    apiProvider.remove(getWorkspaceId(), ids, function () {
                        $scope.todos = $scope.todos.filter(function (val) {
                            return !val.completed;
                        });

                        var socketConnection = $scope.socketConnection;
                        socketConnection.removedItems(ids);
                    });
                };

                $scope.mark = function (todo) {
                    apiProvider.update(getWorkspaceId(), [todo], function () {
                        var socketConnection = $scope.socketConnection;
                        socketConnection.updatedItems([todo]);
                    });
                };

                $scope.markAll = function (done) {
                    var todos = [];

                    $scope.todos.forEach(function (todo) {
                        if (todo.completed != done) {
                            todos.push({
                                id: todo.id,
                                completed: done,
                                title: todo.title,
                                userId: todo.userId
                            });
                        }
                    });

                    apiProvider.update(getWorkspaceId(), todos, function () {
                        $scope.todos.forEach(function (todo) {
                            todo.completed = done;
                        });

                        var socketConnection = $scope.socketConnection;
                        socketConnection.updatedItems(todos);
                    });
                };

                $scope.manageWorkspace = function () {
                    $rootScope.$emit('openWorkspaceManager', $scope);
                };

                $scope.showUsers = function () {
                    $rootScope.$emit('openUsersDialog', $scope);
                };

                $scope.isItemLocked = function (itemId) {
                    return false;
                };

                $scope.logout = function () {
                    window.location = 'logout';
                };
            }
        }
    }
]);
