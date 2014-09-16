'use strict';

angular.module('application')

    .service('translator', [

        '$locale',
        '$rootScope',
        '$log',

        function ($locale, $rootScope, $log) {

            var languages = {};
            var currentLanguageCode = null;

            if (currentLanguageCode == null) {
                currentLanguageCode = $locale.id;
            }

            function getLanguage(languageCode) {
                if (languageCode && languages[languageCode]) {
                    return languages[languageCode];
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
                addLanguage: function (languageCode, languageData) {
                    if (languages[languageCode]) {
                        console.log("Language '" + languageCode + "' is already added");
                    } else {
                        languages[languageCode] = {
                            code: languageCode,
                            data: {
                                config: languageData['config'],
                                translations: getTransformedTranslations(languageData['translations'])
                            }
                        };
                    }
                },
                setLanguage: function (languageCode) {

                    if (currentLanguageCode != languageCode) {
                        var language = getLanguage(languageCode);

                        if (language) {
                            currentLanguageCode = languageCode;
                            $rootScope.$broadcast('translator:onLanguageChanged', languageCode, language.config);
                        } else {
                            $log.debug("Language '" + languageCode + "' not found");
                        }
                    }
                },
                getCurrentLanguageCode: function () {
                    return currentLanguageCode;
                },
                translate: function (key, languageCode) {


                    var context = this;
                    window.LANG = function (languageCode) {
                        context.setLanguage(languageCode);
                    };

                    var language = getLanguage(languageCode || currentLanguageCode);

                    if (language) {
                        var data = language.data;
                        return data.translations[key] || key;
                    }

                    return key;
                },
                getSector: function (sectorKey) {
                    var serviceContext = this;

                    return {
                        translate: function (key, languageCode) {
                            return serviceContext.translate(sectorKey + '.' + key, languageCode);
                        }
                    }
                }
            };
        }
    ]);