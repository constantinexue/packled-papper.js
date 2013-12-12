(function() {
    "use strict";

    mde.View = mde.EventEmitter.extend(function(options) {
        var self = this;

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
        $('#button-export-html-plain').click(function() {
            self.fire('exportHtmlPlainButtonClick');
        });
        self.viewPage = $('#page-view');

        // ACE init
        options.editor = $.extend({
            fontSize: 14,
            theme: "ace/theme/twilight",
            wrap: true
        }, options.editor);
        self.aceEditContainer = $('#ace-edit');
        self.aceEdit = ace.edit(self.aceEditContainer[0]);
        self.aceEdit.setFontSize(options.editor.fontSize);
        self.aceEdit.setShowPrintMargin(false);
        self.aceEdit.setHighlightGutterLine(false);
        self.aceEdit.setTheme(options.editor.theme);
        self.aceEdit.getSession().setMode("ace/mode/markdown");
        self.aceEdit.getSession().setUseWrapMode(options.editor.wrap);
        self.aceEdit.on('change', function(evt) {
            self.fire('contentChanged');
        });
        self.aceEdit.focus();

        self.aceCodeContainer = $('#ace-code');
        self.aceCode = ace.edit(self.aceCodeContainer[0]);
        self.aceCode.setFontSize(options.editor.fontSize);
        self.aceCode.setShowPrintMargin(false);
        self.aceCode.setHighlightGutterLine(false);
        self.aceCode.setTheme(options.editor.theme);
        self.aceCode.getSession().setMode("ace/mode/html");
        self.aceCode.getSession().setUseWrapMode(options.editor.wrap);
        self.aceCode.setReadOnly(true);

        self.on('windowResized', function(evt) {
            var height = $(window).innerHeight() - $('.navbar').outerHeight();
            $('#container-workarea').css({
                height: height
            });
            self.aceEditContainer.height(height);
            self.aceEdit.resize();
            self.aceCodeContainer.height(height);
            self.aceCode.resize();
        });
        self.fire('windowResized');

        self.aceEdit.getSelection().on('changeCursor', function() {
            //self.syncCursor();
        });

        self.aceEdit.getSession().on('changeScrollTop', function(scroll) {
            scroll = parseInt(scroll) || 0;
            self.aceCode.getSession().setScrollTop(scroll);
            // Get percentage
            var pageBody = self.viewPage.contents().find('body');
            var lh = self.aceEdit.getSession().getScreenLength() * self.aceEdit.renderer.lineHeight,
                ls = scroll,
                rh = pageBody.prop('scrollHeight'),
                rs = parseInt(ls * rh / lh);
            if (ls < lh) {
                pageBody.scrollTop(rs);
            }
        });
    }).methods({
        showCode: function(html) {
            var self = this;
            // Send to view page
            var pageBody = self.viewPage.contents().find('body');
            pageBody.html(html);

            html = html_beautify(html, {
                indent_size: 4
            });
            self.aceCode.getSession().getDocument().setValue(html);
        },
        getCode: function() {
            var self = this;
            var pageBody = self.viewPage.contents().find('html');
            return pageBody.html();
        },
        syncCursor: function() {
            var self = this;
            var editAll = self.aceEdit.getSession().getDocument().getLength(),
                codeAll = self.aceCode.getSession().getDocument().getLength(),
                editRow = self.aceEdit.getCursorPosition().row,
                codeRow = parseInt(editRow * codeAll / editAll);
            self.aceCode.scrollToLine(codeRow, true, true);
            self.aceCode.gotoLine(codeRow, 0, true);
        },
        setContent: function(value) {
            var self = this,
                doc = self.aceEdit.getSession().getDocument();
            doc.setValue(value);
            self.aceEdit.gotoLine(0);
            self.aceEdit.focus();
        },
        getContent: function() {
            var self = this,
                doc = self.aceEdit.getSession().getDocument();
            return doc.getValue();
        },
        selectFile: function(mode, type) {
            var self = this,
                dialog = null,
                deferred = when.defer();
            if (_.isUndefined(type)) {
                type = '.md';
            }
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
                if (_.endsWith(selectedFile, type)) {
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
})();