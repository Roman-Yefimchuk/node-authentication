'use strict';

angular.module('application')

    .service('translatorService', [

        '$locale',
        '$rootScope',
        '$log',
        '$cookies',

        function ($locale, $rootScope, $log, $cookies) {

            var languages = {};
            var currentLocaleCode = null;

            if ($cookies.localeCode) {
                currentLocaleCode = $cookies.localeCode;
            } else {
                currentLocaleCode = $locale.id;
                $cookies.localeCode = currentLocaleCode;
            }

            function getLanguage(localeCode) {
                if (localeCode && languages[localeCode]) {
                    return languages[localeCode];
                }
            }

            function getTransformedTranslations(translations) {
                var data = {};

                var stack = [
                    {
                        $key: '',
                        $value: translations
                    }
                ];

                while (stack.length > 0) {
                    var item = stack.pop();

                    var $key = item.$key;
                    var $value = item.$value;

                    _.forEach($value, function (value, key) {

                        if ($key.length > 0) {
                            key = $key + '.' + key;
                        }

                        if (typeof value == 'object') {
                            stack.push({
                                $key: key,
                                $value: value
                            });
                        } else {
                            data[key] = value;
                        }
                    });
                }

                return data;
            }

            return {
                onLocaleChanged: function (scope, handher) {
                    if (scope) {
                        scope.$on('translatorService:onLocaleChanged', function (event, localeCode, localeConfig) {
                            (handher || angular.noop)(localeCode, localeConfig);
                        });
                    }
                },
                addLocale: function (localeCode, localeData) {
                    if (languages[localeCode]) {
                        console.log("Locale '" + localeCode + "' is already added");
                    } else {
                        var translations = getTransformedTranslations(localeData['translations']);

                        languages[localeCode] = {
                            code: localeCode,
                            data: {
                                config: localeData['config'],
                                translations: translations
                            }
                        };
                    }
                },
                setLocale: function (localeCode) {

                    if (currentLocaleCode != localeCode) {
                        var language = getLanguage(localeCode);

                        if (language) {
                            currentLocaleCode = localeCode;
                            $cookies.localeCode = localeCode;

                            $rootScope.$broadcast('translatorService:onLocaleChanged', localeCode, language.config);
                        } else {
                            $log.debug("Locale '" + localeCode + "' not found");
                        }
                    }
                },
                getCurrentLocaleCode: function () {
                    return currentLocaleCode;
                },
                translate: function (key, localeCode) {
                    var language = getLanguage(localeCode || currentLocaleCode);

                    if (language) {
                        var data = language.data;
                        return data.translations[key] || key;
                    }

                    return key;
                },
                format: function (key, context, localeCode) {
                    var serviceContext = this;
                    var text = serviceContext.translate(key, localeCode);
                    return text.format(context);
                },
                getSector: function (sectorKey) {
                    var serviceContext = this;

                    return {
                        translate: function (key, localeCode) {
                            return serviceContext.translate(sectorKey + '.' + key, localeCode);
                        },
                        format: function (key, context, localeCode) {
                            return serviceContext.format(sectorKey + '.' + key, context, localeCode);
                        }
                    }
                }
            };
        }
    ]);