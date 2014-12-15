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
                    'substrateView': '/client/views/controllers/dialogs/question-editor/editor-forms/default/' +
                        'substrate-view.html'
                },
                'single-choice': {
                    'title': 'Вибрати один варіант',
                    'substrateView': '/client/views/controllers/dialogs/question-editor/editor-forms/choice/' +
                        'substrate-view.html'
                },
                'multi-choice': {
                    'title': 'Вибрати декілька варіантів',
                    'substrateView': '/client/views/controllers/dialogs/question-editor/editor-forms/choice/' +
                        'substrate-view.html'
                },
                'range': {
                    'title': 'Вибрати із діапазона значеннь',
                    'substrateView': '/client/views/controllers/dialogs/question-editor/editor-forms/range/' +
                        'substrate-view.html'
                }
            };

            var onSave = options.onSave;
            var questionModel = options.questionModel;

            function save() {
                onSave(questionModel, function () {
                    $modalInstance.close();
                });
            }

            function cancel() {
                $modalInstance.dismiss('cancel');
            }

            $scope.editorForms = editorForms;
            $scope.model = questionModel;
            $scope.originalModel = angular.copy(questionModel);
            $scope.editorTitle = options.editorTitle;

            $scope.save = save;
            $scope.cancel = cancel;
        }
    ]
);
