"use strict";

angular.module('application')

    .controller('WorkspaceManagerController', [

        '$scope',
        '$modalInstance',
        'apiService',
        'dialogsService',
        'options',

        function ($scope, $modalInstance, apiService, dialogsService, options) {

            var defaultGenericModel = {
                workspaceName: options.workspace['name']
            };
            var defaultPermissionsModel = {
            };

            var originalCollection = [];
            var pagination = {
                itemsPerPage: 4,
                maxPaginationSize: 5,
                totalItems: 0,
                pageNumber: 1
            };

            var onUpdate = options.onUpdate;
            var onRemove = options.onRemove;
            var onUpdatePermissions = options.onUpdatePermissions;

            function updatePage() {
                apiService.getAllUsersWithPermissions($scope.workspace['id'], {
                    skip: (pagination.pageNumber - 1) * pagination.itemsPerPage,
                    limit: pagination.itemsPerPage
                }, function (result) {
                    pagination.totalItems = result.count;

                    if (result.count > 0) {
                        $scope.users = result.users;
                        originalCollection = angular.copy($scope.users);
                    }
                });
            }

            $scope.genericModel = angular.copy(defaultGenericModel);
            $scope.permissionsModel = angular.copy(defaultPermissionsModel);

            $scope.pagination = pagination;
            $scope.users = [];

            $scope.userId = options.userId;
            $scope.defaultWorkspaceId = options.defaultWorkspaceId;
            $scope.workspace = options.workspace;

            $scope.tabs = [
                {
                    id: 'generic',
                    title: 'Generic',
                    icon: 'fa-folder',
                    template: '/client/views/controllers/dialogs/workspace-manager/tabs/generic-tab-view.html',
                    isActive: true
                },
                {
                    id: 'permissions',
                    title: 'Permissions',
                    icon: 'fa-users',
                    template: '/client/views/controllers/dialogs/workspace-manager/tabs/permissions-tab-view.html',
                    isActive: false
                }
            ];

            $scope.tab = _.find($scope.tabs, function (tab) {
                return tab.isActive;
            });

            $scope.setActiveTab = function (tab) {
                tab.isActive = true;
                $scope.tab = tab;
            };

            $scope.$watch('pagination.pageNumber', function () {
                updatePage();
            });

            $scope.save = function () {

                switch ($scope.tab['id']) {
                    case 'generic':
                    {

                        var name = $scope.genericModel['workspaceName'];
                        name = name.trim();

                        if (name.length > 0 && name != defaultGenericModel.workspaceName) {
                            onUpdate(name, function () {
                                $modalInstance.close();
                            });
                        }

                        break;
                    }
                    case 'permissions':
                    {
                        var collection = [];

                        _.forEach($scope.users, function (user, index) {
                            if (!angular.equals(user.permissions, originalCollection[index].permissions)) {
                                collection.push({
                                    userId: user.id,
                                    permissions: user.permissions
                                });
                            }
                        });

                        if (collection.length > 0) {
                            onUpdatePermissions(collection, function () {
                                $modalInstance.close();
                            });
                        }

                        break;
                    }
                }
            };

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.canRemove = function () {
                return $scope.workspace['id'] != $scope.defaultWorkspaceId;
            };

            $scope.isSaveDisabled = function () {
                switch ($scope.tab['id']) {
                    case 'generic':
                    {

                        var name = $scope.genericModel['workspaceName'];
                        name = name.trim();

                        return name.length == 0 || name == defaultGenericModel.workspaceName;
                    }
                    case 'permissions':
                    {
                        var collection = [];

                        _.forEach($scope.users, function (user, index) {
                            if (!angular.equals(user.permissions, originalCollection[index].permissions)) {
                                collection.push({
                                    userId: user.id,
                                    permissions: user.permissions
                                });
                            }
                        });

                        return collection.length == 0;
                    }
                }
            };

            $scope.removeWorkspace = function () {
                dialogsService.showConfirmation({
                    context: {
                        workspaceName: options.workspace['name']
                    },
                    title: 'Remove workspace',
                    message: 'Do you want remove workspace <b>{{ workspaceName }}</b>?',
                    onAccept: function (closeCallback) {
                        onRemove(function () {
                            closeCallback();
                            $modalInstance.close();
                        });
                    }
                });
            };
        }
    ]
)
;
