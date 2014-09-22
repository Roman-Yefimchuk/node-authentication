"use strict";

angular.module('application')

    .constant("NAME_PATTERN", /^(\w+){6}$/)
    .constant("EMAIL_PATTERN", /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)
    .constant("PASSWORD_PATTERN", /^(\w+){6}$/)

    .constant("ROOT_ID", '@root')

    .constant("DEBUG_MODE", true)
    .constant("SOCKET_URL", 'http://127.0.0.1:8080/');