"use strict";

angular.module('application')

    .constant("NAME_PATTERN", /^(\w+){6}$/)

    .constant("EMAIL_PATTERN", /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)

    .constant("PASSWORD_PATTERN", /^(\w+){6}$/)

    .constant("ROOT_ID", '@root')

    .constant("DEBUG_MODE", true)

    .constant("SOCKET_URL", "http://" + window.location['host'])

    .constant("ACTIVITY_COMMANDS", {
        ON_MESSAGE: 'ON_MESSAGE',
        QUESTION_ASKED: 'QUESTION_ASKED',
        LISTENER_JOINED: 'LISTENER_JOINED',
        LISTENER_HAS_LEFT: 'LISTENER_HAS_LEFT',
        LECTURE_STARTED: 'LECTURE_STARTED',
        LECTURE_SUSPENDED: 'LECTURE_SUSPENDED',
        LECTURE_RESUMED: 'LECTURE_RESUMED'
    });