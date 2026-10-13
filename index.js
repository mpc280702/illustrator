var csInterface = null;
try {
  if (typeof CSInterface !== "undefined") {
    csInterface = new CSInterface();
  }
} catch (e) {
  console.warn("Chạy ngoài môi trường CEP", e);
}

const slider = document.getElementById("colorsSlider");
const colorVal = document.getElementById("colorVal");
const btnTrace = document.getElementById("btnTrace");
const statusEl = document.getElementById("status");
const presetSelect = document.getElementById("presetSelect");
const chkIgnoreWhite = document.getElementById("chkIgnoreWhite");
const chkAutoExpand = document.getElementById("chkAutoExpand");
const chkUngroup = document.getElementById("chkUngroup");
const chkCleanSpecks = document.getElementById("chkCleanSpecks");

slider.addEventListener("input", (e) => {
  colorVal.innerText = e.target.value;
});

presetSelect.addEventListener("change", (e) => {
  const val = e.target.value;
  if (val === "0" || val === "1") {
    slider.value = 16;
    colorVal.innerText = 16;
  } else if (val === "2") {
    slider.value = 64;
    colorVal.innerText = 64;
  }
});

btnTrace.addEventListener("click", () => {
  const scopeEl = document.querySelector('input[name="scope"]:checked');
  const scope = scopeEl ? scopeEl.value : "selection";

  const options = {
    scope: scope,
    presetIndex: presetSelect.value,
    maxColors: slider.value,
    ignoreWhite: chkIgnoreWhite.checked,
    autoExpand: chkAutoExpand.checked,
    ungroup: chkUngroup.checked,
    cleanSpecks: chkCleanSpecks.checked
  };

  statusEl.style.color = "#4dabf7";
  statusEl.innerText = "⏳ Đang xử lý chuyển đổi vector...";
  btnTrace.disabled = true;

  if (csInterface) {
    try {
      // Tự động load file jsx mới nhất để luôn cập nhật logic
      var extPath = csInterface.getSystemPath(SystemPath.EXTENSION).replace(/\\/g, "/");
      var loadScriptCmd = '$.evalFile("' + extPath + '/jsx/hostscript.jsx");';
      var jsonStr = JSON.stringify(options).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      var fullCmd = loadScriptCmd + " runVectorTraceFromPanel('" + jsonStr + "');";

      csInterface.evalScript(fullCmd, (res) => {
        btnTrace.disabled = false;
        try {
          var data = JSON.parse(res);
          if (data.success) {
            statusEl.style.color = "#51cf66";
            statusEl.innerText = "✅ " + data.message;
          } else {
            statusEl.style.color = "#ff6b6b";
            statusEl.innerText = "❌ " + data.message;
          }
        } catch (err) {
          statusEl.style.color = "#ff6b6b";
          statusEl.innerText = res || "Đã xảy ra lỗi!";
        }
      });
    } catch (errExec) {
      btnTrace.disabled = false;
      statusEl.style.color = "#ff6b6b";
      statusEl.innerText = "Lỗi thực thi: " + errExec.message;
    }
  } else {
    btnTrace.disabled = false;
    statusEl.style.color = "#ffa94d";
    statusEl.innerText = "Vui lòng mở panel trong Adobe Illustrator!";
  }
});
