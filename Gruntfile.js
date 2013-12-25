'use strict';
var path = require('path'),
    fs = require('fs'),
    _ = require('underscore');

function rewritePackageJson() {
    var packageJson = _.clone(require('./package'));
    if (!fs.existsSync('./dist')) {
        fs.mkdirSync('./dist');
    }
    delete packageJson.devDependencies;
    packageJson.window.toolbar = false;
    fs.writeFileSync('./dist/package.json', JSON.stringify(packageJson, null, 4), 'utf8');
}

function listProductionNodeModules() {
    var packageJson = _.clone(require('./package'));
    var moduleNames = [];
    _.chain(packageJson.dependencies).keys().each(function(element, index, list) {
        moduleNames.push(element + '/**/*');
    }).value();
    console.log(moduleNames);

    return moduleNames;
}

var nwOptions = {
    app_name: 'MarkdownEditor',
    version: '0.8.3',
    build_dir: './build',
    mac: false,
    win: false,
    linux32: false,
    linux64: false
};
var nwSrc = ['./dist/**/*'];

module.exports = function(grunt) {

    grunt.initConfig({
        // jshint: {
        //     files: ['controllers/**/*.js', 'lib/**/*.js', 'models/**/*.js'],
        //     options: {
        //         jshintrc: '.jshintrc'
        //     }
        // },
        clean: {
            compile: './public/',
            build: './dist',
            buildBin: './dist/bin'
        },
        jade: {
            compile: {
                options: {
                    pretty: true,
                    data: function(dest, src) {
                        return require('./config');
                    }
                },
                files: {
                    './public/splash.html': './src/jade/splash.jade',
                    './public/test.html': './src/jade/test.jade',
                    './public/index.html': './src/jade/index.jade',
                    './public/page-view.html': './src/jade/page-view.jade',
                    './public/page-code.html': './src/jade/page-code.jade',
                    './public/page-temp.html': './src/jade/page-temp.jade'
                }
            }
        },
        less: {
            compile: {
                files: {
                    './public/css/main.css': './src/less/main.less',
                    './public/css/page-code.css': './src/less/page-code.less',
                    './public/css/style-default.css': './src/less/style-default.less',
                    './public/css/style-gfm.css': './src/less/style-gfm.less',
                    './public/css/theme-github.css': './src/less/theme-github.less'
                }
            }
        },
        copy: {
            compile: {
                files: [{
                    expand: true,
                    cwd: './src/js/',
                    src: '**',
                    dest: './public/js/'
                }, {
                    expand: true,
                    cwd: './src/vendor/',
                    src: '**',
                    dest: './public/vendor/'
                }, {
                    expand: true,
                    cwd: './src/img/',
                    src: '**',
                    dest: './public/img/'
                }]
            },
            build: {
                files: [{
                    expand: true,
                    cwd: './node_modules/',
                    src: listProductionNodeModules(),
                    dest: './dist/node_modules'
                }, {
                    expand: true,
                    cwd: './public/',
                    src: '**',
                    dest: './dist/public/'
                }]
            },
            buildWin: {
                files: [{
                    expand: true,
                    cwd: './bin/win32/',
                    src: '**',
                    dest: './dist/bin/win32/'
                }],
                options: {
                    mode: true
                }
            },
            buildMac: {
                files: [{
                    expand: true,
                    cwd: './bin/macos/',
                    src: '**',
                    dest: './dist/bin/macos/'
                }],
                options: {
                    mode: true
                }
            },
            buildL64: {
                files: [{
                    expand: true,
                    cwd: './bin/linux64/',
                    src: '**',
                    dest: './dist/bin/linux64/'
                }],
                options: {
                    mode: true
                }
            },
            buildL32: {
                files: [{
                    expand: true,
                    cwd: './bin/linux32/',
                    src: '**',
                    dest: './dist/bin/linux32/'
                }],
                options: {
                    mode: true
                }
            }
        },
        watch: {
            compile: {
                files: ['./src/jade/*.jade'],
                tasks: ['jade'],
                options: {
                    interrupt: true,
                }
            },
            less: {
                files: ['./src/less/*.less'],
                tasks: ['less'],
                options: {
                    interrupt: true,
                }
            },
            js: {
                files: ['./src/js/*.js'],
                tasks: ['copy:js'],
                options: {
                    interrupt: true,
                }
            }
        },
        nodewebkit: {
            win: {
                options: _.extend(nwOptions, {
                    win: true
                }),
                src: nwSrc
            },
            linux64: {
                options: _.extend(nwOptions, {
                    linux64: true
                }),
                src: nwSrc
            },
            linux32: {
                options: _.extend(nwOptions, {
                    linux32: true
                }),
                src: nwSrc
            },
            mac: {
                options: _.extend(nwOptions, {
                    mac: true
                }),
                src: nwSrc
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-node-webkit-builder');

    grunt.registerTask('rewrite', '', rewritePackageJson);

    grunt.registerTask('compile', ['clean:compile', 'jade', 'less', 'copy:compile']);
    grunt.registerTask('build', ['compile', 'clean:build', 'copy:build', 'rewrite',
        'clean:buildBin', 'copy:buildWin', 'nodewebkit:win',
        'clean:buildBin', 'copy:buildMac', 'nodewebkit:mac',
        'clean:buildBin', 'copy:buildL64', 'nodewebkit:linux64'
        // 'clean:buildBin', 'copy:buildL32', 'nodewebkit:linux32'
    ]);
};