"use strict";

angular.module('application')

    .directive('socialNetworks', [

        'loaderService',

        function (loaderService) {
            return {
                templateUrl: '/public/client/views/directives/social-networks-view.html',
                scope: {
                    action: '@'
                },
                controller: ['$scope', function ($scope) {

                    function getUrl(socialNetwork) {
                        switch ($scope.action) {
                            case 'sign-in':
                            {
                                return socialNetwork.signInUrl;
                            }
                            case 'sign-up':
                            {
                                return socialNetwork.signUpUrl;
                            }
                        }
                    }

                    function showLoader() {
                        loaderService.showLoader();
                    }

                    $scope.socialNetworksList = [
                        {
                            title: 'Facebook',
                            icon: 'fa-facebook',
                            signInUrl: '/sign-in/facebook',
                            signUpUrl: '/sign-up/facebook'
                        },
                        {
                            title: 'Google+',
                            icon: 'fa-google-plus',
                            signInUrl: '/sign-in/google',
                            signUpUrl: '/sign-up/google'
                        },
                        {
                            title: 'Twitter',
                            icon: 'fa-twitter',
                            signInUrl: '/sign-in/twitter',
                            signUpUrl: '/sign-up/twitter'
                        },
                        {
                            title: 'Linked In',
                            icon: 'fa-linkedin',
                            signInUrl: '/sign-in/linked-in',
                            signUpUrl: '/sign-up/linked-in'
                        },
                        {
                            title: 'Windows Live',
                            icon: 'fa-windows',
                            signInUrl: '/sign-in/windows-live',
                            signUpUrl: '/sign-up/windows-live'
                        }
                    ];

                    $scope.getUrl = getUrl;
                    $scope.showLoader = showLoader;
                }]
            };
        }
    ]
);