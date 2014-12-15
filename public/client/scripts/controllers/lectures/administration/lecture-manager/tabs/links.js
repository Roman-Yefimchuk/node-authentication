"use strict";

angular.module('application')

    .controller('LinksController', [

        '$scope',
        'apiService',
        'dialogsService',

        function ($scope, apiService, dialogsService) {

            $scope.$on('lectureManager:editorLoaded', function (event, model) {

                var lecture = model['lecture'];
                var user = model['user'];

                function addLink() {
                    dialogsService.showLinkEditor({
                        mode: 'create',
                        title: '',
                        url: '',
                        description: '',
                        onSave: function (model, closeCallback) {
                            closeCallback();
                        }
                    });
                }

                function editLink(link) {
                    dialogsService.showLinkEditor({
                        mode: 'update',
                        title: link.title,
                        url: link.url,
                        description: link.description,
                        onSave: function (model, closeCallback) {
                            closeCallback();
                        }
                    });
                }

                function removeLink(link) {
                }

                $scope.addLink = addLink;
                $scope.editLink = editLink;
                $scope.removeLink = removeLink;
            });
        }
    ]
);
