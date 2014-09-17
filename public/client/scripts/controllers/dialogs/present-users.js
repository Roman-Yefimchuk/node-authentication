"use strict";

angular.module('application')

    .controller('PresentUsersController', [

        '$scope',
        '$modalInstance',
        '$log',
        'translatorService',
        'apiService',
        'options',

        function ($scope, $modalInstance, $log, translatorService, apiService, options) {

            var presentUsersTranslator = translatorService.getSector('dialogs.present_users');

            var presentUsers = angular.copy(options['presentUsers']);
            var workspaceId = options.workspaceId;
            var visibleUsers = [];
            var pagination = {
                itemsPerPage: 5,
                maxPaginationSize: 5,
                totalItems: presentUsers.length,
                pageNumber: 1
            };

            function updateDialogTitle() {
                $scope.dialogTitle = presentUsersTranslator.format('title', {
                    usersCount: presentUsers.length
                });
            }

            function updatePage() {
                pagination.totalItems = presentUsers.length;
                if (presentUsers.length > 0) {
                    var users = getUsersForPage();
                    if (!angular.equals(users, visibleUsers)) {
                        visibleUsers = angular.copy(users);
                        apiService.getUsers(visibleUsers, function (users) {
                            $scope.presentUsers = users;
                        });
                    }
                } else {
                    $scope.presentUsers = [];
                    visibleUsers = [];
                }
            }

            function getUsersForPage() {
                var users = [];

                if (pagination.totalItems > pagination.itemsPerPage) {

                    var fromIndex = (pagination.pageNumber - 1) * pagination.itemsPerPage;
                    for (var index = 0; (index + fromIndex < presentUsers.length) && (index < pagination.itemsPerPage); index++) {
                        users.push(presentUsers[index + fromIndex]);
                    }
                } else {
                    users = presentUsers;
                }

                return users;
            }

            function addUser(userId) {
                if (_.indexOf(presentUsers, userId) == -1) {
                    presentUsers.push(userId);
                    updatePage();
                    updateDialogTitle();
                } else {
                    $log.debug('User [@{userId}] already in this workspace'.format({
                        userId: userId
                    }));
                }
            }

            function removeUser(userId) {
                if (_.indexOf(presentUsers, userId) == -1) {
                    $log.debug('User [@{userId}] not found in this workspace'.format({
                        userId: userId
                    }));
                } else {

                    presentUsers = _.without(presentUsers, userId);

                    var pagesCount = Math.ceil(presentUsers.length / pagination.itemsPerPage);
                    if (pagination.pageNumber > pagesCount) {
                        pagination.pageNumber--;
                    } else {
                        updatePage();
                    }

                    updateDialogTitle();
                }
            }

            updateDialogTitle();

            $scope.pagination = pagination;
            $scope.usersForPage = [];

            $scope.$watch('pagination.pageNumber', function () {
                updatePage();
            });

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.$on('socketsService:userDisconnected', function (event, data) {
                var userId = data['userId'];
                removeUser(userId);
            });

            $scope.$on('socketsService:changedWorkspace', function (event, data) {
                var userId = data['userId'];
                if (data['workspaceId'] == workspaceId) {
                    addUser(userId);
                } else {
                    removeUser(userId);
                }
            });
        }
    ]
);
