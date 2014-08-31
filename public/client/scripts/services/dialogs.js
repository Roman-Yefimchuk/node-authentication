'use strict';

angular.module('application')

    .service('dialogsService', [

        '$modal',

        function ($modal) {
            return {
                openWorkspaceManager: function (options) {
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
                openItemEditor: function (options) {
                    return $modal.open({
                        templateUrl: '/client/views/controllers/dialogs/item-editor-view.html',
                        controller: 'ItemEditorController',
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