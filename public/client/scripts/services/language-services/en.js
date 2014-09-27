'use strict';

angular.module('application')

    .service('en-US', function () {

        return {
            "config": {
            },
            "translations": {
                "routes": {
                    "index": "Index",
                    "login": "Login",
                    "sign_up": "Sign Up",
                    "home": "Home",
                    "profile": "Profile",
                    "settings": "Settings",
                    "page_not_found": "Page @{page} not found"
                },
                "locales": {
                    "en-us": "English",
                    "ru": "Russian",
                    "uk": "Ukrainian"
                },
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
                    "need_an_account": "Need an account?",
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
                    "already_have_an_account": "Already have an account?",
                    "login": "Login",
                    "or_go": "Or go",
                    "home": "home"
                },
                "home": {
                    "create_workspace": "Create workspace",
                    "settings": "Settings",
                    "edit_profile": "Edit profile",
                    "logout": "Logout",
                    "third_party_users": "Third party users",
                    "own_workspace": "Own workspace",
                    "workspace_info": "Workspace info",
                    "manage_workspace": "Manage workspace",
                    "add_task": "Add task",
                    "no_records": "No records",
                    "select_all": "Select all",
                    "clear_completed": "Clear completed",
                    "all": "All",
                    "active": "Active",
                    "completed": "Completed",
                    "what_needs_to_be_done": "What needs to be done?",
                    "edit": "Edit",
                    "remove": "Remove",
                    "tasks": "Tasks",
                    "search_in_workspace": "Search in workspace",
                    "nothing_found": "Nothing found",
                    "search_history": "Search history",
                    "clear_search_history": "Clear search history",
                    "search_options": "Search options",
                    "clear": "Clear",
                    "errors": {
                        "connection_problem_with_socket": "Connection problem with socket"
                    },
                    "notifications": {
                        "greeting": "Hello, @{userName}!",
                        "workspace_was_changed": "Workspace was changed",
                        "user_updated_workspace": "User @{userName} updated workspace @{workspaceName}",
                        "user_removed_workspace": "User @{userName} removed workspace @{workspaceName}",
                        "user_updated_permissions": "User @{userName} updated your permissions for workspace @{workspaceName}",
                        "user_closed_access": "User @{userName} closed access for you to workspace @{workspaceName}",
                        "user_added_item": "User @{userName} added item",
                        "user_updated_items": "User @{userName} updated @{count} item(s)",
                        "user_removed_items": "User @{userName} removed @{count} item(s)",
                        "user_disconnected": "User @{userName} disconnected",
                        "user_joined": "User @{userName} joined to workspace",
                        "user_has_left": "User @{userName} has left workspace",
                        "you_lost_connection": "You lost connection"
                    },
                    "info_widget": {
                        "feedback": "Feedback",
                        "copyright": "Roman Yefimchuk, iKrok, 2014"
                    },
                    "priority": "Priority",
                    "low_priority": "Low priority",
                    "medium_priority": "Medium priority",
                    "high_priority": "High priority",
                    "without_priority": "Without priority"
                },
                "dialogs": {
                    "alert": {
                        "ok": "Ok"
                    },
                    "confirmation": {
                        "yes": "Yes",
                        "no": "No"
                    },
                    "present_users": {
                        "title": "Here @{usersCount} user(s)",
                        "user_id": "User ID:",
                        "user_name": "User name:",
                        "registered_date": "Registered date:",
                        "ok": "Ok"
                    },
                    "feedback": {
                        "title": "Feedback",
                        "send": "Send",
                        "cancel": "Cancel",
                        "subject": "Subject",
                        "sender_address": "Sender address",
                        "message": "Message",
                        "subject_placeholder": "Enter subject",
                        "sender_address_placeholder": "Enter sender address",
                        "message_placeholder": "Enter message"
                    }
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
                },
                "not_found": {
                    "page_not_found": "Page not found"
                },
                "common": {
                    "loading": "Loading..."
                },
                "date_formatter": {
                    "day_names": [
                        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
                        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
                    ],
                    "month_names": [
                        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
                    ]
                }
            }
        };
    });