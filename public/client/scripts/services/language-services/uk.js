'use strict';

angular.module('application')

    .service('uk-UA', function () {

        return {
            "config": {
            },
            "translations": {
                "routes": {
                    "index": "Головна",
                    "login": "Авторизація",
                    "sign_up": "Регістрація",
                    "home": "Домашня",
                    "profile": "Профіль",
                    "settings": "Налаштування",
                    "page_not_found": "Сторінка @{page} не знайдена"
                },
                "locales": {
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
                "home": {
                    "create_workspace": "Створити робочий простір",
                    "settings": "Налаштування",
                    "edit_profile": "Редагувати профіль",
                    "logout": "Вихід",
                    "third_party_users": "Сторонні користувачі",
                    "own_workspace": "Власний робочий простір",
                    "workspace_info": "Інформація про робочий простір",
                    "manage_workspace": "Управління робочим простором",
                    "add_task": "Додати задачу",
                    "no_records": "Немає записів",
                    "select_all": "Вибрати все",
                    "clear_completed": "Очистити виконані",
                    "all": "Всі",
                    "active": "Активні",
                    "completed": "Виконані",
                    "what_needs_to_be_done": "Що потрібно зробити?",
                    "edit": "Редагувати",
                    "remove": "Видалити",
                    "errors": {
                        "connection_problem_with_socket": "Проблема з'єднання з сокетом"
                    },
                    "notifications": {
                        "greeting": "Привіт, @{userName}!",
                        "workspace_was_changed": "Робочий простір було змінено",
                        "user_updated_workspace": "Користувач @{userName} оновив робочий простір",
                        "user_updated_permissions": "Користувач @{userName} оновив ваші повноваження для робочого простору @{workspaceName}",
                        "user_closed_access": "Користувач @{userName} закрив вам доступ для робочого простору @{workspaceName}",
                        "user_added_item": "Користувач @{userName} додав запис",
                        "user_updated_items": "Користувач @{userName} оновив @{count} запис(ів)",
                        "user_removed_items": "Користувач @{userName} видалив @{count} запис(ів)",
                        "user_disconnected": "Користувач @{userName} відключився",
                        "user_joined": "Користувач @{userName} приєднався до робочої області",
                        "user_has_left": "Користувач @{userName} покинув робочий простір",
                        "you_lost_connection": "Ви втратили зв'язок"
                    },
                    "info_widget": {
                        "feedback": "Зворотній зв'язок",
                        "copyright": "Роман Єфімчук, iKrok, 2014"
                    }
                },
                "dialogs": {
                    "alert": {
                        "ok": "Добре"
                    },
                    "confirmation": {
                        "yes": "Так",
                        "no": "Ні"
                    },
                    "present_users": {
                        "title": "Тут @{usersCount} користувач(ів)",
                        "user_id": "ID користувача:",
                        "user_name": "Ім'я користувача:",
                        "registered_date": "Дата реєстрації:",
                        "ok": "Добре"
                    },
                    "feedback": {
                        "title": "Зворотній зв'язок",
                        "send": "Відправити",
                        "cancel": "Скасувати",
                        "subject": "Тема",
                        "sender_address": "Адреса відправника",
                        "message": "Повідомлення",
                        "subject_placeholder": "Введіть тема",
                        "sender_address_placeholder": "Введіть адресу відправника",
                        "message_placeholder": "Введіть повідомлення"
                    }
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
                },
                "not_found": {
                    "page_not_found": "Сторінка не знайдена"
                },
                "common": {
                    "loading": "Завантаження..."
                }
            }
        };
    });