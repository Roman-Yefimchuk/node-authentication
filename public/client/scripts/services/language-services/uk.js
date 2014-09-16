'use strict';

angular.module('application')

    .service('uk-UA', function () {

        return {
            "config": {
            },
            "translations": {
                "languages": {
                    "en-us": "Англійська",
                    "ru": "Російська",
                    "uk": "Українська"
                },
                "index": {
                    "title": "Увійдіть або Зареєструйтеся",
                    "local_login": "Увійти локально",
                    "local_signup": "Зареєструватися локально",
                    "facebook": "Facebook",
                    "twitter": "Twitter",
                    "google_plus": "Google+"
                },
                "login": {
                    "title": "Увійти",
                    "select_workspace": "Виберіть робочий простір",
                    "email": "E-mail",
                    "email_placeholder": "Введіть e-mail",
                    "password": "Пароль",
                    "password_placeholder": "Введіть пароль",
                    "btn_login": "Увійти",
                    "need_an_account": "Потрібен аккаунт?",
                    "sign_up": "Зареєструватися",
                    "or_go": "Або перейти",
                    "home": "додому",
                    "system_empty": "Система порожня"
                },
                "sign_up": {
                    "title": "Реєстрація",
                    "name": "Ім'я",
                    "name_placeholder": "Введіть ім'я",
                    "email": "E-mail",
                    "email_placeholder": "Введіть e-mail",
                    "password": "Пароль",
                    "password_placeholder": "Введіть пароль",
                    "retype_password": "Повторіть пароль",
                    "retype_password_placeholder": "Введіть повторений пароль",
                    "btn_sign_up": "Реєстрація",
                    "already_have_an_account": "Вже є аккаунт?",
                    "login": "Увійти",
                    "or_go": "Або перейти",
                    "home": "додому"
                },
                "http_client_errors": {
                    "empty_server_response": "Порожній відповідь сервера",
                    "not_authenticated": "Не аутентифіковані",
                    "internal_server_error": "Внутрішня помилка сервера",
                    "unhandled_exception": "Необроблювана помилка",
                    "page_not_found": "Сторінку не знайдено",
                    "invalid_password": "Невірний пароль",
                    "io_exception": "IO виняток",
                    "user_not_found": "Користувач не знайдений",
                    "email_already_exist": "E-mail вже існує"
                }
            }
        };
    });