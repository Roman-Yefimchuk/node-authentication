module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            libs: {
                src: [
                    'public/libs/**/*.js'
                ],
                dest: 'production/temp/js/build/libs.js'
            },
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
        uglify: {
            options: {
                compress: {
                    drop_console: true
                }
            },
            libs: {
                files: {
                    'production/build/public/libs/libs.js': '<%= concat.libs.dest %>'
                }
            },
            scripts: {
                files: {
                    'production/build/public/client/scripts/scripts.js': '<%= concat.scripts.dest %>'
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
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    //https://github.com/yeoman/grunt-usemin

    grunt.registerTask('default', [
        'concat',
        'uglify',
        'htmlmin',
        'cssmin'
    ]);
};