/* VectorTracer Pro CEP panel */
(function () {
  "use strict";
  var csInterface = null;
  try {
    if (typeof CSInterface !== "undefined") csInterface = new CSInterface();
  } catch (e) {}

  var slider = document.getElementById("colorsSlider");
  var colorVal = document.getElementById("colorVal");
  var btn = document.getElementById("btnTrace");
  var status = document.getElementById("status");
  var preset = document.getElementById("presetSelect");
  var ignoreWhite = document.getElementById("chkIgnoreWhite");
  var autoExpand = document.getElementById("chkAutoExpand");
  var ungroup = document.getElementById("chkUngroup");
  var clean = document.getElementById("chkCleanSpecks");

  function show(message, type) {
    status.className = "status-msg " + (type || "");
    status.textContent = message;
  }

  function busy(value) {
    btn.disabled = !!value;
    btn.textContent = value ? "Đang xử lý…" : "⚡ Chuyển thành Vector";
  }

  slider.addEventListener("input", function () {
    colorVal.textContent = slider.value;
  });

  preset.addEventListener("change", function () {
    if (preset.value === "0") slider.value = 6;
    else if (preset.value === "1") slider.value = 16;
    else if (preset.value === "2") slider.value = 64;
    colorVal.textContent = slider.value;
  });

  function escapeForSingleQuotedScript(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  btn.addEventListener("click", function () {
    if (!csInterface || typeof SystemPath === "undefined") {
      show("Không tìm thấy môi trường CEP. Hãy mở panel trong Illustrator, không chạy trang này trực tiếp trên trình duyệt.", "error");
      return;
    }

    var scopeEl = document.querySelector('input[name="scope"]:checked');
    var options = {
      scope: scopeEl ? scopeEl.value : "selection",
      presetIndex: parseInt(preset.value, 10),
      maxColors: parseInt(slider.value, 10),
      ignoreWhite: ignoreWhite.checked,
      autoExpand: autoExpand.checked,
      ungroup: ungroup.checked,
      cleanSpecks: clean.checked
    };

    var extPath;
    try {
      extPath = csInterface.getSystemPath(SystemPath.EXTENSION).replace(/\\/g, "/");
    } catch (e) {
      show("Không xác định được thư mục panel: " + e.message, "error");
      return;
    }

    var jsxPath = extPath + "/jsx/hostscript.jsx";
    var command = '$.evalFile("' + jsxPath.replace(/"/g, '\\"') + '");' +
      "runVectorTraceFromPanel('" + escapeForSingleQuotedScript(JSON.stringify(options)) + "');";

    busy(true);
    show("Đang xử lý ảnh trong Illustrator…", "working");

    try {
      csInterface.evalScript(command, function (result) {
        busy(false);
        if (!result || result === "EvalScript error.") {
          show("Illustrator không trả về kết quả. Kiểm tra việc cài panel CEP và file jsx/hostscript.jsx.", "error");
          return;
        }
        try {
          var data = JSON.parse(result);
          if (data.count > 0 && data.failed === 0 && data.warnings === 0) {
            show("✓ " + data.message, "success");
          } else if (data.count > 0) {
            show("⚠ " + data.message, "warning");
          } else {
            show("✕ " + data.message, "error");
          }
        } catch (parseError) {
          show("Không đọc được phản hồi của Illustrator: " + String(result), "error");
        }
      });
    } catch (e) {
      busy(false);
      show("Lỗi gọi Illustrator: " + e.message, "error");
    }
  });
})();
