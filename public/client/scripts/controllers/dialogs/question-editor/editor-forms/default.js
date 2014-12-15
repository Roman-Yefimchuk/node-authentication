"use strict";

angular.module('application')

    .controller('DefaultFormController', [

        '$scope',

        function ($scope) {

            var model = $scope.model;
            var originalModel = $scope.originalModel;

            if (originalModel.type == 'default') {
                model.data = originalModel.data;
            } else {
                model.data = {
                    'yes': 'Так',
                    'no': 'Ні'
                };
            }
        }
    ]
);
