(function() {
    "use strict";
    var express = require('express'),
        http = require('http'),
        path = require('path'),
        fs = require('fs'),
        marked = require('marked'),
        _ = require('underscore'),
        _s = require('underscore.string'),
        when = require('when'),
        sequence = require('when/sequence'),
        pipeline = require('when/pipeline'),
        klass = require('klass'),
        gui = require('nw.gui');
    _.mixin(_s.exports());

    mde.EventEmitter = klass({
        initialize: function() {
            this.events = {};
        },
        on: function(name, callback) {
            if (!this.events.hasOwnProperty(name)) {
                this.events[name] = $.Callbacks();
            }
            this.events[name].add(callback);
            return this;
        },
        fire: function(name, param) {
            if (!this.events.hasOwnProperty(name)) {
                this.events[name] = $.Callbacks();
            }
            this.events[name].fire(param);
            return this;
        }
    });
    mde.Model = klass({
        initialize: function() {

        },
        loadFile: function(filename) {
            var deferred = when.defer();
            fs.readFile(filename, 'utf8', function(err, data) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(data);
                }
            });
            return deferred.promise;
        },
        saveFile: function(filename, content) {
            var deferred = when.defer();
            fs.writeFile(filename, content, 'utf8', function(err) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve();
                }
            });
            return deferred.promise;
        },
        loadSettings: function() {},
        saveSettings: function() {}
    });
    mde.View = mde.EventEmitter.extend({
        initialize: function(options) {
            var self = this;
            self.supr();

            $(window).resize(function() {
                self.fire('windowResized');
            });

            // Navbar commands
            self.openDialog = $('#dialog-open'),
            self.saveDialog = $('#dialog-save'),
            self.openButton = $('#button-open'),
            self.saveButton = $('#button-save'),
            self.saveAsButton = $('#button-saveas');
            self.openButton.click(function() {
                self.fire('openButtonClicked');
            });
            self.saveButton.click(function() {
                self.fire('saveButtonClicked');
            });

            // ACE init
            options.editor = $.extend({
                fontSize: 14,
                theme: "ace/theme/twilight",
                wrap: true
            }, options.editor);
            self.aceContainer = $('#editor');
            self.ace = ace.edit(self.aceContainer[0]);
            self.ace.setFontSize(options.editor.fontSize);
            self.ace.setShowPrintMargin(false);
            self.ace.setHighlightGutterLine(false);
            self.ace.setTheme(options.editor.theme);
            self.ace.getSession().setMode("ace/mode/markdown");
            self.ace.getSession().setUseWrapMode(options.editor.wrap);
            self.ace.on('change', function(evt) {
                self.fire('contentChanged');
            });
            self.ace.focus();

            self.on('windowResized', function(evt) {
                var height = $(window).innerHeight() - $('.navbar').outerHeight();
                $('#container-workarea').css({
                    height: height
                });
                self.aceContainer.height(height);
                self.ace.resize();
            });
            self.fire('windowResized');
        },
        init: function() {
            var self = this;
        },
        getEditor: function() {
            return this.editor;
        },
        setContent: function(value) {
            var self = this,
                doc = self.ace.getSession().getDocument();
            doc.setValue(value);
            self.ace.gotoLine(0);
            self.ace.focus();
        },
        getContent: function() {
            var self = this,
                doc = self.ace.getSession().getDocument();
            return doc.getValue();
        },
        selectFile: function(mode) {
            var self = this,
                dialog = null,
                deferred = when.defer();
            switch (mode) {
                case 'open':
                    dialog = self.openDialog;
                    break;
                case 'save':
                    dialog = self.saveDialog;
                    break;
                default:
                    return;
            }
            dialog.off('change');
            dialog.on('change', function(evt) {
                var selectedFile = $(this).val();
                if (_.endsWith(selectedFile, '.md')) {
                    deferred.resolve(selectedFile);
                }
                $(this).val('');
            });
            dialog.trigger('click');

            return deferred.promise;
        },
        promptToSave: function() {
            var deferred = when.defer();
            // Prompt to save change first
            bootbox.dialog({
                message: "You have changed the content, do you want to save it first?",
                title: "Prompt to save",
                closeButton: false,
                buttons: {
                    save: {
                        label: "Save it now",
                        className: "btn-success",
                        callback: function() {
                            deferred.resolve(true);
                        }
                    },
                    notsave: {
                        label: "Discard change",
                        className: "btn-danger",
                        callback: function() {
                            deferred.resolve(false);
                        }
                    },
                    cancel: {
                        label: "Cancel",
                        callback: function() {
                            deferred.reject();
                        }
                    }
                }
            });
            return deferred.promise;
        }
    });
    mde.Controller = klass({
        initialize: function(view, model) {
            var self = this;
            self.currentFile = null;
            self.isDirty = false;
            self.view = view;
            self.model = model;
            self.view.on('openButtonClicked', function() {
                var promise = when.resolve();
                if (self.isDirty) {
                    promise = promise.then(function() {
                        return self.view.promptToSave();
                    }).then(function(save) {
                        if (save) {
                            self.view.fire('saveButtonClicked');
                        }
                        return when.resolve();
                    });
                }
                promise.then(function() {
                    return self.view.selectFile('open');
                }).then(function(filename) {
                    return self.openFile(filename);
                });
            }).on('saveButtonClicked', function() {
                var promise = when.resolve();
                // If this is a new file, prompts user to save
                if (_.isNull(self.currentFile)) {
                    promise = promise.then(function() {
                        return self.view.selectFile('save');
                    }).then(function(filename) {
                        self.currentFile = filename;
                        self.isDirty = true;
                        return when.resolve();
                    });
                }
                // File need to be writen to disk if only it is dirty.
                if (self.isDirty) {
                    promise.then(function() {
                        return self.saveFile(self.currentFile);
                    });
                }
            }).on('contentChanged', function() {
                self.isDirty = true;
            });
        },
        openFile: function(filename) {
            var self = this;
            self.model.loadFile(filename)
                .then(function(content) {
                    self.currentFile = filename;
                    self.view.setContent(content);
                    self.isDirty = false;
                });
        },
        saveFile: function() {
            var self = this,
                content = self.view.getContent();
            self.model.saveFile(self.currentFile, content)
                .then(function() {
                    self.isDirty = false;
                });
        }
    });
    mde.Application = klass({
        initialize: function() {},
        startup: function(options) {
            var win = gui.Window.get();
            // win.maximize();

            this.view = new mde.View(options);
            this.model = new mde.Model();
            this.controller = new mde.Controller(this.view, this.model);
            win.show();
        }
    });
})();
$(function() {
    var app = new mde.Application();
    app.startup({
        editor: {}
    });
});