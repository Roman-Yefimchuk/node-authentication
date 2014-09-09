"use strict";

angular.module('application')

    .constant("NAME_PATTERN", /^(\w+){6}$/)
    .constant("EMAIL_PATTERN", /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/)
    .constant("PASSWORD_PATTERN", /^(\w+){6}$/)

    .constant("DEBUG_MODE", true)
    .constant("SOCKET_URL", 'http://127.0.0.1:8080/');