/**
 * =========================================================================
 * Plugin: VectorTracer Pro for Adobe Illustrator
 * Chức năng: Chuyển đổi ảnh Bitmap (Raster) thành Vector tự động
 * Tác giả: Antigravity Assistant
 * Tương thích: Adobe Illustrator CS6, CC 2018 - CC 2026+ (Windows / macOS)
 * =========================================================================
 */

#target illustrator

(function () {
    if (app.documents.length === 0) {
        alert("Thông báo:\nVui lòng mở một tài liệu (Document) trước khi chạy công cụ này!", "VectorTracer Pro");
        return;
    }

    var doc = app.activeDocument;

    // --- TẠO GIAO DIỆN SCRIPTUI ---
    var win = new Window("dialog", "VectorTracer Pro - Chuyển ảnh thành Vector", undefined, { resizeable: false });
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 15;

    // --- 1. PHẠM VI ÁP DỤNG ---
    var pnlScope = win.add("panel", undefined, "1. Phạm vi áp dụng");
    pnlScope.orientation = "row";
    pnlScope.alignChildren = ["left", "center"];
    var rbSelection = pnlScope.add("radiobutton", undefined, "Ảnh đang chọn (Selection)");
    var rbAll = pnlScope.add("radiobutton", undefined, "Tất cả ảnh trong file (All Images)");
    rbSelection.value = true;

    // --- 2. KIỂU VECTOR HÓA (PRESET) ---
    var pnlPreset = win.add("panel", undefined, "2. Kiểu Vector (Preset)");
    pnlPreset.orientation = "column";
    pnlPreset.alignChildren = ["fill", "top"];

    var ddlPreset = pnlPreset.add("dropdownlist", undefined, [
        "Logo / Vector phẳng (Flat Logo - Sắc nét, ít màu)",
        "Hoạt hình / Minh họa (Illustration - 16 màu)",
        "Ảnh chân thực (High Fidelity Photo - Chi tiết cao)",
        "Đơn sắc / Bóng đen (Black & White Silhouette)",
        "Nét vẽ / Phác thảo (Line Art / Sketch)"
    ]);
    ddlPreset.selection = 0;

    var grpColors = pnlPreset.add("group");
    grpColors.orientation = "row";
    grpColors.add("statictext", undefined, "Số lượng màu (Max Colors):");
    var sldColors = grpColors.add("slider", undefined, 16, 2, 64);
    var lblColors = grpColors.add("statictext", undefined, "16");
    lblColors.characters = 3;

    sldColors.onChanging = function () {
        lblColors.text = Math.round(sldColors.value);
    };

    // --- 3. TÙY CHỌN NÂNG CAO ---
    var pnlOptions = win.add("panel", undefined, "3. Tùy chọn nâng cao");
    pnlOptions.orientation = "column";
    pnlOptions.alignChildren = ["left", "top"];
    pnlOptions.spacing = 6;

    var chkIgnoreWhite = pnlOptions.add("checkbox", undefined, "Tự động bỏ nền trắng (Ignore White)");
    chkIgnoreWhite.value = true;

    var chkAutoExpand = pnlOptions.add("checkbox", undefined, "Tự động rã vector thành Path (Auto Expand)");
    chkAutoExpand.value = true;

    var chkUngroup = pnlOptions.add("checkbox", undefined, "Rã nhóm sau khi Expand (Ungroup Paths)");
    chkUngroup.value = true;

    var chkCleanSpecks = pnlOptions.add("checkbox", undefined, "Lọc bỏ rác & mảnh vụn vector nhỏ (< 4 pt²)");
    chkCleanSpecks.value = true;

    // --- NÚT ĐIỀU KHIỂN ---
    var grpButtons = win.add("group");
    grpButtons.alignment = ["fill", "bottom"];
    var btnCancel = grpButtons.add("button", undefined, "Đóng", { name: "cancel" });
    var btnRun = grpButtons.add("button", undefined, "Chuyển thành Vector", { name: "ok" });

    btnCancel.onClick = function () {
        win.close();
    };

    btnRun.onClick = function () {
        try {
            var itemsToTrace = getTargetImages(rbSelection.value);
            if (itemsToTrace.length === 0) {
                alert("Không tìm thấy ảnh bitmap hoặc ảnh liên kết nào!\n\nHãy chọn một bức ảnh hoặc chèn ảnh vào file.", "Thông báo");
                return;
            }

            var processedCount = 0;

            for (var i = itemsToTrace.length - 1; i >= 0; i--) {
                var currentItem = itemsToTrace[i];
                var pluginItem = null;

                if (currentItem.typename === "PluginItem" && currentItem.tracing) {
                    pluginItem = currentItem;
                } else {
                    if (currentItem.typename === "PlacedItem") {
                        try {
                            currentItem = currentItem.embed();
                        } catch (e) {
                            continue;
                        }
                    }

                    if (currentItem && currentItem.typename === "GroupItem") {
                        for (var gi = 0; gi < currentItem.pageItems.length; gi++) {
                            if (currentItem.pageItems[gi].typename === "RasterItem") {
                                currentItem = currentItem.pageItems[gi];
                                break;
                            }
                        }
                    }

                    if (!currentItem || currentItem.typename !== "RasterItem") {
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

                var traceOptions = pluginItem.tracing.tracingOptions;

                // Cấu hình Preset
                configureTracing(traceOptions, ddlPreset.selection.index, Math.round(sldColors.value), chkIgnoreWhite.value);

                // Auto Expand
                if (chkAutoExpand.value) {
                    var expandedGroup = pluginItem.tracing.expandTracing(true);

                    // Lọc rác nhỏ chỉ trong group vừa expand
                    if (chkCleanSpecks.value && expandedGroup) {
                        cleanTinySpecks(expandedGroup, 4);
                    }

                    // Ungroup
                    if (chkUngroup.value && expandedGroup) {
                        ungroupAll(expandedGroup);
                    }
                }

                processedCount++;
            }

            app.redraw();
            alert("Đã chuyển đổi thành công " + processedCount + " ảnh thành Vector!", "Hoàn tất");
        } catch (err) {
            alert("Có lỗi xảy ra trong quá trình xử lý:\n" + err.toString(), "Lỗi");
        }
    };

    // --- CÁC HÀM HỖ TRỢ ---
    function getTargetImages(isSelectionOnly) {
        var result = [];

        function collect(item) {
            if (!item) return;
            var tn = item.typename;
            if (tn === "RasterItem" || tn === "PlacedItem") {
                result.push(item);
            } else if (tn === "PluginItem" && item.tracing) {
                result.push(item);
            } else if (tn === "GroupItem") {
                for (var g = 0; g < item.pageItems.length; g++) {
                    collect(item.pageItems[g]);
                }
            }
        }

        if (isSelectionOnly) {
            var sel = doc.selection;
            if (sel && sel.length > 0) {
                for (var i = 0; i < sel.length; i++) {
                    collect(sel[i]);
                }
            }
        } else {
            for (var j = 0; j < doc.placedItems.length; j++) {
                result.push(doc.placedItems[j]);
            }
            for (var k = 0; k < doc.rasterItems.length; k++) {
                result.push(doc.rasterItems[k]);
            }
            for (var p = 0; p < doc.pluginItems.length; p++) {
                if (doc.pluginItems[p].tracing) {
                    result.push(doc.pluginItems[p]);
                }
            }
        }
        return result;
    }

    function configureTracing(opt, presetIndex, maxColors, ignoreWhite) {
        try {
            var presets = app.tracingPresetsList;
            var keyword = "";
            if (presetIndex === 0) keyword = "16";
            else if (presetIndex === 1) keyword = "16";
            else if (presetIndex === 2) keyword = "High";
            else if (presetIndex === 3) keyword = "Black";
            else if (presetIndex === 4) keyword = "Line";

            if (presets && presets.length > 0) {
                for (var p = 0; p < presets.length; p++) {
                    if (presets[p].indexOf(keyword) !== -1) {
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
            if (presetIndex !== 2 && presetIndex !== 3 && presetIndex !== 4) {
                opt.maxColors = maxColors;
            }
        } catch (eMaxColors) {}

        try {
            opt.ignoreWhite = ignoreWhite;
        } catch (eWhite) {}

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

    function ungroupAll(obj) {
        if (!obj || obj.typename !== "GroupItem") return;
        var parent = obj.parent;
        for (var i = obj.pageItems.length - 1; i >= 0; i--) {
            var item = obj.pageItems[i];
            item.move(parent, ElementPlacement.PLACEBEFORE);
            if (item.typename === "GroupItem") {
                ungroupAll(item);
            }
        }
    }

    function cleanTinySpecks(target, minArea) {
        if (!target) return;
        try {
            if (target.typename === "PathItem") {
                if (Math.abs(target.area) < minArea) {
                    target.remove();
                }
            } else if (target.typename === "GroupItem") {
                for (var i = target.pageItems.length - 1; i >= 0; i--) {
                    cleanTinySpecks(target.pageItems[i], minArea);
                }
            } else if (target.length) {
                for (var j = target.length - 1; j >= 0; j--) {
                    cleanTinySpecks(target[j], minArea);
                }
            }
        } catch (e) {}
    }

    win.center();
    win.show();
})();
