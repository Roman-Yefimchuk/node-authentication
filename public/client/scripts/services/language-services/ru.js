'use strict';

angular.module('application')

    .service('ru-RU', function () {

        return {
            "config": {
            },
            "translations": {
                "routes": {
                    "index": "Главная",
                    "login": "Авторизация",
                    "sign_up": "Регистрация",
                    "home": "Домашняя",
                    "profile": "Профиль",
                    "settings": "Настройки",
                    "page_not_found": "Страница @{page} не найдена"
                },
                "locales": {
                    "en-us": "Английский",
                    "ru": "Русский",
                    "uk": "Украинский"
                },
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
                    "need_an_account": "Нужен аккуант?",
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
                    "already_have_an_account": "Уже есть аккаунт?",
                    "login": "Войти",
                    "or_go": "Или перейти",
                    "home": "домой"
                },
                "home": {
                    "create_workspace": "Создать рабочее пространство",
                    "settings": "Настройки",
                    "edit_profile": "Редактировать профиль",
                    "logout": "Выход",
                    "third_party_users": "Сторонние пользователи",
                    "own_workspace": "Собственное рабочее пространство",
                    "workspace_info": "Информация о рабочем пространстве",
                    "manage_workspace": "Управление рабочим пространством",
                    "add_task": "Добавить задачу",
                    "no_records": "Нет записей",
                    "select_all": "Выбрать все",
                    "clear_completed": "Очистить завершенные",
                    "all": "Все",
                    "active": "Активные",
                    "completed": "Завершенные",
                    "what_needs_to_be_done": "Что должно быть сделано?",
                    "edit": "Редактировать",
                    "remove": "Удалить",
                    "errors": {
                        "connection_problem_with_socket": "Проблема соединения с сокетом"
                    },
                    "notifications": {
                        "greeting": "Привет, @{userName}!",
                        "workspace_was_changed": "Рабочее пространство было изменено",
                        "user_updated_workspace": "Пользователь @{userName} обновил рабочее пространство @{workspaceName}",
                        "user_removed_workspace": "Пользователь @{userName} удалил рабочее пространство @{workspaceName}",
                        "user_updated_permissions": "Пользователь @{userName} обновил ваши полномочия для рабочего пространства @{workspaceName}",
                        "user_closed_access": "Пользователь @{userName} закрыл доступ для вас к рабочей области @{workspaceName}",
                        "user_added_item": "Пользователь @{userName} добавил запись",
                        "user_updated_items": "Пользователь @{userName} обновил @{count} запись(ей)",
                        "user_removed_items": "Пользователь @{userName} удалил @{count} запись(ей)",
                        "user_disconnected": "Пользователь @{userName} отключился",
                        "user_joined": "Пользователь @{userName} присоединился к рабочему пространству",
                        "user_has_left": "Пользователь @{userName} покинул рабочее пространство",
                        "you_lost_connection": "Вы потеряли связь"
                    },
                    "info_widget": {
                        "feedback": "Обратная связь",
                        "copyright": "Роман Ефимчук, iKrok, 2014"
                    },
                    "priority": "Приоритет",
                    "low_priority": "Низкий приоритет",
                    "medium_priority": "Средний приоритет",
                    "high_priority": "Высокий приоритет",
                    "without_priority": "Без приоритета"
                },
                "dialogs": {
                    "alert": {
                        "ok": "Хорошо"
                    },
                    "confirmation": {
                        "yes": "Да",
                        "no": "Нет"
                    },
                    "present_users": {
                        "title": "Здесь @{usersCount} пользователь(лей)",
                        "user_id": "ID пользователя:",
                        "user_name": "Имя пользователя:",
                        "registered_date": "Дата регистрации:",
                        "ok": "Хорошо"
                    },
                    "feedback": {
                        "title": "Обратная связь",
                        "send": "Отправить",
                        "cancel": "Отменить",
                        "subject": "Тема",
                        "sender_address": "Адрес отправителя",
                        "message": "Сообщение",
                        "subject_placeholder": "Введите тему",
                        "sender_address_placeholder": "Введите адрес отправителя",
                        "message_placeholder": "Введите сообщение"
                    }
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
                },
                "not_found": {
                    "page_not_found": "Страница не найдена"
                },
                "common": {
                    "loading": "Загрузка..."
                },
                "date_formatter": {
                    "day_names": [
                        "Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб",
                        "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "пятница", "Суббота"
                    ],
                    "month_names": [
                        "Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
                        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
                    ]
                }
            }
        };
    });