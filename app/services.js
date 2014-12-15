"use strict";

module.exports = function (app, dbProvider, serviceProvider) {

    var _ = require('underscore');

    var Exception = require('../app/exception');
    var emailSender = require('../app/email-sender');
    var RestApi = require('../public/common-scripts/rest-api');

    function checkAuthenticated(request) {
        if (!request.user) {
            throw new Exception(Exception.NOT_AUTHENTICATED, 'You are not authenticated');
        }
    }

    function getParam(paramName, request) {
        var params = request.params;
        return params[paramName];
    }

    function getUserId(request) {
        var userAccount = request.user;
        if (userAccount && userAccount.isAuthenticated()) {
            return userAccount.userId;
        } else {
            throw new Exception(Exception.NOT_AUTHENTICATED, 'You are not authenticated');
        }
    }

    serviceProvider.get(RestApi.GET_DEFAULT_WORKSPACE_ID, function (request, response, resultCallback) {
        var userId = getParam('userId', request);
        dbProvider.getDefaultWorkspaceId(userId, function (workspaceId) {
            resultCallback({
                message: 'Selected default workspace[' + workspaceId + ']',
                data: {
                    workspaceId: workspaceId
                }
            });
        });
    });

    serviceProvider.get(RestApi.GET_WORKSPACE_BY_ID, function (request, response, resultCallback) {
        var workspaceId = getParam('workspaceId', request);
        dbProvider.getWorkspace(workspaceId, function (workspace) {
            resultCallback({
                message: 'Selected workspace: ' + workspace.name,
                data: workspace
            });
        });
    });

    serviceProvider.get(RestApi.GET_USER_BY_ID, function (request, response, resultCallback) {
        var userId = getParam('userId', request);
        dbProvider.getUser(userId, function (user) {
            resultCallback({
                message: 'Selected user: ' + user.displayName,
                data: user
            });
        });
    });

    serviceProvider.post(RestApi.GET_USERS, function (request, response, resultCallback) {
        var userId = getUserId(request);
        var ids = request.body['ids'];
        dbProvider.getUsers(ids, function (users) {
            resultCallback({
                message: 'Selected ' + users.length + ' user(s)',
                data: users
            });
        });
    });

    serviceProvider.post(RestApi.SET_PERMISSIONS_FOR_WORKSPACE, function (request, response, resultCallback) {
        var userId = getUserId(request);

        var workspaceId = request.body['workspaceId'];
        var parentWorkspaceId = request.body['parentWorkspaceId'];
        var collection = request.body['collection'];

        dbProvider.setUsersPermissionsForWorkspace(workspaceId, parentWorkspaceId, collection, function (accessResultCollection) {
            resultCallback({
                message: 'Updated ' + collection.length + ' permission(s)',
                data: accessResultCollection
            });
        });
    });

    serviceProvider.post(RestApi.GET_ALL_USERS_WITH_PERMISSIONS, function (request, response, resultCallback) {
        var userId = getUserId(request);
        var workspaceId = getParam('workspaceId', request);

        var skip = request.body['skip'];
        var limit = request.body['limit'];

        dbProvider.getAllUsersWithPermissions(workspaceId, skip, limit, function (result) {
            resultCallback({
                message: 'Selected ' + result.count + ' user(s)',
                data: result
            });
        });
    });

    serviceProvider.post(RestApi.GET_PERMITTED_WORKSPACES, function (request, response, resultCallback) {

        var userId = getUserId(request);
        var parentWorkspaceId = request.body['parentWorkspaceId'];

        dbProvider.getPermittedWorkspaces(userId, parentWorkspaceId, function (workspaces) {
            resultCallback({
                message: 'Selected ' + workspaces.length + ' permitted workspaces(s)',
                data: workspaces
            });
        });
    });

    serviceProvider.post(RestApi.GET_ALL_USERS, function (request, response, resultCallback) {

        var skip = request.body['skip'];
        var limit = request.body['limit'];

        dbProvider.getAllUsers(skip, limit, function (result) {
            resultCallback({
                message: 'Selected ' + result.count + ' users(s)',
                data: result
            });
        });
    });

    serviceProvider.post(RestApi.GET_ALL_WORKSPACES, function (request, response, resultCallback) {
        var parentWorkspaceId = request.body['parentWorkspaceId'];
        dbProvider.getAllWorkspaces(parentWorkspaceId, function (workspaces) {
            resultCallback({
                message: 'Selected ' + workspaces.length + ' workspace(s)',
                data: workspaces
            });
        });
    });

    serviceProvider.get(RestApi.GET_WORKSPACES_FOR_USER, function (request, response, resultCallback) {
        var userId = getParam('userId', request);
        dbProvider.getWorkspaces(userId, function (workspaces) {
            resultCallback({
                message: 'Selected ' + workspaces.length + ' workspace(s)',
                data: workspaces
            });
        });
    });

    serviceProvider.get(RestApi.GET_CURRENT_USER_WORKSPACE, function (request, response, resultCallback) {
        var userId = getUserId(request);
        dbProvider.getUserWorkspaceId(userId, function (workspaceId, rootWorkspaceId) {
            resultCallback({
                message: 'Current user workspace ID: ' + workspaceId,
                data: {
                    workspaceId: workspaceId,
                    rootWorkspaceId: rootWorkspaceId
                }
            });
        });
    });

    serviceProvider.post(RestApi.SET_CURRENT_USER_WORKSPACE, function (request, response, resultCallback) {
        var userId = getUserId(request);

        var workspaceId = request.body['workspaceId'];
        var rootWorkspaceId = request.body['rootWorkspaceId'];

        dbProvider.setUserWorkspaceId(userId, workspaceId, rootWorkspaceId, function (permissions, isOwnWorkspace) {
            resultCallback({
                message: 'New workspace ID: ' + workspaceId,
                data: {
                    permissions: permissions,
                    isOwnWorkspace: isOwnWorkspace
                }
            });
        });
    });

    serviceProvider.post(RestApi.CREATE_WORKSPACE, function (request, response, resultCallback) {
        var userId = getUserId(request);
        var workspaceName = request.body['workspaceName'];
        var parentWorkspaceId = request.body['parentWorkspaceId'];
        dbProvider.createWorkspace(workspaceName, userId, parentWorkspaceId, function (workspace) {
            resultCallback({
                message: 'Created new workspace: ' + workspace.name,
                data: {
                    workspace: workspace
                }
            });
        });
    });

    serviceProvider.post(RestApi.LOAD_HIERARCHY, function (request, response, resultCallback) {
        var userId = getUserId(request);

        var workspaceId = request.body['workspaceId'];
        var rootWorkspaceId = request.body['rootWorkspaceId'];

        dbProvider.loadHierarchy(userId, workspaceId, rootWorkspaceId, function (status, result) {
            resultCallback({
                data: {
                    status: status,
                    workspaces: status == 'success' ? result : []
                }
            });
        });
    });

    serviceProvider.post(RestApi.UPDATE_WORKSPACE, function (request, response, resultCallback) {
        var userId = getUserId(request);

        var workspaceId = getParam('workspaceId', request);
        var data = request.body['data'];
        dbProvider.updateWorkspace(workspaceId, data, function () {
            resultCallback();
        });
    });

    serviceProvider.get(RestApi.REMOVE_WORKSPACE, function (request, response, resultCallback) {
        var userId = getUserId(request);

        var workspaceId = getParam('workspaceId', request);
        dbProvider.removeWorkspace(userId, workspaceId, function (result) {
            resultCallback({
                message: 'Workspace ' + result.workspaceName + ' removed',
                data: result
            });
        });
    });

    serviceProvider.post(RestApi.FEEDBACK, function (request, response, resultCallback) {
        var feedbackModel = request.body['feedbackModel'];

        var subject = feedbackModel.subject;
        var senderAddress = feedbackModel.senderAddress;
        var message = feedbackModel.message;

        emailSender.sendEmail(subject, senderAddress, message, function (error, response) {
            resultCallback('OK');
        });
    });

    serviceProvider.post(RestApi.CREATE_LECTURE, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var data = request.body;

        dbProvider.createLecture(data, function (lecture) {
            resultCallback({
                data: lecture
            });
        });
    });

    serviceProvider.post(RestApi.UPDATE_LECTURE, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var lectureId = request.params['lectureId'];
        var lectureData = request.body;

        dbProvider.updateLecture(lectureId, lectureData, function () {
            resultCallback();
        });
    });

    serviceProvider.get(RestApi.REMOVE_LECTURE, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var lectureId = request.params['lectureId'];

        dbProvider.removeLecture(lectureId, function () {
            resultCallback();
        });
    });

    serviceProvider.get(RestApi.GET_LECTURE_BY_AUTHOR_ID, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var authorId = request.params['authorId'];

        dbProvider.getLecturesByAuthorId(authorId, function (lectures) {
            resultCallback({
                data: lectures
            });
        });
    });

    serviceProvider.get(RestApi.GET_LECTURE_BY_ID, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var lectureId = request.params['lectureId'];

        dbProvider.getLectureById(lectureId, function (lecture) {
            resultCallback({
                data: lecture
            });
        });
    });

    serviceProvider.get(RestApi.GET_LECTURE_BY_WORKSPACE_ID, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var workspaceId = request.params['workspaceId'];

        dbProvider.getLecturesByWorkspaceId(workspaceId, function (lectures) {
            resultCallback({
                data: lectures
            });
        });
    });

    serviceProvider.get(RestApi.LOAD_LECTURE_STATISTIC, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var lectureId = request.params['lectureId'];

        dbProvider.loadStatisticForLecture(lectureId, function (data) {
            resultCallback({
                data: data
            });
        });
    });

    serviceProvider.post(RestApi.UPDATE_LECTURE_STATISTIC, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var lectureId = request.params['lectureId'];
        var data = request.body;

        dbProvider.updateStatisticForLecture(lectureId, data, function () {
            resultCallback();
        });
    });

    serviceProvider.get(RestApi.GET_LECTURE_CONDITION, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var lectureId = request.params['lectureId'];

        dbProvider.getLectureCondition(lectureId, function (condition) {
            resultCallback({
                data: condition
            });
        });
    });

    serviceProvider.get(RestApi.GET_ACTIVE_LECTURES, function (request, response, resultCallback) {

        checkAuthenticated(request);

        dbProvider.getActiveLectures(function (activeLectures) {
            resultCallback({
                data: activeLectures
            });
        });
    });

    serviceProvider.post(RestApi.UPDATE_LECTURE_STATUS, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var lectureId = request.params['lectureId'];
        var status = request.body['status'];
        var lecturerId = request.body['lecturerId'];

        dbProvider.updateLectureStatus(lectureId, lecturerId, status, function () {
            resultCallback();
        });
    });

    serviceProvider.post(RestApi.CREATE_QUESTION, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var lectureId = request.body['lectureId'];
        var questionModel = request.body['questionModel'];

        dbProvider.createQuestion(lectureId, questionModel, function (questionId) {
            resultCallback({
                data: {
                    questionId: questionId
                }
            });
        });
    });

    serviceProvider.post(RestApi.UPDATE_QUESTION, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var questionId = request.params['questionId'];
        var questionModel = request.body['questionModel'];

        dbProvider.updateQuestion(questionId, questionModel, function () {
            resultCallback();
        });
    });

    serviceProvider.get(RestApi.REMOVE_QUESTION, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var questionId = request.params['questionId'];

        dbProvider.removeQuestion(questionId, function () {
            resultCallback();
        });
    });

    serviceProvider.get(RestApi.GET_QUESTION_BY_LECTURE_ID, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var lectureId = request.params['lectureId'];

        dbProvider.getQuestionsByLectureId(lectureId, function (questions) {
            resultCallback({
                data: {
                    questions: questions
                }
            });
        });
    });

    serviceProvider.get(RestApi.GET_QUESTION_BY_ID, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var questionId = request.params['questionId'];

        dbProvider.getQuestionById(questionId, function (question) {
            resultCallback({
                data: {
                    question: question
                }
            });
        });
    });

    serviceProvider.get(RestApi.GET_USER_PROFILE, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var userId = request.params['userId'];

        dbProvider.getUserProfile(userId, function (userProfile) {
            resultCallback({
                data: userProfile
            });
        });
    });

    serviceProvider.post(RestApi.UPDATE_USER_PROFILE, function (request, response, resultCallback) {

        checkAuthenticated(request);

        var userId = request.params['userId'];
        var data = request.body['data'];

        dbProvider.updateUserProfile(userId, data, function () {
            resultCallback();
        });
    });

    serviceProvider.get(RestApi.GET_QUICK_TIMESTAMP, function (request, response, resultCallback) {
        resultCallback({
            data: {
                timestamp: _.now()
            }
        });
    });
};