/* 
DEV: MediaWiki:SvgEdit.js
REL: modules/ext.SvgEditor/SvgEdit.js
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
        if (debug) console.log("PaintCanvas init");

        $('.SvgEdit').each(function() {
            $element = $(this);
            const fileName = $element.text().split(';')[0];
            const fileDisplayName = fileName.replace(".svg", "");
            const filePageName = "File:" + fileName;
            const filePage = "/wiki/" + filePageName;
            const fileUrl = "/wiki/Special:Redirect/file/" + fileName;
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
              <div id="svgedit-iframe-buttons-${uid}" class="PaintCanvas-Buttons"></div>
              <div id="svgedit-iframe-overlay-${uid}" class="SvgEditEditorOverlay" style="display:none;"></div>
            </div>`;

            $element.append(element_img_box_html);
            $element.append(element_editor_html);

            var file_exists = false;
            var editor_requested = false;
            var editor_ready = false;
            var svg = "";
            //test if file exists
            $.getJSON(`/w/api.php?action=query&prop=revisions&titles=${filePageName}&rvprop=content&formatversion=2&format=json`, function(data) {
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

            //storagePrompt=false does not work here -> must be set on parent window
            const $editor = $(`<iframe class="svgedit" id="svgedit-iframe-${uid}" src="/w/extensions/SvgEditor/dist/editor/index.html?storagePrompt=false" width="100%" height="500px"></iframe>`); //needs build (npm install svgedit)

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
                var svg = document.getElementById(`svgedit-iframe-${uid}`).contentWindow.svgEditor.svgCanvas.svgCanvasToString();
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
                    ignorewarnings: 1
                };
                var api = new mw.Api();
                api.upload(blob, param).done(function(data) {
                    if (debug) console.log(data.upload.filename + ' has sucessfully uploaded.');
                    file_exists = true;
                    mw.notify('Saved', {
                        type: 'success'
                    });
                }).fail(function(data) {
                    if (debug) console.log(data);
                    if (data === 'exists') mw.notify('Saved', {
                        type: 'success'
                    });
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
