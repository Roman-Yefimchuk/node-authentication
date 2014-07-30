app.directive('todoApplication', ['$location', 'todoStorage', 'workspaceProvider', 'filterFilter',
    function ($location, todoStorage, workspaceProvider, filterFilter) {
        return {
            restrict: 'A',
            scope: {
                defaultWorkspaceId: '@',
                userId: '@'
            },
            controller: function ($scope) {

                function initSocket() {
                    var socket = io.connect('http://127.0.0.1:8080/');

                    socket.emit('register_user', {
                        userId: $scope.userId
                    });

                    socket.on('notification', function (data) {
                        $.notify(data['message'], {
                                position: "right bottom",
                                className: data['type'],
                                autoHideDelay: 2500
                            }
                        );
                    });
                }

                function getWorkspaceId() {
                    return $scope.currentWorkspace['_id'];
                }

                $scope.workspaces = [];
                $scope.currentWorkspace = undefined;

                $scope.$watch('defaultWorkspaceId', function (workspaceId) {
                    workspaceProvider.getAllWorkspaces(function (workspaces) {
                        $scope.workspaces = workspaces;

                        $scope.$watch('currentWorkspace', function (workspace) {
                            if (workspace) {
                                var workspaceId = getWorkspaceId();

                                workspaceProvider.setUserWorkspace(workspaceId, function () {
                                    todoStorage.items(workspaceId, function (items) {
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

                    todoStorage.save(getWorkspaceId(), {
                        title: item.title,
                        completed: item.completed
                    }, function (itemId) {
                        item._id = itemId;

                        $scope.todos.push(item);
                        $scope.newTodo = '';
                    });
                };

                $scope.editTodo = function (todo) {
                    $scope.editedTodo = todo;
                };

                $scope.doneEditing = function (todo) {
                    $scope.editedTodo = null;
                    todo.title = todo.title.trim();

                    if (!todo.title) {
                        $scope.removeTodo(todo);
                    } else {
                        todoStorage.update(getWorkspaceId(), [todo]);
                    }
                };

                $scope.removeTodo = function (todo) {
                    todoStorage.remove(getWorkspaceId(), [todo['_id']], function () {
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

                    todoStorage.remove(getWorkspaceId(), ids, function () {
                        $scope.todos = $scope.todos.filter(function (val) {
                            return !val.completed;
                        });
                    });
                };

                $scope.mark = function (todo) {
                    todoStorage.update(getWorkspaceId(), [todo]);
                }

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

                    todoStorage.update(getWorkspaceId(), todos, function () {
                        $scope.todos.forEach(function (todo) {
                            todo.completed = done;
                        });
                    });
                };

                $scope.manageWorkspace = function () {
                }

                $scope.logout = function () {
                    window.location = 'logout';
                };
            }
        }
    }
]);
