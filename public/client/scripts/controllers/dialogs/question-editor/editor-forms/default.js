"use strict";

angular.module('application')

    .controller('DefaultFormController', [

        '$scope',

        function ($scope) {

            $scope.$emit('questionEditor:fetchModel', function (model, originalModel) {

                $scope.model = model;

                if (originalModel.type == 'default') {
                    model.data = originalModel.data;
                } else {
                    model.data = {
                        'yes': 'Так',
                        'no': 'Ні'
                    };
                }
            });
        }
    ]
);
