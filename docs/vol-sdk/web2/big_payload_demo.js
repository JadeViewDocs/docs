// 自动示例：监听宿主推送的大 payload
// 依赖 JadeView 注入的 window.jade 运行时（jade.on）

(function () {
  if (!window.jade || typeof window.jade.on !== "function") {
    console.warn("[big_payload_demo] jade runtime not found");
    return;
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  window.jade.on("big-payload", (payload) => {
    try {
      let bytes = 0;
      if (typeof payload === "string") {
        bytes = new TextEncoder().encode(payload).length;
      } else {
        bytes = new TextEncoder().encode(JSON.stringify(payload)).length;
      }

      const human = formatBytes(bytes);
      const now = new Date().toLocaleTimeString();
      console.log("[big-payload] received, typeof=", typeof payload, "bytes=", bytes, `(${human})`);

      const status = document.getElementById("bigStatus");
      if (status) {
        status.textContent = `已接收: ${bytes} bytes (${human}) @ ${now}`;
      }
    } catch (e) {
      console.log("[big-payload] received (failed to measure)", e);
    }
  });
})();

