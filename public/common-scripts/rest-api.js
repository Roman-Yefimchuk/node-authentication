"use strict";

(function () {

    var rootContext = this;

    var RestApi = {

        //session manager
        IS_AUTHENTICATED: '/is-authenticated',
        GET_USER_DATA: '/get-user-data',
        LOGOUT: '/logout',

        //local authenticate
        SIGN_IN: '/api/authenticate/sign-in',
        SIGN_UP: '/api/authenticate/sign-up',

        //services
        GET_DEFAULT_WORKSPACE_ID: '/api/get-default-workspace-id/:userId',
        GET_WORKSPACE_BY_ID: '/api/get-workspace/:workspaceId',
        GET_USER_BY_ID: '/api/get-user/:userId',
        GET_USERS: '/api/get-users',
        IS_EMAIL_ACTIVE: '/api/users/:userId/is-email-active',
        SET_PERMISSIONS_FOR_WORKSPACE: '/api/set-users-permissions-for-workspace',
        GET_ALL_USERS_WITH_PERMISSIONS: '/api/get-all-users-with-permissions/:workspaceId',
        GET_PERMITTED_WORKSPACES: '/api/get-permitted-workspaces',
        GET_ALL_USERS: '/api/get-all-users',
        GET_ALL_WORKSPACES: '/api/get-all-workspaces',
        GET_WORKSPACES_FOR_USER: '/api/get-workspaces/:userId',
        GET_CURRENT_USER_WORKSPACE: '/api/get-user-workspace',
        SET_CURRENT_USER_WORKSPACE: '/api/set-user-workspace',
        CREATE_WORKSPACE: '/api/create-workspace',
        LOAD_HIERARCHY: '/api/load-hierarchy',
        UPDATE_WORKSPACE: '/api/update-workspace/:workspaceId',
        REMOVE_WORKSPACE: '/api/remove-workspace/:workspaceId',

        FEEDBACK: '/api/feedback',
        ATTACH_EMAIL: '/api/attach-email',
        VERIFY_EMAIL: '/api/verify-email',
        EMAIL_VERIFICATION: '/api/email-verification/:token',

        GET_USER_PROFILE: '/api/users/:userId/profile',
        UPDATE_USER_PROFILE: '/api/users/:userId/profile/update',
        GET_QUICK_TIMESTAMP: '/api/quick-timestamp',
        CHECK_EMAIL_EXISTS: '/api/check-email-exists/:email',

        CREATE_TAG: '/api/tags/create',
        GET_TAG_BY_ID: '/api/tags/:tagId',
        GET_TAGS_BY_ID: '/api/tags/select',
        FIND_TAGS_BY_NAME: '/api/tags/find/:namePart',
        UPDATE_TAG: '/api/tags/:tagId/update',
        REMOVE_TAG: '/api/tags/:tagId/remove',

        CREATE_CATEGORY: '/api/categories/create',
        GET_CATEGORY_BY_ID: '/api/categories/:categoryId',
        GET_CATEGORIES_BY_ID: '/api/categories/select',
        FIND_CATEGORIES_BY_NAME: '/api/categories/find/:namePart',
        UPDATE_CATEGORY: '/api/categories/:categoryId/update',
        REMOVE_CATEGORY: '/api/categories/:categoryId/remove',

        CREATE_LINK: '/api/links/create',
        ATTACH_LINK: '/api/links/:linkId/attach',
        DETACH_LINK: '/api/links/:linkId/detach',
        GET_ATTACHED_LINKS_BY_LECTURE_ID: '/api/links/get-by-lecture-id/:lectureId',
        GET_LINK_BY_ID: '/api/links/:linkId',
        GET_LINKS_BY_ID: '/api/links/select',
        UPDATE_LINK: '/api/links/:linkId/update',
        REMOVE_LINK: '/api/links/:linkId/remove',

        CREATE_LECTURE: '/api/lectures/create',
        UPDATE_LECTURE: '/api/lectures/:lectureId/update',
        REMOVE_LECTURE: '/api/lectures/:lectureId/remove',
        GET_LECTURE_BY_AUTHOR_ID: '/api/lectures/get-by-author-id/:authorId',
        GET_LECTURE_BY_ID: '/api/lectures/get-by-id/:lectureId',
        GET_LECTURE_BY_WORKSPACE_ID: '/api/lectures/get-by-workspace-id/:workspaceId',
        LOAD_LECTURE_STATISTIC: '/api/lectures/:lectureId/statistic',
        UPDATE_LECTURE_STATISTIC: '/api/lectures/:lectureId/statistic/update',
        GET_LECTURE_CONDITION: '/api/lectures/:lectureId/condition',
        GET_ACTIVE_LECTURES: '/api/lectures/active',
        UPDATE_LECTURE_STATUS: '/api/lectures/:lectureId/update-status',

        CREATE_QUESTION: '/api/questions/create',
        UPDATE_QUESTION: '/api/questions/:questionId/update',
        REMOVE_QUESTION: '/api/questions/:questionId/remove',
        GET_QUESTION_BY_LECTURE_ID: '/api/questions/get-by-lecture-id/:lectureId',
        GET_QUESTION_BY_ID: '/api/questions/get-by-id/:questionId',

        CREATE_TASK: '/api/tasks/:workspaceId/create',
        GET_TASKS: '/api/tasks/:workspaceId',
        UPDATE_TASKS: '/api/tasks/update',
        REMOVE_TASKS: '/api/tasks/remove',
        ASSIGN_TASK: '/api/tasks/:taskId:/assign/:userId',
        CANCEL_TASK_ASSIGNMENT: '/api/tasks/:taskId:/assign/cancel'
    };

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = RestApi;
        }
        exports.RestApi = RestApi;
    } else {
        rootContext.RestApi = RestApi;
    }

}.call(this));