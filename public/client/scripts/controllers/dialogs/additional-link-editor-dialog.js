"use strict";

angular.module('application')

    .controller('AdditionalLinkEditorDialogController', [

        '$scope',
        '$modalInstance',
        'options',

        function ($scope, $modalInstance, options) {

            var onSave = options.onSave || function (model, closeCallback) {
                closeCallback();
            };

            var originalModel = {
                title: options.title,
                url: options.url,
                description: options.description
            };

            var model = angular.copy(originalModel);

            function save() {
                onSave(model, function () {
                    $modalInstance.close();
                });
            }

            function cancel() {
                $modalInstance.close();
            }

            function isSaveDisabled() {
                return angular.equals(originalModel, $scope.model);
            }

            $scope.model = model;
            $scope.mode = options.mode || 'update';

            $scope.save = save;
            $scope.cancel = cancel;
            $scope.isSaveDisabled = isSaveDisabled;
        }
    ]
);
