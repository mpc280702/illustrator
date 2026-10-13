#target illustrator

function makeResponse(success, message, count) {
    var safeMsg = String(message || "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\r/g, "")
        .replace(/\n/g, "\\n");
    return '{"success":' + (success ? "true" : "false") + ',"count":' + (count || 0) + ',"message":"' + safeMsg + '"}';
}

function configureTracing(opt, presetIndex, maxColors, ignoreWhite) {
    // 1. Thử load từ preset gốc của Illustrator
    try {
        var presets = app.tracingPresetsList;
        var keyword = "";
        if (presetIndex === 0) keyword = "16"; // Logo / Flat
        else if (presetIndex === 1) keyword = "16"; // Illustration
        else if (presetIndex === 2) keyword = "High"; // High Fidelity Photo
        else if (presetIndex === 3) keyword = "Black"; // Black and White
        else if (presetIndex === 4) keyword = "Line"; // Line Art / Sketch

        if (presets && presets.length > 0) {
            for (var p = 0; p < presets.length; p++) {
                if (presets[p].indexOf(keyword) !== -1) {
                    opt.loadFromPreset(presets[p]);
                    break;
                }
            }
        }
    } catch (ePreset) {}

    // 2. Chế độ màu / đen trắng
    try {
        if (typeof TracingModeType !== "undefined") {
            if (presetIndex === 3 || presetIndex === 4) {
                opt.tracingMode = TracingModeType.TRACINGMODEBLACKANDWHITE;
            } else {
                opt.tracingMode = TracingModeType.TRACINGMODECOLOR;
            }
        }
    } catch (eMode) {}

    // 3. Số lượng màu
    try {
        if (typeof TracingColorType !== "undefined") {
            if (presetIndex === 2) {
                opt.tracingColorTypeValue = TracingColorType.TRACINGFULLCOLOR;
            } else {
                opt.tracingColorTypeValue = TracingColorType.TRACINGLIMITEDCOLOR;
            }
        }
    } catch (eColorType) {}

    try {
        if (presetIndex !== 2 && presetIndex !== 3 && presetIndex !== 4) {
            opt.maxColors = maxColors;
        }
    } catch (eMaxColors) {}

    // 4. Bỏ nền trắng
    try {
        opt.ignoreWhite = ignoreWhite;
    } catch (eWhite) {}

    // 5. Fill / Stroke cho nét vẽ
    try {
        if (presetIndex === 4) {
            opt.fills = false;
            opt.strokes = true;
            opt.maxStrokeWeight = 6;
        } else {
            opt.fills = true;
            opt.strokes = false;
        }
    } catch (eFills) {}
}

function runVectorTraceFromPanel(paramsStr) {
    try {
        if (app.documents.length === 0) {
            return makeResponse(false, "Vui lòng mở một tài liệu Illustrator trước!");
        }

        var doc = app.activeDocument;
        var params = eval("(" + paramsStr + ")");

        var isSelectionOnly = params.scope === "selection";
        var presetIndex = parseInt(params.presetIndex, 10);
        var maxColors = parseInt(params.maxColors, 10);
        var ignoreWhite = !!params.ignoreWhite;
        var autoExpand = !!params.autoExpand;
        var ungroup = !!params.ungroup;
        var cleanSpecks = !!params.cleanSpecks;

        var itemsToTrace = [];

        function collectImages(item) {
            if (!item) return;
            var tn = item.typename;
            if (tn === "RasterItem" || tn === "PlacedItem") {
                itemsToTrace.push(item);
            } else if (tn === "PluginItem" && item.tracing) {
                itemsToTrace.push(item);
            } else if (tn === "GroupItem") {
                for (var g = 0; g < item.pageItems.length; g++) {
                    collectImages(item.pageItems[g]);
                }
            }
        }

        if (isSelectionOnly) {
            var sel = doc.selection;
            if (sel && sel.length > 0) {
                for (var i = 0; i < sel.length; i++) {
                    collectImages(sel[i]);
                }
            }
        } else {
            for (var j = 0; j < doc.placedItems.length; j++) {
                itemsToTrace.push(doc.placedItems[j]);
            }
            for (var k = 0; k < doc.rasterItems.length; k++) {
                itemsToTrace.push(doc.rasterItems[k]);
            }
            for (var p = 0; p < doc.pluginItems.length; p++) {
                if (doc.pluginItems[p].tracing) {
                    itemsToTrace.push(doc.pluginItems[p]);
                }
            }
        }

        if (itemsToTrace.length === 0) {
            return makeResponse(
                false,
                isSelectionOnly
                    ? "Chưa chọn ảnh nào! Hãy chọn ảnh trước khi bấm."
                    : "Không tìm thấy ảnh nào trong file!"
            );
        }

        var processedCount = 0;

        for (var idx = itemsToTrace.length - 1; idx >= 0; idx--) {
            var currentItem = itemsToTrace[idx];
            var pluginItem = null;

            if (currentItem.typename === "PluginItem" && currentItem.tracing) {
                pluginItem = currentItem;
            } else {
                if (currentItem.typename === "PlacedItem") {
                    try {
                        currentItem = currentItem.embed();
                    } catch (eEmbed) {
                        continue;
                    }
                }

                if (currentItem.typename !== "RasterItem") {
                    continue;
                }

                try {
                    pluginItem = currentItem.trace();
                } catch (eTrace) {
                    continue;
                }
            }

            if (!pluginItem || !pluginItem.tracing) {
                continue;
            }

            var opt = pluginItem.tracing.tracingOptions;
            configureTracing(opt, presetIndex, maxColors, ignoreWhite);

            app.redraw();

            if (autoExpand) {
                try {
                    var expandedGroup = pluginItem.tracing.expandTracing(true);
                    if (ungroup && expandedGroup) {
                        ungroupAll(expandedGroup);
                    }
                    if (cleanSpecks) {
                        cleanTinySpecks(doc.selection, 4);
                    }
                } catch (eExpand) {}
            }

            processedCount++;
        }

        app.redraw();

        return makeResponse(true, "Đã chuyển đổi thành công " + processedCount + " ảnh thành Vector!", processedCount);
    } catch (err) {
        return makeResponse(false, "Lỗi: " + err.toString());
    }
}

function ungroupAll(obj) {
    if (!obj || obj.typename !== "GroupItem") return;
    var parent = obj.parent;
    for (var i = obj.pageItems.length - 1; i >= 0; i--) {
        var item = obj.pageItems[i];
        try {
            item.move(parent, ElementPlacement.PLACEBEFORE);
            if (item.typename === "GroupItem") {
                ungroupAll(item);
            }
        } catch (e) {}
    }
}

function cleanTinySpecks(items, minArea) {
    if (!items) return;
    for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        try {
            if (it.typename === "PathItem") {
                if (Math.abs(it.area) < minArea) {
                    it.remove();
                }
            } else if (it.typename === "GroupItem") {
                cleanTinySpecks(it.pageItems, minArea);
            }
        } catch (e) {}
    }
}
