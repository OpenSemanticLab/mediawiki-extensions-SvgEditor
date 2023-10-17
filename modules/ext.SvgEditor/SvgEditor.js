/*@nomin*/
/* 
DEV: MediaWiki:SvgEdit.js
REL: modules/ext.SvgEditor/SvgEdit.js
hint: ResourceLoader minifier does not ES6 yet, therefore skip minification  with "nomin" (see https://phabricator.wikimedia.org/T255556)
*/

$(document).ready(function() {
    if ($('.SvgEdit').length === 0) return; //only on pages with a PaintCanvas-div

    $.when(
        mw.loader.using('oojs-ui-core'),
        $.Deferred(function(deferred) {
            $(deferred.resolve);
        })
    ).done(function() {
        const debug = false;
        if (debug) console.log("SvgEditEditor init");

        $('.SvgEdit').each(function() {
            $element = $(this);
            const config = $element.data('config') ? $element.data('config') : {};
            const fileName = config.file_title ? config.file_title : $element.text().split(';')[0];
            const fileDisplayName = config.file_label ? config.file_label : fileName.replace(".svg", "");
            const filePageName = "File:" + fileName;
            const filePage = mw.util.getUrl(filePageName);
            const fileUrl = mw.util.getUrl("Special:Redirect/file/" + fileName);
            $element.text("");
            $element.show();

            const uid = (performance.now().toString(36) + Math.random().toString(36)).replace(/\./g, "");
            const element_img_box_html = `
            <div id="svgedit-img-box-${uid}">
              <div align="right">
                <span class="mw-svgedit">
                  <span class="mw-editsection-bracket">[</span>
                  <a id="svgedit-edit-link-${uid}" href="javascript:void(0)">Edit</a>
                  <span class="mw-editsection-bracket">]</span>
                </span>
              </div>
              <div id="svgedit-placeholder-${uid}" class="DrawioEditorInfoBox" style="display:none;"><b>${fileDisplayName}</b><br>empty svgeditor drawing</div>
            </div>`;
            //<img id="svgedit-img-${uid}" src="${fileUrl}?ts=${new Date().getTime()}" title="${fileName}" alt="${fileName}" style="height: auto; width: 100%; max-width: 500px;">
            const element_img_html = `
            <a id="svgedit-img-href-${uid}" href="${filePage}">
              <img id="svgedit-img-${uid}" src="${fileUrl}" title="${fileName}" alt="${fileName}" style="height: auto; width: 100%; max-width: 500px;">
            </a>`;
            const element_editor_html = ` 
            <div id="svgedit-iframe-box-${uid}" style="display:none;">
              <div id="svgedit-iframe-buttons-${uid}" class="SvgEditEditor-Buttons"></div>
              <div id="svgedit-iframe-overlay-${uid}" class="SvgEditEditorOverlay" style="display:none;"></div>
            </div>`;

            $element.append(element_img_box_html);
            $element.append(element_editor_html);

            var file_exists = false;
            var editor_requested = false;
            var editor_ready = false;
            var svg = "";
            //test if file exists
            $.getJSON(mw.config.get("wgScriptPath") + `/api.php?action=query&prop=revisions&titles=${filePageName}&rvprop=content&formatversion=2&format=json`, function(data) {
                if (data.query.pages[0].hasOwnProperty("missing") && data.query.pages[0].missing === true) {
                    if (debug) console.log("File does not exist");
                    $(`#svgedit-placeholder-${uid}`).show();
                } else {
                    //fetch file
                    $.ajax({
                        url: fileUrl,
                        dataType: "text",
                        success: function(data) {
                            if (debug) console.log("Load: " + data);
                            svg = data;
                            file_exists = true;
                            $(`#svgedit-img-box-${uid}`).append(element_img_html);
                        },
                        error: function(data) {
                            if (debug) console.log("Error while fetching file: " + data);
                            $(`#svgedit-placeholder-${uid}`).show();
                        }
                    });
                }
            });

            //var edit_button = new OO.ui.ButtonWidget( {	label: 'Edit' } );
            var save_button = new OO.ui.ButtonWidget({
                label: 'Save'
            });
            var close_button = new OO.ui.ButtonWidget({
                label: 'Close'
            });
            //$(`#svgedit-iframe-buttons-${uid}`).append(edit_button.$element);
            $(`#svgedit-iframe-buttons-${uid}`).append(save_button.$element);
            $(`#svgedit-iframe-buttons-${uid}`).append(close_button.$element);
            $(`#svgedit-iframe-buttons-${uid}`).append('<a class="external text" rel="nofollow" target="_blank" href="https://www.youtube.com/watch?v=ZJKmEI06YiY">Tutorial</a>');

            //storagePrompt=false does not work here -> must be set on parent window
            const $editor = $(`<iframe class="svgedit" id="svgedit-iframe-${uid}" src="${mw.config.get("wgScriptPath")}/extensions/SvgEditor/dist/editor/index.html?storagePrompt=false" width="100%" height="500px"></iframe>`); //needs build (npm install svgedit)

            $(`#svgedit-edit-link-${uid}`).on('click', function() {
                //$(`#svgedit-img-${uid}`).remove();
                $(`#svgedit-img-box-${uid}`).hide();
                editor_requested = true;
                $(`#svgedit-iframe-box-${uid}`).append($editor);
                $(`#svgedit-iframe-box-${uid}`).show();
            });

            //const svgEditor = new Editor(this);
            //svgEditor.init();

            //var svgEditor = window.frames[0].svgEditor;
            //svgEditor.ready(function () {
            //if (debug) console.log("SvgEditor loaded");
            //missing in v7?
            //var svgEditor = window.frames[0].svgEditor;
            //svgEditor.setCustomHandlers({
            //	save (_win, _data) {
            //		if (debug) console.log("Save: " + data);
            //		// Save svg
            //	}
            //});
            //});

            $(document).bind('svgEditorReady', function(data) {
                if (debug) console.log(`svgedit-iframe-${uid} : editor_ready ${editor_ready}, editor_requested ${editor_requested}`);
                if (editor_ready) {
                    if (debug) console.log("SvgEditor already loaded, source is another instance");
                    return;
                }
                if (!editor_requested) {
                    if (debug) console.log("SvgEditor not requested, source is another instance");
                    return;
                }
                editor_ready = true;
                editor_requested = false;
                if (debug) console.log("SvgEditor loaded");
                if (debug) console.log("Event data: ");
                if (debug) console.log(data);
                if (file_exists) {
                    //Only if file exists
                    if (debug) console.log("Load: " + fileUrl);
                    //document.getElementById(`svgedit-iframe-${uid}`).contentWindow.svgEditor.loadFromURL(fileUrl);
                    if (debug) console.log("iframe id: " + `svgedit-iframe-${uid}`);
                    document.getElementById(`svgedit-iframe-${uid}`).contentWindow.svgEditor.svgCanvas.setSvgString(svg);
                }
            });

            save_button.on('click', function() {
                svg = document.getElementById(`svgedit-iframe-${uid}`).contentWindow.svgEditor.svgCanvas.svgCanvasToString();
                if (debug) console.log("Save: " + svg);
                if (debug) console.log("Uploading " + fileName);
                const blob = new Blob([svg], {
                    type: 'image/svg+xml'
                });
                let file = new File([blob], fileName, {
                    type: "image/svg+xml",
                    lastModified: new Date().getTime()
                });
                let container = new DataTransfer();
                container.items.add(file);
                fileInput = $('<input/>').attr('type', 'file');
                fileInput.files = container.files;
                var param = {
                    filename: fileName,
                    comment: "Edited with SvgEdit",
                    text: "",
                    format: 'json',
                    ignorewarnings: true
                };
                var api = new mw.Api();
                api.upload(blob, param).done(function(data) {
                    if (debug) console.log(data.upload.filename + ' has sucessfully uploaded.');
                    file_exists = true;
		    mw.hook( 'svgeditor.file.uploaded' ).fire({exists: false, name: fileName, label: fileDisplayName});
                    mw.notify('Saved', {
                        type: 'success'
                    });
                }).fail(function(retStatus, data) {
                    if (debug) console.log(data);
                    if (data.upload.result === "Success") {
			mw.hook( 'svgeditor.file.uploaded' ).fire({exists: true, name: fileName, label: fileDisplayName});
			mw.notify('Saved', {
                        	type: 'success'
                    	});
		    }
                    else mw.notify('An error occured while saving. \nPlease save your work on the local disk.', {
                        title: 'Error',
                        type: 'error'
                    });
                });
            });

            close_button.on('click', function() {
                $editor.remove();
                editor_ready = false;
                $(`#svgedit-iframe-box-${uid}`).hide();
                $(`#svgedit-img-box-${uid}`).show();
                //force reload image
                //const img_element = `<img id="svgedit-img-${uid}" src="${fileUrl}?ts=${new Date().getTime()}" title="${fileName}" alt="${fileName}" style="height: auto; width: 100%; max-width: 500px;">`;
                //$(`#svgedit-img-href-${uid}`).append(img_element);
                if (file_exists) {
                    $(`#svgedit-placeholder-${uid}`).hide();
                    $(`#svgedit-img-${uid}`).remove(); //prevent duplicates
                    $(`#svgedit-img-box-${uid}`).append(element_img_html);
                    //force reload image
                    $(`#svgedit-img-${uid}`).attr('src', `${fileUrl}?ts=${new Date().getTime()}" title="${fileName}`);

                } else {
                    //nothing to do here
                }
                if (debug) console.log("Close ");
            });
        });
    });
});
