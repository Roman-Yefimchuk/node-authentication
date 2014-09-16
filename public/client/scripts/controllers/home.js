"use strict";

angular.module('application')

    .controller('HomeController', [

        '$scope',
        '$rootScope',
        '$location',
        'apiService',
        'socketsService',
        'notificationsService',
        'filterFilter',
        'userService',
        'loaderService',
        'dialogsService',
        'SOCKET_URL',
        'DEBUG_MODE',
        'ROOT_ID',

        function ($scope, $rootScope, $location, apiService, socketsService, notificationsService, filterFilter, userService, loaderService, dialogsService, SOCKET_URL, DEBUG_MODE, ROOT_ID) {

            var BreadcrumbItem = (function () {
                function BreadcrumbItem(node) {
                    this.node = node;
                }

                BreadcrumbItem.prototype.click = function () {
                    var node = this.node;
                    updateActiveNode(node);
                };

                BreadcrumbItem.prototype.getLabel = function () {
                    var node = this.node;
                    return node.getLabel();
                };

                return BreadcrumbItem;
            })();

            $scope.treeModel = [];
            $scope.breadcrumb = [];
            $scope.errorMessage = null;
            $scope.currentWorkspace = undefined;
            $scope.loading = true;
            $scope.todos = [];
            $scope.newTodo = '';
            $scope.presentUsers = [];
            $scope.workspaces = [];
            $scope.user = {};
            $scope.workspaceDropdown = {
                isOpen: false
            };
            $scope.permissions = {
                readOnly: false,
                collectionManager: false,
                accessManager: false
            };
            $scope.viewModes = [
                {
                    title: 'All',
                    name: 'all',
                    icon: 'fa-book'
                },
                {
                    title: 'Active',
                    name: 'active',
                    icon: 'fa-rocket'
                },
                {
                    title: 'Completed',
                    name: 'completed',
                    icon: 'fa-flag'
                }
            ];
            $scope.currentViewMode = _.find($scope.viewModes, function (viewMode) {
                return viewMode.name == 'all';
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

            $scope.$watch('currentWorkspace', function (workspace) {
                if (workspace) {

                    var workspaceId = getWorkspaceId();
                    var rootWorkspaceId = getRootWorkspaceId();

                    apiService.setUserWorkspace(workspaceId, rootWorkspaceId, function (data) {

                        var socketConnection = $scope.socketConnection;

                        socketConnection.changedWorkspace(workspaceId);
                        socketConnection.updatePresentUsers(workspaceId);

                        $scope.permissions = data.permissions;
                        $scope.isOwnWorkspace = data.isOwnWorkspace;

                        apiService.items(workspaceId, function (items) {
                            $scope.todos = items;
                            $scope.loading = false;
                        });
                    });
                }
            });

            $scope.$watch('todos', function () {

                $scope.remainingCount = filterFilter($scope.todos, {
                    completed: false
                }).length;

                $scope.doneCount = $scope.todos.length - $scope.remainingCount;
                $scope.allChecked = !$scope.remainingCount;
            }, true);

            loaderService.showLoader();

            userService.getData({
                success: function (user, externalNotification) {

                    $scope.$on('socketsService:error', function (event, error) {
                        $scope.errorMessage = 'Connection problem with socket';
                        loaderService.hideLoader();
                    });

                    socketsService.openCollection({
                        url: SOCKET_URL,
                        userId: user.userId,
                        workspaceId: user.workspaceId
                    }, function (socketConnection) {
                        $scope.socketConnection = socketConnection;

                        subscribeForSocketEvent();

                        apiService.getPermittedWorkspaces(ROOT_ID, function (workspaces) {

                            var treeModel = [];

                            _.forEach(workspaces, function (workspace) {
                                var item = workspaceToItem(workspace);
                                treeModel.push(item);
                            });

                            var ready = $scope.$on('workspaceTree[home-tree]:ready', function () {
                                searchNode(user.workspaceId, function (node) {

                                    function onLoadingReady() {
                                        loaderService.hideLoader();

                                        if (externalNotification) {
                                            notificationsService.notify(externalNotification.message, externalNotification.type);
                                        }

                                        notificationsService.info("Hello @{userName}!", {
                                            userName: user.displayName
                                        });
                                    }

                                    if (node) {
                                        updateActiveNode(node);
                                        onLoadingReady();
                                    } else {
                                        searchNode(user.rootWorkspaceId, function (rootNode) {

                                            apiService.loadHierarchy(user.workspaceId, user.rootWorkspaceId, function (data) {

                                                switch (data.status) {
                                                    case 'success':
                                                    {
                                                        var activeNode = rootNode;

                                                        syncCycle(data.workspaces, function (workspaceId, index, next) {
                                                            activeNode.expand(function () {
                                                                searchNode(workspaceId, function (node) {
                                                                    activeNode = node;
                                                                    next();
                                                                });
                                                            });
                                                        }, function () {
                                                            updateActiveNode(activeNode);
                                                            onLoadingReady();
                                                        });

                                                        break;
                                                    }
                                                    case 'access_denied':
                                                    case 'not_found':
                                                    {
                                                        searchNode(user.defaultWorkspaceId, function (node) {
                                                            notificationsService.notify('Workspace was changed', 'warning');

                                                            updateActiveNode(node);
                                                            onLoadingReady();
                                                        });
                                                        break;
                                                    }
                                                }
                                            });
                                        });
                                    }
                                });

                                ready();
                            });

                            $scope.treeModel = treeModel;
                            $scope.workspaces = workspaces;
                            $scope.user = user;
                        });
                    });
                },
                failure: function (error) {
                    $location.path('/');
                    loaderService.hideLoader();
                }
            });

            $scope.showWorkspaceId = function () {
                if (DEBUG_MODE) {
                    dialogsService.showAlert({
                        context: {
                            rootWorkspaceId: getRootWorkspaceId(),
                            workspaceId: getWorkspaceId(),
                            userId: $scope.user['userId']
                        },
                        title: 'Development info',
                        message: '' +
                            'rootWorkspaceId: <b>{{ rootWorkspaceId }}</b>' +
                            '<br>' +
                            'workspaceId: <b>{{ workspaceId }}</b>' +
                            '<br>' +
                            'userId: <b>{{ userId }}</b>'
                    });
                }
            };

            $scope.onWorkspaceChanged = function (node) {
                updateActiveNode(node);
                $scope.workspaceDropdown['isOpen'] = false;
            };

            $scope.onWorkspaceLoading = function (item, callback) {
                var workspace = item.workspace;
                apiService.getPermittedWorkspaces(workspace.id, function (data) {
                    callback(data, function (workspace) {
                        return workspaceToItem(workspace);
                    });
                });
            };

            $scope.setViewMode = function (viewMode) {
                $scope.currentViewMode = viewMode;
            };

            $scope.updatePermissions = function (userId, workspaceId, parentWorkspaceId, permissions) {
                permissionsChangeNotification(userId, workspaceId, function (userName, workspaceName) {

                    if (parentWorkspaceId == ROOT_ID) {

                        searchNode(workspaceId, function (node) {

                            if (node) {
                                var workspace = node.getWorkspace();
                                workspace.permissions = permissions;

                                if (getWorkspaceId() == workspaceId) {
                                    $scope.permissions = permissions;
                                }
                            } else {

                                apiService.getPermittedWorkspaces(parentWorkspaceId, function (workspaces) {

                                    var workspace = _.find(workspaces, function (workspace) {
                                        return workspace.id == workspaceId;
                                    });

                                    var item = workspaceToItem(workspace);
                                    insertRootNode(item);
                                });
                            }
                        });
                    } else {
                        searchNode(workspaceId, function (node) {

                            if (node) {
                                var workspace = node.getWorkspace();
                                workspace.permissions = permissions;

                                if (getWorkspaceId() == workspaceId) {
                                    $scope.permissions = permissions;
                                }
                            } else {

                                searchNode(parentWorkspaceId, function (node) {

                                    if (node) {
                                        apiService.getPermittedWorkspaces(parentWorkspaceId, function (workspaces) {
                                            _.forEach(workspaces, function (workspace) {
                                                var item = workspaceToItem(workspace);
                                                node.insert(item);
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    }

                    return "User @{userName} updated you permissions for workspace @{workspaceName}".format({
                        userName: userName,
                        workspaceName: workspaceName
                    });
                });
            };

            $scope.closeAccess = function (userId, workspaceId, parentWorkspaceId) {
                permissionsChangeNotification(userId, workspaceId, function (userName, workspaceName) {

                    searchNode(workspaceId, function (node) {
                        if (node) {

                            node.remove();

                            if (parentWorkspaceId = ROOT_ID) {

                                searchNode($scope.user['defaultWorkspaceId'], function (node) {
                                    if (node) {
                                        updateActiveNode(node);
                                    }
                                });
                            }
                        }
                    });

                    return "User @{userName} closed access for you to workspace @{workspaceName}".format({
                        userName: userName,
                        workspaceName: workspaceName
                    });
                }, 'warning');
            };

            $scope.userJoined = function (userId, callback) {
                apiService.getUser(userId, function (user) {
                    $scope.presentUsers.push(userId);
                    callback(user);
                });
            };

            $scope.userHasLeft = function (userId, callback) {
                apiService.getUser(userId, function (user) {
                    $scope.presentUsers = _.filter($scope.presentUsers, function (value) {
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

            $scope.addedItem = function (userId, item) {
                changeNotification(userId, function (userName) {

                    $scope.todos.push(item);

                    return "User @{userName} added item".format({
                        userName: userName
                    });
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

                    return "User @{userName} updated @{count} item(s)".format({
                        userName: userName,
                        count: items.length
                    });
                });
            };

            $scope.removedItems = function (userId, itemIds) {
                changeNotification(userId, function (userName) {

                    $scope.todos = _.filter($scope.todos, function (todo) {
                        return !_.contains(itemIds, todo.id);
                    });

                    return "User @{userName} removed @{count} item(s)".format({
                        userName: userName,
                        count: itemIds.length
                    });
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

                apiService.save(getWorkspaceId(), item, function (response) {
                    item.id = response.itemId;
                    item.creationDate = response.creationDate;

                    $scope.todos.push(item);
                    $scope.newTodo = '';

                    var socketConnection = $scope.socketConnection;
                    socketConnection.addedItem(item);
                });
            };

            $scope.showItemEditor = function (todo) {
                dialogsService.showItemEditor({
                    item: todo,
                    onUpdate: function (todo, closeCallback) {
                        apiService.update(getWorkspaceId(), [todo], function () {
                            var socketConnection = $scope.socketConnection;
                            socketConnection.updatedItems([todo]);

                            closeCallback();
                        });
                    }
                });
            };

            $scope.removeTodo = function (todo) {
                apiService.remove(getWorkspaceId(), [todo.id], function () {
                    $scope.todos.splice($scope.todos.indexOf(todo), 1);

                    var socketConnection = $scope.socketConnection;
                    socketConnection.removedItems([todo.id]);
                });
            };

            $scope.clearDoneTodos = function () {

                var ids = [];
                _.forEach($scope.todos, function (todo) {
                    if (todo.completed) {
                        ids.push(todo.id);
                    }
                });

                dialogsService.showConfirmation({
                    context: {
                        count: ids.length
                    },
                    title: 'Remove completed items',
                    message: 'Remove <b>{{ count }}</b> completed item(s)?',
                    onAccept: function (closeCallback) {
                        apiService.remove(getWorkspaceId(), ids, function () {
                            $scope.todos = _.filter($scope.todos, function (item) {
                                return !item.completed;
                            });

                            var socketConnection = $scope.socketConnection;
                            socketConnection.removedItems(ids);

                            closeCallback();
                        });
                    }
                });
            };

            $scope.mark = function (todo) {
                apiService.update(getWorkspaceId(), [todo], function () {
                    var socketConnection = $scope.socketConnection;
                    socketConnection.updatedItems([todo]);
                });
            };

            $scope.markAll = function (done) {
                var todos = [];

                _.forEach($scope.todos, function (todo) {
                    if (todo.completed != done) {
                        todos.push({
                            id: todo.id,
                            completed: done,
                            title: todo.title,
                            userId: todo.userId
                        });
                    }
                });

                apiService.update(getWorkspaceId(), todos, function () {
                    _.forEach($scope.todos, function (todo) {
                        todo.completed = done;
                    });

                    var socketConnection = $scope.socketConnection;
                    socketConnection.updatedItems(todos);
                });
            };

            $scope.showWorkspaceManager = function () {
                var workspace = $scope.currentWorkspace;

                dialogsService.showWorkspaceManager({
                    userId: $scope.user['userId'],
                    defaultWorkspaceId: $scope.user['defaultWorkspaceId'],
                    workspace: workspace,
                    onUpdate: function (name, closeCallback) {

                        var workspaceId = getWorkspaceId();
                        var data = {
                            name: name
                        };

                        apiService.updateWorkspace(workspaceId, data, function () {

                            $scope.currentWorkspace['name'] = name;

                            var socketConnection = $scope.socketConnection;
                            socketConnection.updatedWorkspace(workspaceId, data);

                            closeCallback();
                        });
                    },
                    onRemove: function (closeCallback) {

                        var workspaceId = getWorkspaceId();

                        apiService.removeWorkspace(workspaceId, function (removedWorkspaces) {
                            var activeNode = $scope.activeNode;
                            activeNode.remove();

                            var socketConnection = $scope.socketConnection;
                            socketConnection.removedWorkspace(workspaceId, removedWorkspaces);

                            closeCallback();
                        });
                    },
                    onUpdatePermissions: function (collection, closeCallback) {
                        var workspaceId = getWorkspaceId();
                        var parentWorkspaceId = getParentWorkspaceId();

                        apiService.setUsersPermissionsForWorkspace(workspaceId, parentWorkspaceId, collection, function () {
                            var socketConnection = $scope.socketConnection;
                            socketConnection.permissionsChanged(collection, workspaceId, parentWorkspaceId);

                            closeCallback();
                        });
                    }
                });
            };

            $scope.showPresentUsers = function () {
                dialogsService.showPresentUsers({
                    workspaceId: getWorkspaceId(),
                    presentUsers: $scope.presentUsers
                });
            };

            $scope.showWorkspaceCreator = function () {
                dialogsService.showWorkspaceCreator({
                    onCreate: function (workspaceName, switchWorkspace, closeCallback) {
                        apiService.createWorkspace(workspaceName, getWorkspaceId(), function (data) {
                            var workspace = data.workspace;
                            var activeNode = $scope.activeNode;

                            var item = workspaceToItem(workspace);
                            activeNode.insert(item, function (node) {
                                if (switchWorkspace) {
                                    updateActiveNode(node);
                                }
                                closeCallback();
                            });
                        });
                    }
                });

                $scope.workspaceDropdown['isOpen'] = false;
            };

            $scope.showWorkspaceInfo = function () {
                apiService.getUser($scope.currentWorkspace['creatorId'], function (user) {
                    dialogsService.showAlert({
                        context: {
                            name: $scope.currentWorkspace['name'],
                            author: user.displayName,
                            creationDate: $scope.currentWorkspace['creationDate']
                        },
                        title: 'Information',
                        message: "" +
                            "Name" +
                            "<br>" +
                            "<b>{{ name }}</b>" +
                            "<br>" +
                            "<br>" +
                            "Author" +
                            "<br>" +
                            "<b>{{ author }}</b>" +
                            "<br>" +
                            "<br>" +
                            "Creation date" +
                            "<br>" +
                            "<span><b>{{ creationDate | formatDate:'mmmm d, yyyy, h:MM TT' }}</b></span>" +
                            ""
                    });
                });
            };

            $scope.logout = function () {
                userService.logout(function () {
                    $location.path('/logout');
                });
            };

            function searchNode(workspaceId, callback) {
                $rootScope.$broadcast('workspaceTree[home-tree]:search', workspaceId, function (node) {
                    callback(node);
                });
            }

            function insertRootNode(item, callback) {
                $rootScope.$broadcast('workspaceTree[home-tree]:insertRoot', item, function (node) {
                    callback(node);
                });
            }

            function workspaceToItem(workspace) {
                return {
                    id: workspace.id,
                    childrenCount: workspace.childrenCount || 0,
                    children: [],
                    workspace: workspace
                };
            }

            function updateActiveNode(node) {
                if (node) {
                    $scope.activeNode = node;
                    $scope.breadcrumb = getBreadcrumb();
                    $scope.currentWorkspace = node.getWorkspace();
                    node.setActive();
                }
            }

            function getBreadcrumb() {
                var items = [];

                var node = $scope.activeNode;
                if (node) {

                    var activeItem = new BreadcrumbItem(node);
                    items.push(activeItem);

                    node = node.parentNode;
                    while (node) {
                        var item = new BreadcrumbItem(node);
                        items.push(item);
                        node = node.parentNode;
                    }

                    return items.reverse();
                }

                return items;
            }

            function getRootWorkspaceId() {
                var activeNode = $scope.activeNode;
                if (activeNode) {
                    var activeRootNode = activeNode.getRoot();
                    var item = activeRootNode.item;
                    return item.id;
                }
            }

            function getParentWorkspaceId() {
                var activeNode = $scope.activeNode;
                if (activeNode) {
                    var parentNode = activeNode.getParent();
                    if (parentNode) {
                        var item = parentNode.item;
                        return item.id;
                    }
                }
            }

            function getWorkspaceId() {
                if ($scope.currentWorkspace) {
                    return $scope.currentWorkspace['id'];
                }
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

            function permissionsChangeNotification(userId, workspaceId, messageBuilder, type) {
                if (!type) {
                    type = 'info';
                }

                apiService.getUser(userId, function (user) {
                    var userName = user.displayName;

                    apiService.getWorkspace(workspaceId, function (workspace) {
                        var workspaceName = workspace.name;

                        var message = messageBuilder(userName, workspaceName);
                        notificationsService.notify(message, type);
                    });
                });
            }

            function subscribeForSocketEvent() {
                $scope.$on('socketsService:userConnected', function (event, data) {
                    $scope.presentUsers = data['presentUsers'];
                });

                $scope.$on('socketsService:userDisconnected', function (event, data) {
                    $scope.userHasLeft(data['userId'], function (user) {
                        notificationsService.info('User @{userName} disconnected', {
                            userName: user.displayName
                        });
                    });
                });

                $scope.$on('socketsService:changedWorkspace', function (event, data) {
                    if (data['workspaceId'] == getWorkspaceId()) {
                        $scope.userJoined(data['userId'], function (user) {
                            notificationsService.success('User @{userName} joined to workspace', {
                                userName: user.displayName
                            });
                        });
                    } else {
                        $scope.userHasLeft(data['userId'], function (user) {
                            notificationsService.info('User @{userName} has left workspace', {
                                userName: user.displayName
                            });
                        });
                    }
                });

                $scope.$on('socketsService:updatedWorkspace', function (event, data) {

                    var userId = data['userId'];
                    var workspaceId = data['workspaceId'];

                    changeNotification(userId, function (userName) {

                        searchNode(workspaceId, function (node) {
                            if (node) {
                                data = data['data'];
                                var workspace = node.getWorkspace();
                                workspace.name = data['name'];
                                $scope.$apply();
                            }
                        });

                        return "User @{userName} updated workspace".format({
                            userName: userName
                        });
                    });
                });

                $scope.$on('socketsService:removedWorkspace', function (event, data) {
                    searchNode(data['workspaceId'], function (node) {
                        if (node) {
                            node.remove();
                        }
                    });
                });

                $scope.$on('socketsService:addedItem', function (event, data) {
                    $scope.addedItem(data['userId'], data['item']);
                });

                $scope.$on('socketsService:updatedItems', function (event, data) {
                    $scope.updatedItems(data['userId'], data['items']);
                });

                $scope.$on('socketsService:removedItems', function (event, data) {
                    $scope.removedItems(data['userId'], data['itemIds']);
                });

                $scope.$on('socketsService:permissionsChanged', function (event, data) {
                    var userId = data['userId'];
                    var workspaceId = data['workspaceId'];
                    var parentWorkspaceId = data['parentWorkspaceId'];

                    if (data['access']) {
                        var permissions = data['permissions'];
                        $scope.updatePermissions(userId, workspaceId, parentWorkspaceId, permissions);
                    } else {
                        $scope.closeAccess(userId, workspaceId, parentWorkspaceId);
                    }
                });

                $scope.$on('socketsService:updatePresentUsers', function (event, data) {
                    $scope.presentUsers = data['presentUsers'];
                });

                $scope.$on('socketsService:disconnect', function (event, data) {
                    notificationsService.error('You lost connection');
                });
            }
        }
    ]
);
