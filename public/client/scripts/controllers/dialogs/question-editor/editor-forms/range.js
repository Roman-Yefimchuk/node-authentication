"use strict";

angular.module('application')

    .controller('RangeFormController', [

        '$scope',

        function ($scope) {

            var model = $scope.model;
            var originalModel = $scope.originalModel;

            if (originalModel.type == 'range') {
                model.data = originalModel.data;
            } else {
                model.data = {
                    minValue: 0,
                    maxValue: 10
                };
            }
        }
    ]
);
