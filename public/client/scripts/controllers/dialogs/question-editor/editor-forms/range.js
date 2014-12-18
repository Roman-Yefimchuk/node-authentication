"use strict";

angular.module('application')

    .controller('RangeFormController', [

        '$scope',

        function ($scope) {

            $scope.$emit('questionEditor:fetchModel', function (model, originalModel) {

                $scope.model = model;

                if (originalModel.type == 'range') {
                    model.data = originalModel.data;
                } else {
                    model.data = {
                        minValue: 0,
                        maxValue: 10
                    };
                }
            });
        }
    ]
);
