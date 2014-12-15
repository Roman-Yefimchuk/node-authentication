"use strict";

angular.module('application')

    .service('apiService', [

        'httpClientService',

        function (httpClientService) {

            return {
                feedback: function (feedbackModel, handler) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.FEEDBACK,
                        data: {
                            feedbackModel: feedbackModel
                        }
                    }, handler);
                },
                login: function (data, handler) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.LOGIN,
                        data: data
                    }, handler);
                },
                signUp: function (data, handler) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.SIGN_UP,
                        data: data
                    }, handler);
                },
                getAllWorkspaces: function (parentWorkspaceId, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.GET_ALL_WORKSPACES,
                        data: {
                            parentWorkspaceId: parentWorkspaceId
                        }
                    }, {
                        success: callback
                    });
                },
                setUserWorkspace: function (workspaceId, rootWorkspaceId, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.SET_CURRENT_USER_WORKSPACE,
                        data: {
                            workspaceId: workspaceId,
                            rootWorkspaceId: rootWorkspaceId
                        }
                    }, {
                        success: callback
                    });
                },
                getAllUsers: function (options, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.GET_ALL_USERS,
                        data: {
                            skip: options.skip,
                            limit: options.limit
                        }
                    }, {
                        success: callback
                    });
                },
                getPermittedWorkspaces: function (parentWorkspaceId, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.GET_PERMITTED_WORKSPACES,
                        data: {
                            parentWorkspaceId: parentWorkspaceId
                        }
                    }, {
                        success: callback
                    });
                },
                getAllUsersWithPermissions: function (workspaceId, options, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.GET_ALL_USERS_WITH_PERMISSIONS,
                        data: {
                            skip: options.skip,
                            limit: options.limit
                        },
                        urlParams: {
                            workspaceId: workspaceId
                        }
                    }, {
                        success: callback
                    });
                },
                setUsersPermissionsForWorkspace: function (workspaceId, parentWorkspaceId, collection, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.SET_PERMISSIONS_FOR_WORKSPACE,
                        data: {
                            workspaceId: workspaceId,
                            parentWorkspaceId: parentWorkspaceId,
                            collection: collection
                        }
                    }, {
                        success: callback
                    });
                },
                getUsers: function (ids, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.GET_USERS,
                        data: {
                            ids: ids
                        }
                    }, {
                        success: callback
                    });
                },
                getUser: function (userId, callback) {
                    httpClientService.sendRequest({
                        url: RestApi.GET_USER_BY_ID,
                        urlParams: {
                            userId: userId
                        }
                    }, {
                        success: callback
                    });
                },
                getWorkspace: function (workspaceId, callback) {
                    httpClientService.sendRequest({
                        url: RestApi.GET_WORKSPACE_BY_ID,
                        urlParams: {
                            workspaceId: workspaceId
                        }
                    }, {
                        success: callback
                    });
                },
                getDefaultWorkspaceId: function (userId, callback) {
                    httpClientService.sendRequest({
                        url: RestApi.GET_DEFAULT_WORKSPACE_ID,
                        urlParams: {
                            userId: userId
                        }
                    }, {
                        success: callback
                    });
                },
                createWorkspace: function (workspaceName, parentWorkspaceId, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.CREATE_WORKSPACE,
                        data: {
                            workspaceName: workspaceName,
                            parentWorkspaceId: parentWorkspaceId
                        }
                    }, {
                        success: callback
                    });
                },
                loadHierarchy: function (workspaceId, rootWorkspaceId, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.LOAD_HIERARCHY,
                        data: {
                            workspaceId: workspaceId,
                            rootWorkspaceId: rootWorkspaceId
                        }
                    }, {
                        success: callback
                    });
                },
                updateWorkspace: function (workspaceId, data, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.UPDATE_WORKSPACE,
                        data: {
                            data: data
                        },
                        urlParams: {
                            workspaceId: workspaceId
                        }
                    }, {
                        success: callback
                    });
                },
                removeWorkspace: function (workspaceId, callback) {
                    httpClientService.sendRequest({
                        url: RestApi.REMOVE_WORKSPACE,
                        urlParams: {
                            workspaceId: workspaceId
                        }
                    }, {
                        success: callback
                    });
                },
                createLecture: function (data, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.CREATE_LECTURE,
                        data: data
                    }, {
                        success: callback
                    });
                },
                updateLecture: function (lectureId, data, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.UPDATE_LECTURE,
                        data: data,
                        urlParams: {
                            lectureId: lectureId
                        }
                    }, {
                        success: callback
                    });
                },
                removeLecture: function (lectureId, callback) {
                    httpClientService.sendRequest({
                        url: RestApi.REMOVE_LECTURE,
                        urlParams: {
                            lectureId: lectureId
                        }
                    }, {
                        success: callback
                    });
                },
                getLecturesByAuthorId: function (authorId, callback) {
                    httpClientService.sendRequest({
                        url: RestApi.GET_LECTURE_BY_AUTHOR_ID,
                        urlParams: {
                            authorId: authorId
                        }
                    }, {
                        success: callback
                    });
                },
                getLectureById: function (lectureId, handler) {
                    httpClientService.sendRequest({
                        url: RestApi.GET_LECTURE_BY_ID,
                        urlParams: {
                            lectureId: lectureId
                        }
                    }, handler);
                },
                getLecturesByWorkspaceId: function (workspaceId, callback) {
                    httpClientService.sendRequest({
                        url: RestApi.GET_LECTURE_BY_WORKSPACE_ID,
                        urlParams: {
                            workspaceId: workspaceId
                        }
                    }, {
                        success: callback
                    });
                },
                getLectureStatisticById: function (lectureId, handler) {
                    httpClientService.sendRequest({
                        url: RestApi.LOAD_LECTURE_STATISTIC,
                        urlParams: {
                            lectureId: lectureId
                        }
                    }, handler);
                },
                updateStatisticForLecture: function (lectureId, data, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.UPDATE_LECTURE_STATISTIC,
                        data: data,
                        urlParams: {
                            lectureId: lectureId
                        }
                    }, {
                        success: callback
                    });
                },
                getLectureCondition: function (lectureId, callback) {
                    httpClientService.sendRequest({
                        url: RestApi.GET_LECTURE_CONDITION,
                        urlParams: {
                            lectureId: lectureId
                        }
                    }, {
                        success: callback
                    });
                },
                getActiveLectures: function (callback) {
                    httpClientService.sendRequest({
                        url: RestApi.GET_ACTIVE_LECTURES
                    }, {
                        success: callback
                    });
                },
                updateLectureStatus: function (lectureId, lecturerId, status, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.UPDATE_LECTURE_STATUS,
                        data: {
                            lecturerId: lecturerId,
                            status: status
                        },
                        urlParams: {
                            lectureId: lectureId
                        }
                    }, {
                        success: callback
                    });
                },
                createQuestion: function (lectureId, questionModel, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.CREATE_QUESTION,
                        data: {
                            lectureId: lectureId,
                            questionModel: questionModel
                        }
                    }, {
                        success: callback
                    });
                },
                updateQuestion: function (questionId, questionModel, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.UPDATE_QUESTION,
                        data: {
                            questionModel: questionModel
                        },
                        urlParams: {
                            questionId: questionId
                        }
                    }, {
                        success: callback
                    });
                },
                removeQuestion: function (questionId, callback) {
                    httpClientService.sendRequest({
                        url: RestApi.REMOVE_QUESTION,
                        urlParams: {
                            questionId: questionId
                        }
                    }, {
                        success: callback
                    });
                },
                getQuestionsByLectureId: function (lectureId, handler) {
                    httpClientService.sendRequest({
                        url: RestApi.GET_QUESTION_BY_LECTURE_ID,
                        urlParams: {
                            lectureId: lectureId
                        }
                    }, handler);
                },
                getQuestionById: function (questionId, callback) {
                    httpClientService.sendRequest({
                        url: RestApi.GET_QUESTION_BY_ID,
                        urlParams: {
                            questionId: questionId
                        }
                    }, {
                        success: callback
                    });
                },
                getUserProfile: function (userId, callback) {
                    httpClientService.sendRequest({
                        url: RestApi.GET_USER_PROFILE,
                        urlParams: {
                            userId: userId
                        }
                    }, {
                        success: callback
                    });
                },
                updateUserProfile: function (userId, data, callback) {
                    httpClientService.sendRequest({
                        method: 'POST',
                        url: RestApi.UPDATE_USER_PROFILE,
                        data: {
                            data: data
                        },
                        urlParams: {
                            userId: userId
                        }
                    }, {
                        success: callback
                    });
                },
                getQuickTimestamp: function (callback) {
                    httpClientService.sendRequest({
                        url: RestApi.GET_QUICK_TIMESTAMP
                    }, {
                        success: callback
                    });
                }
            };
        }
    ]
);