'use strict';

angular.module('application')

    .service('dialogsService', [

        '$modal',

        function ($modal) {
            return {
                showWorkspaceManager: function (options) {
                    return $modal.open({
                        templateUrl: '/client/views/controllers/dialogs/workspace-manager-view.html',
                        controller: 'WorkspaceManagerController',
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                },
                showItemEditor: function (options) {
                    return $modal.open({
                        templateUrl: '/client/views/controllers/dialogs/item-editor-view.html',
                        controller: 'ItemEditorController',
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                },
                showWorkspaceCreator: function (options) {
                    return $modal.open({
                        templateUrl: '/client/views/controllers/dialogs/workspace-creator-view.html',
                        controller: 'WorkspaceCreatorController',
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                },
                showPresentUsers: function (options) {
                    return $modal.open({
                        templateUrl: '/client/views/controllers/dialogs/present-users-view.html',
                        controller: 'PresentUsersController',
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                }
            };
        }
    ]
);