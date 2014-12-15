"use strict";

angular.module('application')

    .controller('AdditionalLinksController', [

        '$scope',
        'apiService',
        'dialogsService',

        function ($scope, apiService, dialogsService) {

            $scope.$on('lectureManager:editorLoaded', function (event, model) {

                var lecture = model['lecture'];
                var user = model['user'];

                function addAdditionalLink() {
                    dialogsService.showAdditionLinkEditor({
                        mode: 'create',
                        title: '',
                        url: '',
                        description: '',
                        onSave: function (model, closeCallback) {
                            closeCallback();
                        }
                    });
                }

                function editAdditionalLink(link) {
                    dialogsService.showAdditionLinkEditor({
                        mode: 'update',
                        title: link.title,
                        url: link.url,
                        description: link.description,
                        onSave: function (model, closeCallback) {
                            closeCallback();
                        }
                    });
                }

                function removeAdditionalLink(link) {
                }

                $scope.addAdditionalLink = addAdditionalLink;
                $scope.editAdditionalLink = editAdditionalLink;
                $scope.removeAdditionalLink = removeAdditionalLink;
            });
        }
    ]
);
