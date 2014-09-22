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

            var defaultCloseCallback = function (closeCallback) {
                closeCallback();
            };

            var onUpdateWorkspace = options.onUpdateWorkspace || defaultCloseCallback;
            var onRemoveWorkspace = options.onRemoveWorkspace || defaultCloseCallback;
            var onUpdateAccess = options.onUpdateAccess || defaultCloseCallback;

            var tabs = [
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

            function setActiveTab(tab) {
                tab.isActive = true;
                $scope.tab = tab;
            }

            function save() {

                switch ($scope.tab['id']) {
                    case 'generic':
                    {

                        var name = $scope.genericModel['workspaceName'];
                        name = name.trim();

                        if (name.length > 0 && name != defaultGenericModel.workspaceName) {
                            onUpdateWorkspace(name, function () {
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
                            onUpdateAccess(collection, function () {
                                $modalInstance.close();
                            });
                        }

                        break;
                    }
                }
            }

            function cancel() {
                $modalInstance.dismiss('cancel');
            }

            function canRemove() {
                return $scope.workspace['id'] != $scope.defaultWorkspaceId;
            }

            function isSaveDisabled() {
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
            }

            function removeWorkspace() {
                dialogsService.showConfirmation({
                    context: {
                        workspaceName: options.workspace['name']
                    },
                    title: 'Remove workspace',
                    message: 'Do you want remove workspace <b>{{ workspaceName }}</b>?',
                    onAccept: function (closeCallback) {
                        onRemoveWorkspace(function () {
                            closeCallback();
                            $modalInstance.close();
                        });
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
            $scope.tabs = tabs;
            $scope.tab = _.find(tabs, function (tab) {
                return tab.isActive;
            });

            $scope.$watch('pagination.pageNumber', function () {
                updatePage();
            });

            $scope.setActiveTab = setActiveTab;
            $scope.save = save;
            $scope.cancel = cancel;
            $scope.canRemove = canRemove;
            $scope.isSaveDisabled = isSaveDisabled;
            $scope.removeWorkspace = removeWorkspace;
        }
    ]
);
