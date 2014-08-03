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
                userId: '@',
                userName: '@'
            },
            controller: function ($scope) {

                function getWorkspaceId() {
                    return $scope.currentWorkspace['_id'];
                }

                $scope.usersCount = 4;
                $scope.workspaces = [];
                $scope.currentWorkspace = undefined;
                $scope.permissions = {
                    readOnly: false,
                    collectionManager: false,
                    accessManager: false
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

                $scope.$watch('defaultWorkspaceId', function (workspaceId) {

                    notificationProvider.info("Hello " + $scope.userName + "!");

                    apiProvider.getPermittedWorkspaces(function (workspaces) {
                        $scope.workspaces = workspaces;

                        $scope.$watch('currentWorkspace', function (workspace) {
                            if (workspace) {
                                var workspaceId = getWorkspaceId();

                                apiProvider.setUserWorkspace(workspaceId, function (data) {
                                    $scope.permissions = data.permissions;
                                    $scope.isOwnWorkspace = data.isOwnWorkspace;

                                    apiProvider.items(workspaceId, function (items) {
                                        $scope.todos = items;
                                    });
                                });
                            }
                        });

                        $scope.currentWorkspace = _.findWhere(workspaces, {
                            _id: workspaceId
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
                        item._id = itemId;

                        $scope.todos.push(item);
                        $scope.newTodo = '';
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
                        apiProvider.update(getWorkspaceId(), [todo]);
                    }
                };

                $scope.removeTodo = function (todo) {
                    apiProvider.remove(getWorkspaceId(), [todo['_id']], function () {
                        $scope.todos.splice($scope.todos.indexOf(todo), 1);
                    });
                };

                $scope.clearDoneTodos = function () {
                    var ids = [];
                    $scope.todos.forEach(function (todo) {
                        if (todo.completed) {
                            ids.push(todo['_id']);
                        }
                    });

                    apiProvider.remove(getWorkspaceId(), ids, function () {
                        $scope.todos = $scope.todos.filter(function (val) {
                            return !val.completed;
                        });
                    });
                };

                $scope.mark = function (todo) {
                    apiProvider.update(getWorkspaceId(), [todo]);
                };

                $scope.markAll = function (done) {
                    var todos = [];

                    $scope.todos.forEach(function (todo) {
                        if (todo.completed != done) {
                            todos.push({
                                _id: todo._id,
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
