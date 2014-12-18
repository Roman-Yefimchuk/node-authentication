"use strict";

angular.module('application')

    .controller('QuestionEditorController', [

        '$scope',
        '$modalInstance',
        'options',

        function ($scope, $modalInstance, options) {

            var editorForms = {
                'default': {
                    'title': 'Звичайне запитання',
                    'templateUrl': '/public/client/views/controllers/dialogs/question-editor/editor-forms/default-form-view.html'
                },
                'single-choice': {
                    'title': 'Вибрати один варіант',
                    'templateUrl': '/public/client/views/controllers/dialogs/question-editor/editor-forms/choice-form-view.html'
                },
                'multi-choice': {
                    'title': 'Вибрати декілька варіантів',
                    'templateUrl': '/public/client/views/controllers/dialogs/question-editor/editor-forms/choice-form-view.html'
                },
                'range': {
                    'title': 'Вибрати із діапазона значеннь',
                    'templateUrl': '/public/client/views/controllers/dialogs/question-editor/editor-forms/range-form-view.html'
                }
            };

            var onSave = options.onSave;
            var model = options.model;
            var originalModel = angular.copy(model);

            function save() {
                onSave(model, function () {
                    $modalInstance.close();
                });
            }

            function cancel() {
                $modalInstance.dismiss('cancel');
            }

            $scope.editorForms = editorForms;
            $scope.editorTitle = options.editorTitle;
            $scope.mode = options.mode;
            $scope.model = model;

            $scope.save = save;
            $scope.cancel = cancel;

            $scope.$on('questionEditor:fetchModel', function (event, callback) {

                callback(model, originalModel);

                event.preventDefault();
                event.stopPropagation();
            });
        }
    ]
);
