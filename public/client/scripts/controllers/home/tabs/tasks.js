"use strict";

angular.module('application')

    .controller('TasksController', [

        '$scope',
        '$rootScope',
        '$location',
        'apiService',
        'notificationsService',
        'filterFilter',
        'dialogsService',
        'translatorService',

        function ($scope, $rootScope, $location, apiService, notificationsService, filterFilter, dialogsService, translatorService) {

            var notificationsTranslator = translatorService.getSector('home.notifications');

            var itemPriorityDropdown = {
                isOpen: false
            };

            var newTask = {
                title: '',
                priority: 'none'
            };

            function getWorkspaceId() {
                return $scope.getWorkspaceId();
            }

            function changeNotification(userId, messageBuilder, type) {

                if (!type) {
                    type = 'info';
                }

                apiService.getUser(userId, function (user) {
                    var userName = user.displayName;
                    var message = messageBuilder(userName);
                    notificationsService.notify(message, type);
                });
            }

            function setFocus() {
                var input = angular.element('#main-input');
                input.focus();
            }

            function setItemPriority(priority) {
                newTask.priority = priority;
                itemPriorityDropdown.isOpen = false;
                setFocus();
            }

            function setViewMode(viewMode) {
                $scope.currentViewMode = viewMode;
            }

            function taskCreated(userId, tesk) {
                changeNotification(userId, function (userName) {

                    var tasks = $scope.tasks;
                    tasks.push(tesk);

                    return notificationsTranslator.format('user_added_item', {
                        userName: userName
                    });
                });
            }

            function tasksUpdated(userId, tasks) {
                changeNotification(userId, function (userName) {

                    _.forEach(tasks, function (item) {

                        var task = _.findWhere($scope.tasks, {
                            id: item.id
                        });

                        task.title = item.title;
                        task.completed = item.completed;
                        task.priority = item.priority;
                    });

                    return notificationsTranslator.format('user_updated_items', {
                        userName: userName,
                        count: tasks.length
                    });
                });
            }

            function tasksRemoved(userId, tasksIds) {
                changeNotification(userId, function (userName) {

                    $scope.tasks = _.filter($scope.tasks, function (task) {
                        return !_.contains(tasksIds, task.id);
                    });

                    return notificationsTranslator.format('user_removed_items', {
                        userName: userName,
                        count: tasksIds.length
                    });
                });
            }

            function addTask() {

                var title = newTask['title'].trim();
                if (!title.length) {
                    return;
                }

                var task = {
                    title: title,
                    completed: false,
                    priority: newTask.priority
                };

                apiService.createTask(getWorkspaceId(), task, function (response) {

                    task.id = response.taskId;
                    task.creationDate = response.creationDate;

                    var tasks = $scope.tasks;
                    tasks.push(task);

                    newTask.title = '';
                    newTask.priority = 'none';

                    var socketConnection = $scope.socketConnection;
                    socketConnection.createdTask(task);

                    setFocus();
                });
            }

            function showItemEditor(task) {
                dialogsService.showItemEditor({
                    item: task,
                    onUpdate: function (task, closeCallback) {
                        apiService.updateTasks([task], function () {

                            var socketConnection = $scope.socketConnection;
                            socketConnection.updatedTasks([task]);

                            closeCallback();
                        });
                    }
                });
            }

            function removeTask(task) {
                apiService.removeTasks([task.id], function () {

                    $scope.tasks = _.without($scope.tasks, task);

                    var socketConnection = $scope.socketConnection;
                    socketConnection.removedTasks([task.id]);
                });
            }

            function clearDoneTasks() {

                var ids = [];
                _.forEach($scope.tasks, function (task) {
                    if (task.completed) {
                        ids.push(task.id);
                    }
                });

                dialogsService.showConfirmation({
                    context: {
                        count: ids.length
                    },
                    title: 'Remove completed tasks',
                    message: 'Remove <b>{{ count }}</b> completed item(s)?',
                    onAccept: function (closeCallback) {
                        apiService.removeTasks(ids, function () {
                            $scope.tasks = _.filter($scope.tasks, function (item) {
                                return !item.completed;
                            });

                            var socketConnection = $scope.socketConnection;
                            socketConnection.removedTasks(ids);

                            closeCallback();
                        });
                    }
                });
            }

            function mark(task) {
                apiService.updateTasks([
                    {
                        id: task.id,
                        title: task.title,
                        completed: task.completed,
                        priority: task.priority
                    }
                ], function () {
                    var socketConnection = $scope.socketConnection;
                    socketConnection.updatedTasks([task]);
                });
            }

            function markAll(done) {
                var tasks = [];

                _.forEach($scope.tasks, function (task) {
                    if (task.completed != done) {
                        tasks.push({
                            id: task.id,
                            title: task.title,
                            completed: done,
                            priority: task.priority
                        });
                    }
                });

                apiService.updateTasks(tasks, function () {

                    _.forEach($scope.tasks, function (task) {
                        task.completed = done;
                    });

                    var socketConnection = $scope.socketConnection;
                    socketConnection.updatedTasks(tasks);
                });
            }

            function subscribeForSocketEvent() {

                $scope.$on(SocketCommands.TASK_CREATED, function (event, data) {
                    taskCreated(data['userId'], data['task']);
                });

                $scope.$on(SocketCommands.TASKS_UPDATED, function (event, data) {
                    tasksUpdated(data['userId'], data['tasks']);
                });

                $scope.$on(SocketCommands.TASKS_REMOVED, function (event, data) {
                    tasksRemoved(data['userId'], data['tasksIds']);
                });
            }

            $scope.loading = true;
            $scope.tasks = [];
            $scope.newTask = newTask;
            $scope.itemPriorityDropdown = itemPriorityDropdown;
            $scope.viewModes = [
                {
                    titleKey: 'home.all',
                    name: 'all',
                    icon: 'fa-book'
                },
                {
                    titleKey: 'home.active',
                    name: 'active',
                    icon: 'fa-rocket'
                },
                {
                    titleKey: 'home.completed',
                    name: 'completed',
                    icon: 'fa-flag'
                }
            ];
            $scope.currentViewMode = _.findWhere($scope.viewModes, {
                name: 'all'
            });

            $scope.$watch('currentViewMode', function (viewMode) {
                switch (viewMode.name) {
                    case 'active':
                    {
                        $scope.statusFilter = {
                            completed: false
                        };
                        break;
                    }
                    case 'completed':
                    {
                        $scope.statusFilter = {
                            completed: true
                        };
                        break;
                    }
                    default :
                    {
                        $scope.statusFilter = null;
                        break
                    }
                }
            });

            $scope.$watch('tasks', function () {

                $scope.remainingCount = filterFilter($scope.tasks, {
                    completed: false
                }).length;

                $scope.doneCount = $scope.tasks.length - $scope.remainingCount;
                $scope.allChecked = !$scope.remainingCount;

            }, true);

            $scope.setItemPriority = setItemPriority;
            $scope.setViewMode = setViewMode;
            $scope.taskCreated = taskCreated;
            $scope.tasksUpdated = tasksUpdated;
            $scope.tasksRemoved = tasksRemoved;
            $scope.addTask = addTask;
            $scope.showItemEditor = showItemEditor;
            $scope.removeTask = removeTask;
            $scope.clearDoneTasks = clearDoneTasks;
            $scope.mark = mark;
            $scope.markAll = markAll;

            subscribeForSocketEvent();

            $scope.$on('home:workspaceChanged', function (event, workspaceId) {
                $scope.loading = true;
                apiService.getTasks(workspaceId, function (tasks) {
                    $scope.tasks = tasks;
                    $scope.loading = false;
                });
            });
        }
    ]
);