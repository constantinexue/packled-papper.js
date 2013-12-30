(function() {
    "use strict";

    mde.View = mde.EventEmitter.extend(function() {
        var self = this;
        $(window).resize(function() {
            self.fire('windowResized');
        });

        // Navbar commands
        self.openDialog = $('#dialog-open');
        self.saveDialog = $('#dialog-save');
        // ACE init
        self.aceEditContainer = $('#ace-edit');
        self.aceEdit = ace.edit(self.aceEditContainer[0]);
        self.aceEdit.setShowPrintMargin(false);
        self.aceEdit.setHighlightGutterLine(false);
        self.aceEdit.getSession().setMode("ace/mode/markdown");
        self.aceEdit.getSession().setUseWrapMode(true);
        self.aceEdit.on('change', function(evt) {
            self.fire('contentChanged');
        });
        self.aceEdit.focus();

        self.on('windowResized', function(evt) {
            var height = $(window).innerHeight() - $('.navbar').outerHeight();
            $('#container-workarea').css({
                height: height
            });
            self.aceEditContainer.height(height);
            self.aceEdit.resize();
        });

        self.aceEdit.getSelection().on('changeCursor', function() {
            //self.syncCursor();
        });

        self.aceEdit.getSession().on('changeScrollTop', function(scroll) {
            //scroll = parseInt(scroll) || 0;
            self.syncScroll();
        });

        //http://stackoverflow.com/questions/13677898/how-to-disable-ace-editors-find-dialog
        self.aceEdit.commands.addCommands([{
            name: "findnext",
            bindKey: {
                win: "Ctrl-D",
                mac: "Command-D"
            },
            exec: function(editor, line) {
                console.log(self.aceEdit.getSelection());
                console.log(self.aceEdit.getSelectionRange());
                return false;
            },
            readOnly: true
        }]);
        // http://stackoverflow.com/questions/15726411/how-to-use-bootstrap-select
        $('.selectpicker').selectpicker({
            //size: 4
        });
    }).methods({
        init: function() {
            var self = this;
            //$('#button-showview').click();
            //self.newButton.click();
            self.fire('windowResized');
        },
        getEditor: function() {
            return this.aceEdit;
        },
        showCode: function(html) {
            var self = this;
            // var container = $('#page-view').contents().find('body');
            // container.html(html);

            var viewPage = document.getElementById('page-view');
            viewPage.contentDocument.write(html);
            viewPage.contentDocument.close();

            html = html_beautify(html, {
                indent_size: 4
            });
            // var code = hljs.highlight('xml', html).value;
            var container = $('#page-code').contents().find('code');
            container.text(html);

            self.syncScroll();
        },
        syncCursor: function() {
            var self = this;
            var editAll = self.aceEdit.getSession().getDocument().getLength(),
                //codeAll = self.aceCode.getSession().getDocument().getLength(),
                codeAll = 0,
                editRow = self.aceEdit.getCursorPosition().row,
                codeRow = parseInt(editRow * codeAll / editAll);
            // self.aceCode.scrollToLine(codeRow, true, true);
            // self.aceCode.gotoLine(codeRow, 0, true);
        },
        syncScroll: function() {
            var self = this,
                pageBody, ls, lh, rh, rs,
                paneHeight = self.aceEditContainer.height();
            // Sync preview
            pageBody = $('#page-view').contents().find('body');
            ls = self.aceEdit.renderer.getScrollTop() + (paneHeight / 2);
            lh = self.aceEdit.getSession().getScreenLength() * self.aceEdit.renderer.lineHeight;
            rh = pageBody.prop('scrollHeight'),
            rs = parseInt(ls * rh / lh) - (paneHeight / 2);
            if (ls < lh && rs > 0) {
                pageBody.scrollTop(rs);
            }
            //console.log(_.str.sprintf('%d/%d = %d/%d ? %d', ls, lh, rs, rh, pageBody.scrollTop()));
            // Sync HTML code
            pageBody = $('#page-code').contents().find('body');
            rh = pageBody.prop('scrollHeight');
            rs = parseInt(ls * rh / lh) - (paneHeight / 2);
            if (ls < lh && rs > 0) {
                pageBody.scrollTop(rs);
            }
            // console.log(pageBody.innerHeight());
            // console.log(pageBody.height());
            // console.log(pageBody.outerHeight());
            // console.log(pageBody.prop('scrollHeight'));
        },
        setContent: function(value) {
            var self = this;
            self.aceEdit.getSession().setValue(value);
            self.aceEdit.gotoLine(0);
            self.aceEdit.focus();
        },
        getContent: function() {
            var self = this,
                doc = self.aceEdit.getSession().getDocument();
            return doc.getValue();
        },
        selectFile: function(mode, type, defaultFilename, workingDir) {
            var self = this,
                dialog = null,
                deferred = when.defer();
            switch (mode) {
                case 'open':
                    dialog = self.openDialog;
                    break;
                case 'save':
                    dialog = self.saveDialog;
                    if (defaultFilename) {
                        dialog.attr('nwsaveas', defaultFilename);
                    } else {
                        dialog.attr('nwsaveas', '');
                    }
                    break;
                default:
                    return;
            }
            if (workingDir) {
                dialog.attr('nwworkingdir', workingDir);
            } else {
                dialog.removeAttr('nwworkingdir');
            }
            dialog.attr('accept', type);
            dialog.off('change');
            dialog.on('change', function(evt) {
                var selectedFile = $(this).val();
                if (!_.str.endsWith(selectedFile, type)) {
                    selectedFile += type;
                }
                deferred.resolve(selectedFile);
                $(this).val('');
            });
            dialog.trigger('click');

            return deferred.promise;
        }
    });
})();