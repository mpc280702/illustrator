#target illustrator

function makeResponse(count, failed, warnings, message) {
    var safeMsg = String(message || "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\r/g, "")
        .replace(/\n/g, "\\n");
    return '{"count":' + (count || 0) + ',"failed":' + (failed || 0) + ',"warnings":' + (warnings || 0) + ',"message":"' + safeMsg + '"}';
}

function configureTracing(opt, presetIndex, maxColors, ignoreWhite) {
    try {
        var presets = app.tracingPresetsList;
        var keyword = "";
        if (presetIndex === 0) keyword = "16"; // Logo phẳng
        else if (presetIndex === 1) keyword = "16"; // Hoạt hình
        else if (presetIndex === 2) keyword = "High"; // Ảnh chi tiết cao
        else if (presetIndex === 3) keyword = "Black"; // Đen trắng
        else if (presetIndex === 4) keyword = "Line"; // Nét vẽ

        if (presets && presets.length > 0) {
            for (var p = 0; p < presets.length; p++) {
                if (presets[p].toLowerCase().indexOf(keyword.toLowerCase()) !== -1) {
                    opt.loadFromPreset(presets[p]);
                    break;
                }
            }
        }
    } catch (ePreset) {}

    try {
        if (typeof TracingModeType !== "undefined") {
            if (presetIndex === 3 || presetIndex === 4) {
                opt.tracingMode = TracingModeType.TRACINGMODEBLACKANDWHITE;
            } else {
                opt.tracingMode = TracingModeType.TRACINGMODECOLOR;
            }
        }
    } catch (eMode) {}

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
        if (presetIndex === 0) {
            opt.maxColors = Math.min(maxColors, 16);
            opt.pathFidelity = 80;
            opt.cornerFidelity = 80;
            opt.noiseFidelity = 15;
        } else if (presetIndex === 1) {
            opt.maxColors = maxColors;
            opt.pathFidelity = 65;
            opt.cornerFidelity = 50;
            opt.noiseFidelity = 10;
        } else if (presetIndex === 2) {
            opt.pathFidelity = 95;
            opt.cornerFidelity = 40;
            opt.noiseFidelity = 2;
        } else if (presetIndex === 3) {
            opt.threshold = 128;
            opt.pathFidelity = 85;
            opt.cornerFidelity = 75;
            opt.noiseFidelity = 25;
        } else if (presetIndex === 4) {
            opt.threshold = 180;
            opt.fills = false;
            opt.strokes = true;
            opt.maxStrokeWeight = 6;
            opt.pathFidelity = 90;
            opt.cornerFidelity = 85;
            opt.noiseFidelity = 10;
        }
    } catch (eFid) {}

    try {
        opt.ignoreWhite = ignoreWhite;
    } catch (eWhite) {}
}

function runVectorTraceFromPanel(paramsStr) {
    try {
        if (app.documents.length === 0) {
            return makeResponse(0, 1, 0, "Vui lòng mở hoặc tạo một tài liệu Illustrator trước!");
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
                0,
                1,
                0,
                isSelectionOnly
                    ? "Chưa chọn ảnh nào! Hãy chọn ảnh trước khi bấm Trace."
                    : "Không tìm thấy ảnh nào trong tài liệu!"
            );
        }

        var processedCount = 0;
        var failedCount = 0;
        var warningCount = 0;

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
                        failedCount++;
                        warningCount++;
                        continue;
                    }
                }

                if (!currentItem) {
                    failedCount++;
                    continue;
                }

                // Nếu sau khi embed thành GroupItem, tìm RasterItem bên trong
                if (currentItem.typename === "GroupItem") {
                    var foundRaster = null;
                    for (var gi = 0; gi < currentItem.pageItems.length; gi++) {
                        if (currentItem.pageItems[gi].typename === "RasterItem") {
                            foundRaster = currentItem.pageItems[gi];
                            break;
                        }
                    }
                    if (foundRaster) {
                        currentItem = foundRaster;
                    }
                }

                if (currentItem.typename !== "RasterItem") {
                    failedCount++;
                    continue;
                }

                try {
                    pluginItem = currentItem.trace();
                } catch (eTrace) {
                    failedCount++;
                    warningCount++;
                    continue;
                }
            }

            if (!pluginItem || !pluginItem.tracing) {
                failedCount++;
                continue;
            }

            var opt = pluginItem.tracing.tracingOptions;
            configureTracing(opt, presetIndex, maxColors, ignoreWhite);

            app.redraw();

            if (autoExpand) {
                try {
                    var expandedGroup = pluginItem.tracing.expandTracing(true);
                    if (expandedGroup) {
                        // Giới hạn dọn dẹp Path nhỏ CHỈ trong group vừa expand
                        if (cleanSpecks) {
                            cleanTinySpecksInGroup(expandedGroup, 4);
                        }
                        if (ungroup) {
                            ungroupAll(expandedGroup);
                        }
                    }
                } catch (eExpand) {
                    warningCount++;
                }
            }

            processedCount++;
        }

        app.redraw();

        var msg = "";
        if (processedCount > 0) {
            msg = "Đã chuyển đổi thành công " + processedCount + " ảnh thành Vector!";
            if (failedCount > 0) {
                msg += " (Bỏ qua " + failedCount + " mục không hợp lệ)";
            }
        } else {
            msg = "Không có ảnh nào được vector hóa. Hãy kiểm tra lại ảnh được chọn.";
        }

        return makeResponse(processedCount, failedCount, warningCount, msg);
    } catch (err) {
        return makeResponse(0, 1, 0, "Lỗi: " + err.toString());
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

function cleanTinySpecksInGroup(group, minArea) {
    if (!group) return;
    try {
        if (group.typename === "PathItem") {
            if (Math.abs(group.area) < minArea) {
                group.remove();
            }
        } else if (group.typename === "GroupItem") {
            for (var i = group.pageItems.length - 1; i >= 0; i--) {
                cleanTinySpecksInGroup(group.pageItems[i], minArea);
            }
        }
    } catch (e) {}
}
