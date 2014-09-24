module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bower_concat: {
            libs: {
                dest: 'production/temp/js/build/libs.js',
                exclude: [
                    'font-awesome'
                ]
            }
        },
        concat: {
            scripts: {
                src: [
                    'public/client/scripts/**/*.js'
                ],
                dest: 'production/temp/js/build/scripts.js'
            },
            styles: {
                src: [
                    'public/client/styles/**/*.css'
                ],
                dest: 'production/temp/styles/build/styles.css'
            }
        },
        wrap: {
            scripts: {
                src: '<%= concat.scripts.dest %>',
                dest: 'production/temp/js/build/scripts_wrapped.js',
                options: {
                    wrapper: [
                            '(function (undefined, angular, _, String, Array, RegExp) {' +
                            '"use strict";\n',
                        '\n})(undefined, angular, _, String, Array, RegExp);'
                    ]
                }
            },
            libs: {
                src: '<%= bower_concat.libs.dest %>',
                dest: 'production/temp/js/build/libs_wrapped.js',
                options: {
                    wrapper: [
                            '(function (undefined, Object, String, Number, Array, RegExp) {' +
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
            libs: {
                files: {
                    'production/build/public/libs/libs.min.js': '<%= wrap.libs.dest %>'
                }
            },
            scripts: {
                files: {
                    'production/build/public/client/scripts/scripts.min.js': '<%= wrap.scripts.dest %>'
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
                        ext: '.min.css'
                    }
                ]
            }
        },
        clean: ["production/temp"]
    });

    grunt.loadNpmTasks('grunt-bower-concat');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-wrap');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-clean');
    //https://github.com/yeoman/grunt-usemin

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