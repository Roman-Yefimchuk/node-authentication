'use strict';

angular.module('application')

    .service('translatorService', [

        '$locale',
        '$rootScope',
        '$log',
        '$cookies',
        '$parse',

        function ($locale, $rootScope, $log, $cookies, $parse) {

            var locales = {};
            var currentLocaleCode = null;

            if ($cookies.localeCode) {
                currentLocaleCode = $cookies.localeCode;
            } else {
                currentLocaleCode = $locale.id;
                $cookies.localeCode = currentLocaleCode;
            }

            function getLocale(localeCode) {
                if (localeCode && locales[localeCode]) {
                    return locales[localeCode];
                }
            }

            function makeDictionary(translations) {
                var dictionary = {};

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

                            if (value instanceof Array) {
                                dictionary[key] = value;
                            } else {
                                stack.push({
                                    $key: key,
                                    $value: value
                                });
                            }
                        } else {
                            dictionary[key] = value;
                        }
                    });
                }

                return dictionary;
            }

            function onLocaleChanged(scope, handher) {
                if (scope) {
                    scope.$on('translatorService:onLocaleChanged', function (event, localeCode, localeConfig) {
                        (handher || angular.noop)(localeCode, localeConfig);
                    });
                }
            }

            function addLocale(localeCode, localeData) {
                if (locales[localeCode]) {
                    $log.debug("Locale '" + localeCode + "' is already added");
                } else {
                    locales[localeCode] = {
                        code: localeCode,
                        data: {
                            config: localeData['config'],
                            translations: localeData['translations'],
                            dictionary: (function () {
                                if (localeCode == currentLocaleCode) {
                                    var translations = localeData['translations'];
                                    return makeDictionary(translations);
                                }
                                return null;
                            })()
                        }
                    };
                }
            }

            function setLocale(localeCode) {

                if (currentLocaleCode != localeCode) {
                    var locale = getLocale(localeCode);

                    if (locale) {

                        var currentLocale = getLocale(currentLocaleCode);
                        currentLocale.data['dictionary'] = null;

                        var translations = locale.data['translations'];
                        locale.data['dictionary'] = makeDictionary(translations);

                        currentLocaleCode = localeCode;
                        $cookies.localeCode = localeCode;

                        var config = locale.data['config'];
                        $rootScope.$broadcast('translatorService:onLocaleChanged', localeCode, config);
                    } else {
                        $log.debug("Locale '" + localeCode + "' not found");
                    }
                }
            }

            function getCurrentLocaleCode() {
                return currentLocaleCode;
            }

            function translate(key, localeCode) {
                var language = getLocale(localeCode || currentLocaleCode);

                if (language) {
                    var dictionary = language.data['dictionary'];
                    if (dictionary) {
                        return dictionary[key] || key;
                    }

                    var translations = language.data['translations'];
                    return $parse(key)(translations) || key;
                }

                return key;
            }

            function format(key, context, localeCode) {
                var serviceContext = this;
                var text = serviceContext.translate(key, localeCode);
                return text.format(context);
            }

            function getSector(sectorKey) {
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

            return {
                onLocaleChanged: onLocaleChanged,
                addLocale: addLocale,
                setLocale: setLocale,
                getCurrentLocaleCode: getCurrentLocaleCode,
                translate: translate,
                format: format,
                getSector: getSector
            };
        }
    ]);