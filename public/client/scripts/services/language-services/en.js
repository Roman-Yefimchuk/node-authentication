'use strict';

angular.module('application')

    .service('en-US', function () {

        return {
            "config": {
            },
            "translations": {
                "index": {
                    "title": "Login or Register",
                    "local_login": "Local login",
                    "local_signup": "Local Signup",
                    "facebook": "Facebook",
                    "twitter": "Twitter",
                    "google_plus": "Google+"
                },
                "login": {
                    "title": "Login",
                    "select_workspace": "Select workspace",
                    "email": "E-mail",
                    "email_placeholder": "Enter e-mail",
                    "password": "Password",
                    "password_placeholder": "Enter password",
                    "btn_login": "Login",
                    "need_an_account": "Need an account",
                    "sign_up": "Sign up",
                    "or_go": "Or go",
                    "home": "home",
                    "system_empty": "System empty"
                },
                "sign_up": {
                    "title": "Sign Up",
                    "name": "Name",
                    "name_placeholder": "Enter name",
                    "email": "E-mail",
                    "email_placeholder": "Enter e-mail",
                    "password": "Password",
                    "password_placeholder": "Enter password",
                    "retype_password": "Retype password",
                    "retype_password_placeholder": "Enter retyped password",
                    "btn_sign_up": "Sign Up",
                    "already_have_an_account": "Already have an account",
                    "login": "Login",
                    "or_go": "Or go",
                    "home": "home"
                },
                "http_client_errors": {
                    "empty_server_response": "Empty server response",
                    "not_authenticated": "Not authenticated",
                    "internal_server_error": "Internal server error",
                    "unhandled_exception": "Unhandled exception",
                    "page_not_found": "Page not found",
                    "invalid_password": "Invalid password",
                    "io_exception": "IO exception",
                    "user_not_found": "User not found",
                    "email_already_exist": "E-mail already exist"
                }
            }
        };
    });