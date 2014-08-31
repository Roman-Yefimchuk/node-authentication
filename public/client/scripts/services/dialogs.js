'use strict';

angular.module('application')

    .service('dialogsService', [

        '$modal',

        function ($modal) {
            return {
                manageWorkspace: function (options) {
                    return $modal.open({
                        templateUrl: '/client/views/controllers/dialogs/workspace-manager-view.html',
                        controller: 'WorkspaceManagerController',
                        /*                        size: 'lg',*/
                        resolve: {
                            options: function () {
                                return options;
                            }
                        }
                    });
                },
                editItem: function (options) {
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
                createWorkspace: function (options) {
                    return $modal.open({
                        templateUrl: '/client/views/controllers/dialogs/workspace-creator-view.html',
                        controller: 'WorkspaceCreatorController',
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