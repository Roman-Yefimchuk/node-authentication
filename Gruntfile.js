module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bower_concat: {
            vendor: {
                dest: 'production/temp/js/build/vendor.js',
                mainFiles: {
                    'notifyjs': ['dist/notify-combined.js']
                },
                exclude: [
                    'font-awesome',
                    'bootstrap'
                ]
            }
        },
        concat: {
            scripts: {
                src: [
                    'public/client/scripts/**/*.js'
                ],
                dest: 'production/temp/js/build/main.js'
            },
            styles: {
                src: [
                    'public/client/styles/**/*.css'
                ],
                dest: 'production/temp/styles/build/main.css'
            }
        },
        wrap: {
            main: {
                src: '<%= concat.scripts.dest %>',
                dest: 'production/temp/js/build/main_wrapped.js',
                options: {
                    wrapper: [
                            '(function (undefined, angular, _, String, Array, RegExp) {\n' +
                            '"use strict";\n',
                        '\n})(undefined, angular, _, String, Array, RegExp);'
                    ]
                }
            },
            vendor: {
                src: '<%= bower_concat.vendor.dest %>',
                dest: 'production/temp/js/build/vendor_wrapped.js',
                options: {
                    wrapper: [
                            '(function (undefined, Object, String, Number, Array, RegExp) {\n' +
                            '"use strict";\n',
                        '\n})(undefined, Object, String, Number, Array, RegExp);'
                    ]
                }
            }
        },
        uglify: {
            options: {
                compress: {
                    drop_console: true
                }
            },
            vendor: {
                files: {
                    'production/build/public/client/scripts/vendor.js': '<%= wrap.vendor.dest %>'
                }
            },
            scripts: {
                files: {
                    'production/build/public/client/scripts/main.js': '<%= wrap.main.dest %>'
                }
            },
            server: {
                files: [
                    {
                        expand: true,
                        cwd: 'app',
                        src: '**/*.js',
                        dest: 'production/build/app'
                    },
                    {
                        expand: true,
                        cwd: 'config',
                        src: '**/*.js',
                        dest: 'production/build/config'
                    },
                    {
                        'production/build/server.js': 'server.js'
                    }
                ]
            }
        },
        htmlmin: {
            dist: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: [
                    {
                        expand: true,
                        cwd: 'public/client',
                        src: ['**/*.html'],
                        dest: 'production/build/public/client/'
                    }
                ]
            }
        },
        cssmin: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'production/temp/styles/build/',
                        src: ['*.css', '!*.min.css'],
                        dest: 'production/build/public/client/styles/',
                        ext: '.css'
                    }
                ]
            }
        },
        clean: ["production/temp"]
    });

    grunt.loadNpmTasks('grunt-usemin');
    grunt.loadNpmTasks('grunt-bower-concat');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-wrap');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', [
        'bower_concat',
        'concat',
        'wrap',
        'uglify',
        'htmlmin',
        'cssmin',
        'clean'
    ]);
};