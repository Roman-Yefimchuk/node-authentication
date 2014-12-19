"use strict";

angular.module('application')

    .controller('TaskEditorController', [

        '$scope',
        '$modalInstance',
        'options',

        function ($scope, $modalInstance, options) {

            var onUpdate = options.onUpdate;

            var originalModel = options.model;
            var model = angular.copy(originalModel);

            var taskPriorityDropdown = {
                isOpen: false
            };

            function isSaveDisabled() {
                return angular.equals(originalModel, model);
            }

            function setFocus() {
                var input = angular.element('#editor-input');
                input.focus();
            }

            function setTaskPriority(priority) {
                model.priority = priority;
                taskPriorityDropdown.isOpen = false;
                setFocus();
            }

            function save() {

                if (isSaveDisabled()) {
                    return;
                }

                var title = model['title'].trim();

                if (title.length > 0) {
                    onUpdate(model, function () {
                        $modalInstance.close();
                    });
                }
            }

            function cancel() {
                $modalInstance.dismiss('cancel');
            }

            $scope.model = model;
            $scope.taskPriorityDropdown = taskPriorityDropdown;

            $scope.isSaveDisabled = isSaveDisabled;
            $scope.setTaskPriority = setTaskPriority;
            $scope.save = save;
            $scope.cancel = cancel;
        }
    ]
);
