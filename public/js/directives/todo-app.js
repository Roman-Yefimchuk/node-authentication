app.directive('todoApplication', ['$location', 'todoStorage', 'filterFilter',
    function ($location, todoStorage, filterFilter) {
        return {
            restrict: 'A',
            scope: {
                workspaceId: '@',
                workspaceName: '@'
            },
            controller: function ($scope) {

                $scope.showWorkspaces = false;

                $scope.$watch('workspaceId', function (workspaceId) {
                    todoStorage.items(workspaceId, function (items) {
                        $scope.todos = items;
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

                    todoStorage.save({
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
                        todoStorage.update([todo]);
                    }
                };

                $scope.removeTodo = function (todo) {
                    todoStorage.remove([todo['_id']], function () {
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

                    todoStorage.remove(ids, function () {
                        $scope.todos = $scope.todos.filter(function (val) {
                            return !val.completed;
                        });
                    });
                };

                $scope.mark = function (todo) {
                    todoStorage.update([todo]);
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

                    todoStorage.update(todos, function () {
                        $scope.todos.forEach(function (todo) {
                            todo.completed = done;
                        });
                    });
                };
            }
        }
    }
]);
