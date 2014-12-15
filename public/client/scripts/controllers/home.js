"use strict";

angular.module('application')

    .controller('HomeController', [

        '$scope',
        '$rootScope',
        '$location',
        '$timeout',
        '$interval',
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

        function ($scope, $rootScope, $location, $timeout, $interval, apiService, socketsService, notificationsService, filterFilter, userService, loaderService, dialogsService, translatorService, SOCKET_URL, DEBUG_MODE, ROOT_ID) {

            var errorsTranslator = translatorService.getSector('home.errors');
            var notificationsTranslator = translatorService.getSector('home.notifications');

            var workspaceDropdown = {
                isOpen: false
            };
            var queryHistoryDropdown = {
                isOpen: false
            };
            var searchOptionsDropdown = {
                isOpen: false
            };
            var lectureModel = {
                title: ''
            };
            var searchModel = {
                searchQuery: '',
                result: [],
                searchHistory: [],
                caseSensitive: false,
                showHighlight: true
            };
            var activeLectures = [];
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

            function search(searchQuery) {
                if (searchQuery) {

                    var startWith = function (str, prefix) {
                        if (str.length >= prefix.length) {
                            return str.substr(0, prefix.length) == prefix;
                        }
                        return false;
                    };

                    var result = [];
                    var caseSensitive = searchModel.caseSensitive;

                    if (!caseSensitive) {
                        searchQuery = searchQuery.toLowerCase();
                    }

                    _.forEach($scope.lectures, function (lecture) {
                        var title = lecture.title;

                        if (!caseSensitive) {
                            title = title.toLowerCase();
                        }

                        if (title.indexOf(searchQuery) != -1) {
                            result.push(lecture);
                        }
                    });

                    searchModel.result = result;
                } else {
                    searchModel.result = [];
                }
            }

            function updateSearchHistory() {
                var searchHistory = searchModel.searchHistory;
                var searchQuery = searchModel.searchQuery;
                if (_.indexOf(searchHistory, searchQuery) == -1) {
                    searchHistory.push(searchQuery);
                }
            }

            function clearSearchQuery() {
                updateSearchHistory();
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

                                    var workspace = _.findWhere(workspaces, {
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

                        AsyncUtils.each(hierarchy, function (id, index, next, interrupt) {

                            if (id != ROOT_ID) {

                                searchNode(id, function (node) {

                                    if (node) {
                                        nextNode = node;
                                        prevWorkspaceId = id;
                                        next();
                                    } else {
                                        apiService.getPermittedWorkspaces(prevWorkspaceId, function (workspaces) {

                                            function updateNode(insert) {

                                                var workspace = _.findWhere(workspaces, {
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
                    $scope.presentUsers = _.filter($scope.presentUsers, function (value) {
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
                return permissions.writer || permissions.admin;
            }

            function canManageAccess() {
                var permissions = $scope.permissions;
                return permissions.admin;
            }

            function canManageLecture(lecture) {
                if (canManageCollection()) {
                    if (lecture.condition['status'] == 'stopped') {
                        return true;
                    }
                    return lecture.condition['lecturerId'] == $scope.user['userId'];
                }
                return false;
            }

            function addedLecture(userId, lecture) {
                changeNotification(userId, function (userName) {

                    $scope.lectures.push(lecture);

                    return notificationsTranslator.format('user_added_lecture', {
                        userName: userName
                    });
                });
            }

            function updatedLecture(userId, lecture) {
                changeNotification(userId, function (userName) {

                    _.findWhere($scope.lectures, {
                        id: lecture.id
                    }).title = lecture.title;

                    return notificationsTranslator.format('user_updated_lecture', {
                        userName: userName
                    });
                });
            }

            function removedLecture(userId, lectureId) {
                changeNotification(userId, function (userName) {

                    $scope.lectures = _.filter($scope.lectures, function (lecture) {
                        return lecture.id != lectureId;
                    });

                    return notificationsTranslator.format('user_removed_lecture', {
                        userName: userName
                    });
                });
            }

            function addLecture() {
                var title = lectureModel['title'].trim();
                if (!title.length) {
                    return;
                }

                var lecture = {
                    title: title,
                    authorId: $scope.user['userId'],
                    workspaceId: getWorkspaceId(),
                    description: '',
                    tags: [],
                    links: [],
                    condition: {
                        status: 'stopped'
                    }
                };

                apiService.createLecture(lecture, function (response) {
                    lecture.id = response.lectureId;
                    lecture.creationDate = response.creationDate;

                    $scope.lectures.push(lecture);
                    lectureModel.title = '';

                    var socketConnection = $scope.socketConnection;
                    socketConnection.addedItem(lecture);

                    setFocus();
                });
            }

            function removeLecture(lecture) {
                apiService.removeLecture(lecture.id, function () {

                    $scope.lectures = _.without($scope.lectures, lecture);

                    var socketConnection = $scope.socketConnection;
                    socketConnection.removedItem(lecture.id);
                });
            }

            function showItemEditor(lecture) {
                dialogsService.showItemEditor({
                    item: lecture,
                    onUpdate: function (lecture, closeCallback) {
                        apiService.updateLecture(lecture.id, lecture, function () {
                            var socketConnection = $scope.socketConnection;
                            socketConnection.updatedItem(lecture);

                            closeCallback();
                        });
                    }
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

            function findActiveLectureById(lectureId) {
                return _.findWhere(activeLectures, {
                    lectureId: lectureId
                });
            }

            function findLectureById(lectureId) {
                return _.findWhere($scope.lectures, {
                    id: lectureId
                });
            }

            function subscribeForSocketEvent() {
                $scope.$on('socketsService:' + SocketCommands.USER_CONNECTED, function (event, data) {
                    $scope.presentUsers = data['presentUsers'];
                });

                $scope.$on('socketsService:' + SocketCommands.USER_DISCONNECTED, function (event, data) {
                    userHasLeft(data['userId'], function (user) {

                        var notification = notificationsTranslator.format('user_disconnected', {
                            userName: user.displayName
                        });
                        notificationsService.info(notification);
                    });
                });

                $scope.$on('socketsService:' + SocketCommands.CHANGED_WORKSPACE, function (event, data) {
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

                $scope.$on('socketsService:' + SocketCommands.UPDATED_WORKSPACE, function (event, data) {

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

                $scope.$on('socketsService:' + SocketCommands.REMOVED_WORKSPACE, function (event, data) {
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

                $scope.$on('socketsService:' + SocketCommands.ADDED_ITEM, function (event, data) {
                    addedLecture(data['userId'], data['item']);
                });

                $scope.$on('socketsService:' + SocketCommands.UPDATED_ITEM, function (event, data) {
                    updatedLecture(data['userId'], data['item']);
                });

                $scope.$on('socketsService:' + SocketCommands.REMOVED_ITEM, function (event, data) {
                    removedLecture(data['userId'], data['itemId']);
                });

                $scope.$on('socketsService:' + SocketCommands.PERMISSIONS_CHANGED, function (event, data) {
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

                $scope.$on('socketsService:' + SocketCommands.UPDATE_PRESENT_USERS, function (event, data) {
                    $scope.presentUsers = data['presentUsers'];
                });

                $scope.$on('socketsService:' + SocketCommands.LECTURE_STARTED, function (event, data) {
                    var lecturerId = data['lecturerId'];
                    var lectureId = data['lectureId'];
                    var lecture = findLectureById(lectureId);
                    lecture.condition = {
                        status: 'started',
                        lecturerId: lecturerId
                    };

                    if (canManageLecture(lecture)) {
                        $location.path("/lectures/lecture-board/" + lectureId);
                    } else {
                        var activeLecture = getActiveLecture(lecture);
                        activeLectures.push(activeLecture);
                        activeLecture.startTimer(function () {
                            var socketConnection = $scope.socketConnection;
                            socketConnection.getLectureDuration(lectureId);
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.LECTURE_RESUMED, function (event, data) {
                    var lectureId = data['lectureId'];
                    var activeLecture = findActiveLectureById(lectureId);
                    if (activeLecture) {
                        var lecture = activeLecture.lecture;
                        lecture.condition['status'] = 'started';
                        activeLecture.startTimer(function () {
                            var socketConnection = $scope.socketConnection;
                            socketConnection.getLectureDuration(lectureId);
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.LECTURE_SUSPENDED, function (event, data) {
                    var lectureId = data['lectureId'];
                    var activeLecture = findActiveLectureById(lectureId);
                    if (activeLecture) {
                        var lecture = activeLecture.lecture;
                        lecture.condition['status'] = 'suspended';
                        activeLecture.stopTimer();
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.LECTURE_STOPPED, function (event, data) {
                    var lectureId = data['lectureId'];
                    var activeLecture = findActiveLectureById(lectureId);
                    if (activeLecture) {

                        var lecture = activeLecture.lecture;
                        lecture.condition = {
                            status: 'stopped'
                        };

                        activeLecture.stopTimer();

                        activeLectures = _.without(activeLectures, activeLecture);
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.UPDATE_LECTURE_DURATION, function (event, data) {
                    var lectureId = data['lectureId'];
                    var activeLecture = findActiveLectureById(lectureId);
                    if (activeLecture) {
                        $timeout(function () {
                            activeLecture.duration = data['duration'];
                        });
                    }
                });

                $scope.$on('socketsService:' + SocketCommands.UPDATE_PRESENT_LISTENERS, function (event, data) {
                    var lectureId = data['lectureId'];
                    var activeLecture = findActiveLectureById(lectureId);
                    if (activeLecture) {
                        $timeout(function () {
                            activeLecture.presentListeners = data['presentListeners'];
                        });
                    }
                });

                $scope.$on('socketsService:disconnect', function () {
                    var message = notificationsTranslator.translate('you_lost_connection');
                    notificationsService.error(message);
                });
            }

            function startLecture(lecture) {
                var socketConnection = $scope.socketConnection;
                socketConnection.startLecture(lecture.id);
            }

            function resumeLecture(lecture) {
                var socketConnection = $scope.socketConnection;
                socketConnection.resumeLecture(lecture.id);
            }

            function suspendLecture(lecture) {
                var socketConnection = $scope.socketConnection;
                socketConnection.suspendLecture(lecture.id);
            }

            function stopLecture(lecture) {
                var socketConnection = $scope.socketConnection;
                socketConnection.stopLecture(lecture.id);
            }

            function getLectureDuration(lecture) {
                var lectureId = lecture.id;
                var activeLecture = findActiveLectureById(lectureId);
                if (activeLecture) {
                    return activeLecture.duration;
                }
                return 0;
            }

            function getPresentListenersCount(lecture) {
                var lectureId = lecture.id;
                var activeLecture = findActiveLectureById(lectureId);
                if (activeLecture) {
                    return activeLecture.presentListeners['length'];
                }
                return 0;
            }

            function showPresentListeners(lecture) {
                var lectureId = lecture.id;
                dialogsService.showPresentListeners({
                    lectureId: lectureId,
                    presentListeners: (function () {
                        var activeLecture = findActiveLectureById(lectureId);
                        if (activeLecture) {
                            return activeLecture.presentListeners;
                        }
                        return [];
                    })()
                });
            }

            function getActiveLecture(lecture) {

                var intervalId = null;

                return {
                    lectureId: lecture.id,
                    lecture: lecture,
                    duration: 0,
                    presentListeners: [],
                    startTimer: function (task) {
                        task();
                        intervalId = $interval(task, 1000, 0, false);
                    },
                    stopTimer: function () {
                        if (intervalId) {
                            $interval.cancel(intervalId);
                            intervalId = null;
                        }
                    }
                }
            }

            $scope.formMode = 'view';
            $scope.searchModel = searchModel;
            $scope.treeModel = [];
            $scope.breadcrumb = [];
            $scope.errorMessage = null;
            $scope.currentWorkspace = undefined;
            $scope.loading = true;
            $scope.lectures = [];
            $scope.lectureModel = lectureModel;
            $scope.presentUsers = [];
            $scope.workspaces = [];
            $scope.user = {};
            $scope.workspaceDropdown = workspaceDropdown;
            $scope.queryHistoryDropdown = queryHistoryDropdown;
            $scope.searchOptionsDropdown = searchOptionsDropdown;
            $scope.permissions = {
                reader: false,
                writer: false,
                admin: false
            };

            $scope.$watch('searchModel.searchQuery', function (searchQuery) {
                search(searchQuery);
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

                        apiService.getLecturesByWorkspaceId(workspaceId, function (lectures) {
                            $scope.lectures = lectures;

                            _.forEach(lectures, function (lecture) {
                                if (lecture.condition['status'] != 'stopped') {
                                    var lectureId = lecture.id;
                                    var activeLecture = getActiveLecture(lecture);
                                    activeLectures.push(activeLecture);
                                    activeLecture.startTimer(function () {
                                        socketConnection.getLectureDuration(lectureId);
                                    });
                                }
                            });

                            $scope.loading = false;
                        });
                    });
                }
            });

            $scope.updateSearchHistory = updateSearchHistory;
            $scope.search = search;
            $scope.clearSearchQuery = clearSearchQuery;
            $scope.toggleFormMode = toggleFormMode;
            $scope.showWorkspaceId = showWorkspaceId;
            $scope.onWorkspaceChanged = onWorkspaceChanged;
            $scope.onWorkspaceLoading = onWorkspaceLoading;
            $scope.canReadOnly = canReadOnly;
            $scope.canManageCollection = canManageCollection;
            $scope.canManageAccess = canManageAccess;
            $scope.addedLecture = addedLecture;
            $scope.updatedLecture = updatedLecture;
            $scope.removedLecture = removedLecture;
            $scope.addLecture = addLecture;
            $scope.removeLecture = removeLecture;
            $scope.showItemEditor = showItemEditor;
            $scope.showWorkspaceManager = showWorkspaceManager;
            $scope.showPresentUsers = showPresentUsers;
            $scope.showWorkspaceCreator = showWorkspaceCreator;
            $scope.showWorkspaceInfo = showWorkspaceInfo;
            $scope.logout = logout;
            $scope.startLecture = startLecture;
            $scope.resumeLecture = resumeLecture;
            $scope.suspendLecture = suspendLecture;
            $scope.stopLecture = stopLecture;
            $scope.getLectureDuration = getLectureDuration;
            $scope.getPresentListenersCount = getPresentListenersCount;
            $scope.showPresentListeners = showPresentListeners;
            $scope.canManageLecture = canManageLecture;

            loaderService.showLoader();

            userService.getData({
                success: function (user, externalNotification) {

                    $scope.$on('socketsService:error', function (event, error) {
                        $scope.errorMessage = errorsTranslator.translate('connection_problem_with_socket');
                        loaderService.hideLoader();
                    });

                    socketsService.openConnection({
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

                                                        AsyncUtils.each(data.workspaces, function (workspaceId, index, next) {
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
