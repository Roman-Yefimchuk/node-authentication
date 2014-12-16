"use strict";

angular.module('application')

    .controller('LinksController', [

        '$scope',
        'apiService',
        'dialogsService',

        function ($scope, apiService, dialogsService) {

            $scope.$emit('lectureManager:fetchManagerModel', function (model) {

                var lecture = model['lecture'];
                var user = model['user'];

                function addLink() {
                    dialogsService.showLinkEditor({
                        mode: 'create',
                        title: '',
                        url: '',
                        description: '',
                        onSave: function (model, closeCallback) {
                            apiService.createLink({
                                title: model.title,
                                authorId: user.userId,
                                url: model.url,
                                description: model.description
                            }, function (linkId) {
                                apiService.attachLink(linkId, lecture.id, function () {

                                    var links = $scope.links;
                                    links.push({
                                        id: linkId,
                                        title: model.title,
                                        authorId: user.userId,
                                        url: model.url,
                                        description: model.description
                                    });

                                    closeCallback();
                                });
                            });
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
                            apiService.updateLink(link.id, model, function () {

                                link.title = model.title;
                                link.url = model.url;
                                link.description = model.description;

                                closeCallback();
                            });
                        }
                    });
                }

                function removeLink(link) {
                    apiService.removeLink(link.id, function () {
                        $scope.links = _.without($scope.links, link);
                    });
                }

                $scope.links = lecture.links;

                $scope.addLink = addLink;
                $scope.editLink = editLink;
                $scope.removeLink = removeLink;
            });
        }
    ]
);
