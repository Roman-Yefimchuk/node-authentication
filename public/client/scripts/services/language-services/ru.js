'use strict';

angular.module('application')

    .service('ru-RU', function () {

        return {
            "config": {
            },
            "translations": {
                "index": {
                    "title": "Войдите или Зарегистрируйтесь",
                    "local_login": "Войти локально",
                    "local_signup": "Зарегистрироваться локально",
                    "facebook": "Facebook",
                    "twitter": "Twitter",
                    "google_plus": "Google+"
                },
                "login": {
                    "title": "Войти",
                    "select_workspace": "Выберите рабочее пространство",
                    "email": "E-mail",
                    "email_placeholder": "Введите e-mail",
                    "password": "Пароль",
                    "password_placeholder": "Введите пароль",
                    "btn_login": "Войти",
                    "need_an_account": "Нужен аккуант",
                    "sign_up": "Зарегистрироваться",
                    "or_go": "Или перейти",
                    "home": "домой",
                    "system_empty": "Система пустая"
                },
                "sign_up": {
                    "title": "Регистрация",
                    "name": "Имя",
                    "name_placeholder": "Введите имя",
                    "email": "E-mail",
                    "email_placeholder": "Введите e-mail",
                    "password": "Пароль",
                    "password_placeholder": "Введите пароль",
                    "retype_password": "Повторите пароль",
                    "retype_password_placeholder": "Введите повторенный пароль",
                    "btn_sign_up": "Регистрация",
                    "already_have_an_account": "Уже есть аккаунт",
                    "login": "Войти",
                    "or_go": "Или перейти",
                    "home": "домой"
                },
                "http_client_errors": {
                    "empty_server_response": "Пустой ответ сервера",
                    "not_authenticated": "Не аутентифицирован",
                    "internal_server_error": "Внутренняя ошибка сервера",
                    "unhandled_exception": "Необработанное исключение",
                    "page_not_found": "Страница не найдена",
                    "invalid_password": "Неверный пароль",
                    "io_exception": "IO исключение",
                    "user_not_found": "Пользователь не найден",
                    "email_already_exist": "E-mail уже существует"
                }
            }
        };
    });