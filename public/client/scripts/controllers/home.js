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
        'translatorService',
        'SOCKET_URL',
        'DEBUG_MODE',
        'ROOT_ID',

        function ($scope, $rootScope, $location, apiService, socketsService, notificationsService, filterFilter, userService, loaderService, dialogsService, translatorService, SOCKET_URL, DEBUG_MODE, ROOT_ID) {

            var errorsTranslator = translatorService.getSector('home.errors');
            var notificationsTranslator = translatorService.getSector('home.notifications');

            var indexOf = _.indexOf;
            var forEach = _.forEach;
            var findWhere = _.findWhere;
            var filter = _.filter;
            var without = _.without;
            var contains = _.contains;

            var itemPriorityDropdown = {
                isOpen: false
            };
            var workspaceDropdown = {
                isOpen: false
            };
            var queryHistoryDropdown = {
                isOpen: false
            };
            var newTodo = {
                title: '',
                priority: 'none'
            };
            var searchModel = {
                searchQuery: '',
                result: [],
                searchHistory: [],
                caseSensitive: false
            };

            var BreadcrumbItem = (function () {

                function BreadcrumbItem(node) {
                    this.node = node;
                }

                BreadcrumbItem.prototype = {
                    click: function () {
                        var node = this.node;
                        updateActiveNode(node);
                    },
                    getLabel: function () {
                        var node = this.node;
                        return node.getLabel();
                    },
                    isAvailable: function () {
                        var node = this.node;
                        return node.isAvailable();
                    }
                };

                return BreadcrumbItem;
            })();

            function clearSearchQuery() {
                var searchHistory = searchModel.searchHistory;
                var searchQuery = searchModel.searchQuery;
                if (indexOf(searchHistory, searchQuery) == -1) {
                    searchHistory.push(searchQuery);
                }
                searchModel.searchQuery = '';
            }

            function toggleFormMode() {
                if ($scope.formMode == 'view') {
                    $scope.formMode = 'search';
                } else {
                    $scope.formMode = 'view';
                }
            }

            function setFocus() {
                var input = angular.element('#main-input');
                input.focus();
            }

            function setItemPriority(priority) {
                newTodo.priority = priority;
                itemPriorityDropdown.isOpen = false;
                setFocus();
            }

            function showWorkspaceId() {
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
            }

            function onWorkspaceChanged(node) {
                updateActiveNode(node);
                workspaceDropdown.isOpen = false;
            }

            function onWorkspaceLoading(item, callback) {
                var workspace = item.workspace;
                apiService.getPermittedWorkspaces(workspace.id, function (data) {
                    callback(data, function (workspace) {
                        return workspaceToItem(workspace);
                    });
                });
            }

            function setViewMode(viewMode) {
                $scope.currentViewMode = viewMode;
            }

            function provideAccessForWorkspace(userId, workspaceId, parentWorkspaceId, permissions, hierarchy) {
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

                                    var workspace = findWhere(workspaces, {
                                        id: workspaceId
                                    });

                                    var item = workspaceToItem(workspace);
                                    insertRootNode(item);
                                });
                            }
                        });
                    } else {

                        var nextNode = null;
                        var prevWorkspaceId = ROOT_ID;

                        asyncEach(hierarchy, function (id, index, next, interrupt) {

                            if (id != ROOT_ID) {

                                searchNode(id, function (node) {

                                    if (node) {
                                        nextNode = node;
                                        prevWorkspaceId = id;
                                        next();
                                    } else {
                                        apiService.getPermittedWorkspaces(prevWorkspaceId, function (workspaces) {

                                            function updateNode(insert) {

                                                var workspace = findWhere(workspaces, {
                                                    id: id
                                                });

                                                var item = workspaceToItem(workspace);
                                                insert(item, function () {
                                                    interrupt();
                                                });
                                            }

                                            if (nextNode) {
                                                updateNode(function (item, callback) {
                                                    nextNode.insert(item, callback);
                                                });
                                            } else {
                                                updateNode(function (item, callback) {
                                                    insertRootNode(item, callback);
                                                });
                                            }
                                        });
                                    }
                                });
                            } else {
                                next();
                            }
                        }, function () {
                        });
                    }

                    return notificationsTranslator.format('user_updated_permissions', {
                        userName: userName,
                        workspaceName: workspaceName
                    });
                });
            }

            function updateAccessForWorkspace(userId, workspaceId, parentWorkspaceId, permissions) {
                permissionsChangeNotification(userId, workspaceId, function (userName, workspaceName) {

                    searchNode(workspaceId, function (node) {
                        if (node) {
                            var workspace = node.getWorkspace();
                            workspace.permissions = permissions;
                            workspace.isAvailable = true;

                            if (getWorkspaceId() == workspaceId) {
                                $scope.permissions = permissions;
                            }
                        }
                    });

                    return notificationsTranslator.format('user_updated_permissions', {
                        userName: userName,
                        workspaceName: workspaceName
                    });
                });
            }

            function closeAccessForWorkspace(userId, workspaceId, parentWorkspaceId, topLevelWorkspaceId) {
                permissionsChangeNotification(userId, workspaceId, function (userName, workspaceName) {

                    searchNode(topLevelWorkspaceId, function (node) {
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

                    return notificationsTranslator.format('user_closed_access', {
                        userName: userName,
                        workspaceName: workspaceName
                    });

                }, 'warning');
            }

            function userJoined(userId, callback) {
                apiService.getUser(userId, function (user) {
                    $scope.presentUsers.push(userId);
                    callback(user);
                });
            }

            function userHasLeft(userId, callback) {
                apiService.getUser(userId, function (user) {
                    $scope.presentUsers = filter($scope.presentUsers, function (value) {
                        return value != userId;
                    });
                    callback(user);
                });
            }

            function canReadOnly() {
                var permissions = $scope.permissions;
                if (permissions.reader && !permissions.writer) {
                    return true;
                }
                return !permissions.writer;
            }

            function canManageCollection() {
                var permissions = $scope.permissions;
                return permissions.writer;
            }

            function canManageAccess() {
                var permissions = $scope.permissions;
                return permissions.admin;
            }

            function addedItem(userId, item) {
                changeNotification(userId, function (userName) {

                    $scope.todos.push(item);

                    return notificationsTranslator.format('user_added_item', {
                        userName: userName
                    });
                });
            }

            function updatedItems(userId, items) {
                changeNotification(userId, function (userName) {

                    forEach(items, function (item) {

                        var todo = findWhere($scope.todos, {
                            id: item.id
                        });

                        todo.title = item.title;
                        todo.completed = item.completed;
                        todo.priority = item.priority;
                    });

                    return notificationsTranslator.format('user_updated_items', {
                        userName: userName,
                        count: items.length
                    });
                });
            }

            function removedItems(userId, itemIds) {
                changeNotification(userId, function (userName) {

                    $scope.todos = filter($scope.todos, function (todo) {
                        return !contains(itemIds, todo.id);
                    });

                    return notificationsTranslator.format('user_removed_items', {
                        userName: userName,
                        count: itemIds.length
                    });
                });
            }

            function addTodo() {
                var title = newTodo['title'].trim();
                if (!title.length) {
                    return;
                }

                var item = {
                    title: title,
                    completed: false,
                    priority: newTodo.priority
                };

                apiService.save(getWorkspaceId(), item, function (response) {
                    item.id = response.itemId;
                    item.creationDate = response.creationDate;

                    $scope.todos.push(item);
                    newTodo.title = '';
                    newTodo.priority = 'none';

                    var socketConnection = $scope.socketConnection;
                    socketConnection.addedItem(item);

                    setFocus();
                });
            }

            function showItemEditor(todo) {
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
            }

            function removeTodo(todo) {
                apiService.remove(getWorkspaceId(), [todo.id], function () {

                    $scope.todos = without($scope.todos, todo);

                    var socketConnection = $scope.socketConnection;
                    socketConnection.removedItems([todo.id]);
                });
            }

            function clearDoneTodos() {

                var ids = [];
                forEach($scope.todos, function (todo) {
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
                            $scope.todos = filter($scope.todos, function (item) {
                                return !item.completed;
                            });

                            var socketConnection = $scope.socketConnection;
                            socketConnection.removedItems(ids);

                            closeCallback();
                        });
                    }
                });
            }

            function mark(todo) {
                apiService.update(getWorkspaceId(), [
                    {
                        id: todo.id,
                        title: todo.title,
                        completed: todo.completed,
                        priority: todo.priority
                    }
                ], function () {
                    var socketConnection = $scope.socketConnection;
                    socketConnection.updatedItems([todo]);
                });
            }

            function markAll(done) {
                var todos = [];

                forEach($scope.todos, function (todo) {
                    if (todo.completed != done) {
                        todos.push({
                            id: todo.id,
                            title: todo.title,
                            completed: done,
                            priority: todo.priority
                        });
                    }
                });

                apiService.update(getWorkspaceId(), todos, function () {

                    forEach($scope.todos, function (todo) {
                        todo.completed = done;
                    });

                    var socketConnection = $scope.socketConnection;
                    socketConnection.updatedItems(todos);
                });
            }

            function showWorkspaceManager() {
                var workspace = $scope.currentWorkspace;

                dialogsService.showWorkspaceManager({
                    userId: $scope.user['userId'],
                    defaultWorkspaceId: $scope.user['defaultWorkspaceId'],
                    workspace: workspace,
                    onUpdateWorkspace: function (name, closeCallback) {

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
                    onRemoveWorkspace: function (closeCallback) {

                        var workspaceId = getWorkspaceId();

                        apiService.removeWorkspace(workspaceId, function (result) {
                            var activeNode = $scope.activeNode;
                            activeNode.remove();

                            var socketConnection = $scope.socketConnection;
                            socketConnection.removedWorkspace(workspaceId, result);

                            closeCallback();
                        });
                    },
                    onUpdateAccess: function (collection, closeCallback) {
                        var workspaceId = getWorkspaceId();
                        var parentWorkspaceId = getParentWorkspaceId();

                        apiService.setUsersPermissionsForWorkspace(workspaceId, parentWorkspaceId, collection, function (accessResultCollection) {
                            var socketConnection = $scope.socketConnection;
                            socketConnection.permissionsChanged(accessResultCollection, workspaceId, parentWorkspaceId);

                            closeCallback();
                        });
                    }
                });
            }

            function showPresentUsers() {
                dialogsService.showPresentUsers({
                    workspaceId: getWorkspaceId(),
                    presentUsers: $scope.presentUsers
                });
            }

            function showWorkspaceCreator() {
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

                workspaceDropdown.isOpen = false;
            }

            function showWorkspaceInfo() {
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
                            "<span><b>{{ creationDate | formatDate:'mmm d, yyyy, h:MM TT' }}</b></span>" +
                            ""
                    });
                });
            }

            function logout() {
                userService.logout(function () {
                    $location.path('/logout');
                });
            }

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
                    userHasLeft(data['userId'], function (user) {

                        var notification = notificationsTranslator.format('user_disconnected', {
                            userName: user.displayName
                        });
                        notificationsService.info(notification);
                    });
                });

                $scope.$on('socketsService:changedWorkspace', function (event, data) {
                    if (data['workspaceId'] == getWorkspaceId()) {
                        userJoined(data['userId'], function (user) {

                            var notification = notificationsTranslator.format('user_joined', {
                                userName: user.displayName
                            });
                            notificationsService.success(notification);
                        });
                    } else {
                        userHasLeft(data['userId'], function (user) {

                            var notification = notificationsTranslator.format('user_has_left', {
                                userName: user.displayName
                            });
                            notificationsService.info(notification);
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

                        return notificationsTranslator.format('user_updated_workspace', {
                            userName: userName
                        });
                    });
                });

                $scope.$on('socketsService:removedWorkspace', function (event, data) {
                    var topLevelWorkspaceId = data['topLevelWorkspaceId'];
                    searchNode(topLevelWorkspaceId, function (node) {

                        if (node) {

                            var userId = data['userId'];
                            var workspaceName = data['workspaceName'];

                            changeNotification(userId, function (userName) {

                                node.remove();

                                return notificationsTranslator.format('user_removed_workspace', {
                                    userName: userName,
                                    workspaceName: workspaceName
                                });
                            });
                        }
                    });
                });

                $scope.$on('socketsService:addedItem', function (event, data) {
                    addedItem(data['userId'], data['item']);
                });

                $scope.$on('socketsService:updatedItems', function (event, data) {
                    updatedItems(data['userId'], data['items']);
                });

                $scope.$on('socketsService:removedItems', function (event, data) {
                    removedItems(data['userId'], data['itemIds']);
                });

                $scope.$on('socketsService:permissionsChanged', function (event, data) {
                    var userId = data['userId'];
                    var workspaceId = data['workspaceId'];
                    var parentWorkspaceId = data['parentWorkspaceId'];
                    var accessData = data['accessData'];

                    switch (accessData['status']) {
                        case 'access_provided':
                        {
                            var permissions = accessData['permissions'];
                            var hierarchy = accessData['hierarchy'];
                            provideAccessForWorkspace(userId, workspaceId, parentWorkspaceId, permissions, hierarchy);
                            break;
                        }
                        case 'access_updated':
                        {
                            var permissions = accessData['permissions'];
                            updateAccessForWorkspace(userId, workspaceId, parentWorkspaceId, permissions);
                            break
                        }
                        case 'access_closed':
                        {
                            var topLevelWorkspaceId = accessData['topLevelWorkspaceId'];
                            closeAccessForWorkspace(userId, workspaceId, parentWorkspaceId, topLevelWorkspaceId);
                            break;
                        }
                    }
                });

                $scope.$on('socketsService:updatePresentUsers', function (event, data) {
                    $scope.presentUsers = data['presentUsers'];
                });

                $scope.$on('socketsService:disconnect', function (event, data) {
                    var message = notificationsTranslator.translate('you_lost_connection');
                    notificationsService.error(message);
                });
            }

            $scope.formMode = 'view';
            $scope.searchModel = searchModel;
            $scope.treeModel = [];
            $scope.breadcrumb = [];
            $scope.errorMessage = null;
            $scope.currentWorkspace = undefined;
            $scope.loading = true;
            $scope.todos = [];
            $scope.newTodo = newTodo;
            $scope.presentUsers = [];
            $scope.workspaces = [];
            $scope.user = {};
            $scope.itemPriorityDropdown = itemPriorityDropdown;
            $scope.workspaceDropdown = workspaceDropdown;
            $scope.queryHistoryDropdown = queryHistoryDropdown;
            $scope.permissions = {
                reader: false,
                writer: false,
                admin: false
            };
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
            $scope.currentViewMode = findWhere($scope.viewModes, {
                name: 'all'
            });

            $scope.$watch('searchModel.searchQuery', function (searchQuery) {

                if (searchQuery) {

                    var startWith = function (str, prefix) {
                        if (str.length >= prefix.length) {
                            return str.substr(0, prefix.length) == prefix;
                        }
                        return false;
                    };

                    var result = [];
                    var statusFilter = $scope.statusFilter;
                    var caseSensitive = searchModel.caseSensitive;

                    if (!caseSensitive) {
                        searchQuery = searchQuery.toLowerCase();
                    }

                    forEach($scope.todos, function (todo) {
                        var title = todo.title;

                        if (!caseSensitive) {
                            title = title.toLowerCase();
                        }

                        if (statusFilter) {
                            if (statusFilter.completed == todo.completed && startWith(title, searchQuery)) {
                                result.push(todo);
                            }
                        } else {
                            if (startWith(title, searchQuery)) {
                                result.push(todo);
                            }
                        }
                    });

                    searchModel.result = result;
                } else {
                    searchModel.result = [];
                }
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

                    $scope.loading = true;

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

            $scope.clearSearchQuery = clearSearchQuery;
            $scope.toggleFormMode = toggleFormMode;
            $scope.setItemPriority = setItemPriority;
            $scope.showWorkspaceId = showWorkspaceId;
            $scope.onWorkspaceChanged = onWorkspaceChanged;
            $scope.onWorkspaceLoading = onWorkspaceLoading;
            $scope.setViewMode = setViewMode;
            $scope.canReadOnly = canReadOnly;
            $scope.canManageCollection = canManageCollection;
            $scope.canManageAccess = canManageAccess;
            $scope.addedItem = addedItem;
            $scope.updatedItems = updatedItems;
            $scope.removedItems = removedItems;
            $scope.addTodo = addTodo;
            $scope.showItemEditor = showItemEditor;
            $scope.removeTodo = removeTodo;
            $scope.clearDoneTodos = clearDoneTodos;
            $scope.mark = mark;
            $scope.markAll = markAll;
            $scope.showWorkspaceManager = showWorkspaceManager;
            $scope.showPresentUsers = showPresentUsers;
            $scope.showWorkspaceCreator = showWorkspaceCreator;
            $scope.showWorkspaceInfo = showWorkspaceInfo;
            $scope.logout = logout;

            loaderService.showLoader();

            userService.getData({
                success: function (user, externalNotification) {

                    $scope.$on('socketsService:error', function (event, error) {
                        $scope.errorMessage = errorsTranslator.translate('connection_problem_with_socket');
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

                            forEach(workspaces, function (workspace) {
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

                                        var notification = notificationsTranslator.format('greeting', {
                                            userName: user.displayName
                                        });
                                        notificationsService.info(notification);
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

                                                        asyncEach(data.workspaces, function (workspaceId, index, next) {
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
                                                    case 'not_found':
                                                    {
                                                        searchNode(user.defaultWorkspaceId, function (node) {

                                                            var notification = notificationsTranslator.translate('workspace_was_changed');
                                                            notificationsService.warning(notification);

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
        }
    ]
);
