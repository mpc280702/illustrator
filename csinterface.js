/* Minimal CSInterface bridge: only APIs this panel uses. */
(function (global) {
  "use strict";
  global.SystemPath = global.SystemPath || {
    USER_DATA: "userData",
    COMMON_FILES: "commonFiles",
    MY_DOCUMENTS: "myDocuments",
    APPLICATION: "application",
    EXTENSION: "extension",
    HOST_APPLICATION: "hostApplication"
  };
  function CSInterface() {}
  CSInterface.prototype.getSystemPath = function (pathType) {
    if (!global.__adobe_cep__ || typeof global.__adobe_cep__.getSystemPath !== "function")
      throw new Error("CEP API không khả dụng.");
    return global.__adobe_cep__.getSystemPath(pathType);
  };
  CSInterface.prototype.evalScript = function (script, callback) {
    if (!global.__adobe_cep__ || typeof global.__adobe_cep__.evalScript !== "function") {
      if (callback) callback("EvalScript error.");
      return;
    }
    global.__adobe_cep__.evalScript(script, callback || function () {});
  };
  global.CSInterface = CSInterface;
})(window);