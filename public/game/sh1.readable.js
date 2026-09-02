// ==UserScript==
// @name         上号器（还原版）
// @namespace    http://tampermonkey.net/
// @version      1
// @description  上号器 - 多账号BIN文件管理器（从混淆代码还原）
// @author       QVQ
// @match        *://*/*
// @grant
// ==/UserScript==

(function () {
  "use strict";

  // 只在登录页面执行
  if (!location.pathname.includes("/login/authuser")) {
    // 非登录页也要创建面板（原始脚本 match *://*/*）
  }

  // ==================== 工具函数 ====================

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function bytesToHex(bytes) {
    return Array.from(new Uint8Array(bytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function getCurrentBinId() {
    var params = new URLSearchParams(window.location.search);
    return params.get("bin_id") || params.get("id") || localStorage.getItem("current_bin_id");
  }

  function hexToBytes(hex) {
    const matches = hex.match(/.{1,2}/g);
    if (!matches) return new Uint8Array(0);
    return new Uint8Array(matches.map((b) => parseInt(b, 16)));
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  // ==================== BIN 文件存储 ====================

  function loadBinFileList() {
    try {
      const data = localStorage.getItem("bin_file_list");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveBinFileList(list) {
    localStorage.setItem("bin_file_list", JSON.stringify(list));
  }

  function saveBinData(id, uint8Array) {
    const hex = bytesToHex(uint8Array);
    localStorage.setItem("bin_data_" + id, hex);
  }

  function loadBinData(id) {
    const hex = localStorage.getItem("bin_data_" + id);
    if (!hex || hex.length < 2) return null;
    return hexToBytes(hex);
  }

  function deleteBinData(id) {
    localStorage.removeItem("bin_data_" + id);
  }

  // ==================== BON 解码器（内嵌） ====================

  var BonDecoder = (function () {
    function DataReader(bytes) {
      this._data = bytes || new Uint8Array(0);
      this._view = null;
      this.position = 0;
    }
    DataReader.prototype.validate = function (n) {
      return this.position + n <= this._data.length;
    };
    DataReader.prototype.getDataView = function () {
      if (!this._view) {
        this._view = new DataView(
          this._data.buffer,
          this._data.byteOffset,
          this._data.byteLength,
        );
      }
      return this._view;
    };
    DataReader.prototype.readUInt8 = function () {
      if (!this.validate(1)) return undefined;
      return this._data[this.position++];
    };
    DataReader.prototype.readInt16 = function () {
      if (!this.validate(2)) return undefined;
      var v = this._data[this.position++] | (this._data[this.position++] << 8);
      return (v << 16) >> 16;
    };
    DataReader.prototype.readInt32 = function () {
      if (!this.validate(4)) return undefined;
      var v =
        this._data[this.position++] |
        (this._data[this.position++] << 8) |
        (this._data[this.position++] << 16) |
        (this._data[this.position++] << 24);
      return v | 0;
    };
    DataReader.prototype.readInt64 = function () {
      var lo = this.readInt32();
      if (lo === undefined) return undefined;
      var _lo = lo;
      if (_lo < 0) _lo += 0x100000000;
      var hi = this.readInt32();
      if (hi === undefined) return undefined;
      return _lo + 0x100000000 * hi;
    };
    DataReader.prototype.readFloat32 = function () {
      if (!this.validate(4)) return undefined;
      var v = this.getDataView().getFloat32(this.position, true);
      this.position += 4;
      return v;
    };
    DataReader.prototype.readFloat64 = function () {
      if (!this.validate(8)) return undefined;
      var v = this.getDataView().getFloat64(this.position, true);
      this.position += 8;
      return v;
    };
    DataReader.prototype.read7BitInt = function () {
      var value = 0,
        shift = 0,
        b,
        count = 0;
      do {
        if (count++ === 35) throw new Error("Bad 7bit int");
        b = this.readUInt8();
        value |= (b & 0x7f) << shift;
        shift += 7;
      } while ((b & 0x80) !== 0);
      return value >>> 0;
    };
    DataReader.prototype.readUTF = function () {
      var len = this.read7BitInt();
      return this.readUTFBytes(len);
    };
    DataReader.prototype.readUTFBytes = function (length) {
      if (length === 0) return "";
      if (!this.validate(length)) return "";
      var str = new TextDecoder("utf8").decode(
        this._data.subarray(this.position, this.position + length),
      );
      this.position += length;
      return str;
    };
    DataReader.prototype.readUint8Array = function (length) {
      var out = this._data.subarray(this.position, this.position + length);
      this.position += length;
      return out;
    };

    function Decoder() {
      this.dr = null;
      this.strArr = [];
    }
    Decoder.prototype.reset = function (bytes) {
      this.dr = new DataReader(
        bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes),
      );
      this.strArr = [];
    };
    Decoder.prototype.decode = function () {
      var tag = this.dr.readUInt8();
      if (tag === undefined) return null;
      switch (tag) {
        case 0:
          return null;
        case 1:
          return this.dr.readInt32();
        case 2:
          return this.dr.readInt64();
        case 3:
          return this.dr.readFloat32();
        case 4:
          return this.dr.readFloat64();
        case 5: {
          var s = this.dr.readUTF();
          this.strArr.push(s);
          return s;
        }
        case 6:
          return this.dr.readUInt8() === 1;
        case 7: {
          var len = this.dr.read7BitInt();
          return this.dr.readUint8Array(len);
        }
        case 8: {
          var count = this.dr.read7BitInt();
          var obj = {};
          for (var i = 0; i < count; i++) {
            var k = this.decode();
            obj[k] = this.decode();
          }
          return obj;
        }
        case 9: {
          var len2 = this.dr.read7BitInt();
          var arr = [];
          for (var j = 0; j < len2; j++) arr.push(this.decode());
          return arr;
        }
        case 10:
          return new Date(this.dr.readInt64());
        case 99:
          return this.strArr[this.dr.read7BitInt()];
        default:
          return null;
      }
    };

    return {
      decode: function (bytes) {
        var dec = new Decoder();
        dec.reset(bytes);
        return dec.decode();
      },
    };
  })();

  // ==================== LZ4+XOR 解密（内嵌） ====================

  /**
   * 自动检测加密方式并解密：
   * - 'pl' (0x70 0x6c) = lx 方案: XOR + LZ4 解压
   * - 'px' (0x70 0x78) = x 方案: XOR + 去除 4 字节随机头
   */
  function decryptBin(data) {
    var e = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (e.length < 5) return e;

    // 检测加密标识
    if (e[0] === 0x70 && e[1] === 0x6c) {
      // lx 方案: 从 e[2],e[3] 提取 XOR key
      var t =
        (((e[2] >> 6) & 1) << 7) |
        (((e[2] >> 4) & 1) << 6) |
        (((e[2] >> 2) & 1) << 5) |
        ((e[2] & 1) << 4) |
        (((e[3] >> 6) & 1) << 3) |
        (((e[3] >> 4) & 1) << 2) |
        (((e[3] >> 2) & 1) << 1) |
        (e[3] & 1);
      for (var n = Math.min(100, e.length); --n >= 2; ) e[n] ^= t;
      // 还原 LZ4 magic header
      e[0] = 4;
      e[1] = 34;
      e[2] = 77;
      e[3] = 24;
      // LZ4 解压需要游戏内的 lz4 库
      if (
        typeof window.lz4 !== "undefined" &&
        typeof window.lz4.decompress === "function"
      ) {
        return window.lz4.decompress(e);
      }
      // 尝试通过游戏模块解压
      if (typeof window.__require === "function") {
        try {
          var codec = window.__require("13");
          if (codec && typeof codec.lz4XorDecode === "function") {
            return codec.lz4XorDecode(data);
          }
        } catch (err) {}
      }
      console.warn("[上号器] lx 方案需要 LZ4 库，尝试返回 XOR 解密后数据");
      return e;
    }

    if (e[0] === 0x70 && e[1] === 0x78) {
      // x 方案: 从 e[2],e[3] 提取 XOR key
      var t2 =
        (((e[2] >> 6) & 1) << 7) |
        (((e[2] >> 4) & 1) << 6) |
        (((e[2] >> 2) & 1) << 5) |
        ((e[2] & 1) << 4) |
        (((e[3] >> 6) & 1) << 3) |
        (((e[3] >> 4) & 1) << 2) |
        (((e[3] >> 2) & 1) << 1) |
        (e[3] & 1);
      for (var m = e.length; --m >= 4; ) e[m] ^= t2;
      // 去除前 4 字节随机头
      return e.subarray(4);
    }

    // 无加密标识，原样返回
    return e;
  }

  // ==================== 核心：登录注入 ====================

  /**
   * BIN 文件解码流程（来自原始字节码 + bonProtocol.js 参考）：
   * 1. decryptBin: XOR 解密 (+ 可选 LZ4 解压)
   * 2. BonDecoder.decode: BON 二进制反序列化为 JS 对象
   * 3. 得到 { platformExt, info, serverId, ... }
   */
  function injectLoginData(binData, binId) {
    localStorage.setItem("current_bin_id", binId);

    // 将 BIN 二进制转为 hex 存到全局（供后续 hook 使用）
    window.__binHex = Array.from(new Uint8Array(binData))
      .map(function (b) {
        return b.toString(16).padStart(2, "0");
      })
      .join("");
    window.__saveData = binData;
    window.__firstAuthDone = false;

    // 解码 BIN 数据
    var saveInfo = null;
    try {
      // 步骤1: XOR 解密 (+ LZ4 解压)
      var decrypted = decryptBin(new Uint8Array(binData));

      // 步骤2: BON 反序列化
      saveInfo = BonDecoder.decode(decrypted);

      if (!saveInfo || typeof saveInfo !== "object") {
        throw new Error("BON 解码结果不是有效对象");
      }

      console.log("[上号器] BIN 解码成功:", Object.keys(saveInfo));
    } catch (e) {
      // 降级: 尝试游戏内置模块
      console.warn("[上号器] 内置解码失败(" + e.message + ")，尝试游戏模块...");
      try {
        if (typeof window.__require === "function") {
          var codec = window.__require("13");
          if (codec && typeof codec.lz4XorDecode === "function") {
            var decoded = codec.lz4XorDecode(new Uint8Array(binData));
            if (
              decoded &&
              typeof codec.bon === "object" &&
              typeof codec.bon.decode === "function"
            ) {
              saveInfo = codec.bon.decode(decoded);
            } else {
              saveInfo = BonDecoder.decode(decoded);
            }
          }
        }
      } catch (e2) {
        console.error("[上号器] 游戏模块解码也失败:", e2.message);
      }

      // 最终降级: 尝试直接 JSON（极少数情况）
      if (!saveInfo) {
        try {
          saveInfo = JSON.parse(new TextDecoder().decode(binData));
        } catch (e3) {}
      }
    }

    if (!saveInfo || typeof saveInfo !== "object") {
      console.error("[上号器] BIN 解析失败: 无法解析为有效对象");
      showToast("BIN 解析失败: 数据格式无效", "error");
      return null;
    }

    window.__saveInfoData = saveInfo;

    var binList = loadBinFileList();
    var binItem = binList.find(function (i) {
      return i.id === binId;
    });
    var binName = binItem ? binItem.name : "";
    showToast("🔄 切换中：" + binName);

    // 延时注入（等待游戏模块加载完毕）
    setTimeout(function () {
      try {
        doInjectLogin(saveInfo, binId);
      } catch (e) {
        console.error("[上号器] 注入失败:", e.message);
        showToast("注入失败: " + e.message, "error");
      }
    }, 200);

    return saveInfo;
  }

  /**
   * 实际执行登录注入
   * 原始字节码 block 139 的还原：
   * - 获取 LoginService
   * - 调用 LoginService.mix({ platformExt, info, serverId })
   * - 或 hook authUser 方法
   */
  function doInjectLogin(saveInfo, binId) {
    if (typeof window.__require !== "function") {
      throw new Error("游戏 __require 未就绪，请等待游戏加载完成后重试");
    }

    // 获取登录模块
    var LoginService = null;
    try {
      var dataIndex = window.__require("data-index");
      LoginService = dataIndex && dataIndex.LoginService;
    } catch (e) {}

    if (!LoginService) {
      // 备选：通过 types-common 获取
      try {
        var typesCommon = window.__require("types-common");
        if (typesCommon && typesCommon.LoginManager) {
          LoginService = typesCommon.LoginManager;
        }
      } catch (e) {}
    }

    if (!LoginService) {
      throw new Error("LoginService 未找到，游戏可能尚未加载完成");
    }

    // 构造注入参数
    // BON 解码后 info 可能是对象，LoginService.mix 需要 stringify 后的字符串
    var platformExt = saveInfo.platformExt;
    var info = saveInfo.info;
    if (info !== undefined && typeof info !== "string") {
      info = JSON.stringify(info);
    }
    var serverId =
      saveInfo.serverId !== undefined ? String(saveInfo.serverId) : undefined;

    // 方式1：LoginService.mix 直接调用（原始 block 137/138 的逻辑）
    if (typeof LoginService.mix === "function") {
      var mixPayload = {};
      if (platformExt !== undefined) mixPayload.platformExt = platformExt;
      if (info !== undefined) mixPayload.info = info;
      if (serverId !== undefined) mixPayload.serverId = serverId;

      LoginService.mix(mixPayload);
      console.log("[上号器] LoginService.mix 调用成功");
    }

    // 方式2：Hook authUser（原始 block 139 的逻辑）
    if (LoginService.authUser) {
      var currentAuth = LoginService.authUser;
      var originalAuth =
        currentAuth && currentAuth.origAuth
          ? currentAuth.origAuth
          : currentAuth;

      if (typeof originalAuth === "function") {
        // 获取原始 serverList
        var origSL =
          currentAuth && currentAuth.serverList !== undefined
            ? currentAuth.serverList
            : LoginService.serverList;

        // 尝试重新编码 raw 数据
        var raw;
        try {
          var codec = window.__require("13");
          if (
            codec &&
            typeof codec.lz4XorEncode === "function" &&
            typeof codec.encrypt === "function"
          ) {
            var bytes = hexToBytes(window.__binHex);
            var dec = codec.lz4XorDecode(bytes);
            var plain = codec.decrypt ? codec.decrypt(dec) : dec;
            var enc = codec.lz4XorEncode(plain);
            raw = codec.encrypt ? codec.encrypt(enc) : enc;
          }
        } catch (e) {}

        function hookedAuthUser(loginRequest) {
          if (platformExt !== undefined) loginRequest.platformExt = platformExt;
          if (info !== undefined) loginRequest.info = info;
          if (serverId !== undefined) loginRequest.serverId = serverId;
          if (raw !== undefined) loginRequest._raw = raw;
          return originalAuth.call(LoginService, loginRequest);
        }

        hookedAuthUser.origAuth = originalAuth;
        hookedAuthUser.isSelfCreate = false;
        hookedAuthUser.serverList = origSL;
        hookedAuthUser.origSL = origSL;

        LoginService.authUser = hookedAuthUser;
        console.log("[上号器] authUser hook 安装成功");
      }
    }

    // 同样处理 serverList（如果 saveInfo 有 Isolate 信息）
    if (LoginService.serverList && saveInfo.Isolate) {
      const currentSL = LoginService.serverList;
      const origSL2 =
        currentSL && currentSL.origSL ? currentSL.origSL : currentSL;

      if (typeof origSL2 === "function") {
        function hookedServerList(req) {
          if (saveInfo.Isolate !== undefined) req.Isolate = saveInfo.Isolate;
          return origSL2.call(LoginService, req);
        }
        hookedServerList.origSL = origSL2;
        hookedServerList.OrigIso = saveInfo.Isolate;
        LoginService.serverList = hookedServerList;
      }
    }

    // 保存实际登录的 BIN ID
    localStorage.setItem("actual_login_bin_id", binId);

    showToast("✅ 登陆成功", "success");
    console.log("[上号器] 注入完成，binId:", binId);
  }

  // ==================== 触发重新登录 ====================

  function triggerRelogin() {
    try {
      if (typeof window.__require !== "function") {
        location.reload();
        return;
      }

      // 尝试通过游戏状态机切换
      let Game = null;
      try {
        Game = window.__require("Game");
      } catch (e) {}

      let GameState = null;
      try {
        const typesCommon = window.__require("types-common");
        if (typesCommon) {
          GameState = typesCommon.GameState;
        }
      } catch (e) {}

      if (GameState && GameState.instance && GameState.instance.stateMachine) {
        GameState.instance.stateMachine.$isManualSwitchRole = true;
        GameState.instance.stateMachine.transition("SwitchRole");
        console.log("[上号器] 触发 SwitchRole 切换");
      } else {
        // 降级：直接 reload
        location.reload();
      }
    } catch (e) {
      console.warn("[上号器] triggerRelogin 失败，直接 reload:", e.message);
      location.reload();
    }
  }

  // ==================== 拦截式注入（解决首屏时序竞争） ====================

  /**
   * 原始做法是 3s 轮询，太慢。
   * 修复方案：劫持 window.__require，在模块被游戏首次访问时立即 hook。
   * 这样不需要轮询，游戏一加载模块我们就能拦截。
   */
  function installRequireIntercept() {
    // 如果没有选中的 BIN，不需要拦截
    var currentId = getCurrentBinId();
    if (!currentId) return;
    var binData = loadBinData(currentId);
    if (!binData) return;

    var injected = false;

    function tryInject() {
      if (injected) return;
      injected = true;
      console.log("[上号器] 模块就绪，自动注入 binId:", currentId);
      injectLoginData(binData, currentId);
    }

    // 拦截方式：替换 __require，在游戏调用时偷看返回值
    if (typeof window.__require === "function") {
      var origRequire = window.__require;
      window.__require = function () {
        var result = origRequire.apply(this, arguments);
        // 当游戏加载 data-index 模块时，立刻注入
        if (!injected && result && result.LoginService) {
          // 在微任务中注入，避免在 require 调用中途修改模块
          Promise.resolve().then(tryInject);
        }
        return result;
      };
      // 保留原始引用
      window.__require.__orig = origRequire;

      // 如果 require 已经就绪且 data-index 已可访问，立即尝试
      try {
        var di = origRequire("data-index");
        if (di && di.LoginService) {
          Promise.resolve().then(tryInject);
        }
      } catch (e) {}
    }

    // 兜底：快速轮询（500ms 间隔，最多 20 次 = 10秒）
    var fallbackCount = 0;
    var fallbackInterval = setInterval(function () {
      if (injected || fallbackCount++ > 20) {
        clearInterval(fallbackInterval);
        return;
      }
      if (typeof window.__require !== "function") return;
      try {
        var dataIndex = window.__require("data-index");
        if (dataIndex && dataIndex.LoginService) {
          tryInject();
          clearInterval(fallbackInterval);
        }
      } catch (e) {}
    }, 500);
  }

  // ==================== UI ====================

  function showToast(msg, type, duration) {
    type = type || "info";
    duration = duration || 2000;
    let existing = document.getElementById("__binToast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "__binToast";
    toast.textContent = msg;
    toast.style.cssText =
      "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);" +
      "background:rgba(0,0,0,0.75);color:#fff;padding:10px 24px;border-radius:8px;" +
      "font-size:14px;z-index:9999999;pointer-events:none;transition:opacity 0.3s;";
    if (type === "error") toast.style.background = "rgba(211,47,47,0.9)";
    if (type === "success") toast.style.background = "rgba(76,175,80,0.9)";
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = "0";
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, duration);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  // ==================== 面板 ====================

  function createPanel() {
    // 注入样式
    const style = document.createElement("style");
    style.type = "text/css";
    style.textContent = `
      #binTool {
        position: fixed; left: 20px; top: 20px; z-index: 999999;
        background: #fff; color: #333; padding: 12px; border-radius: 12px;
        box-shadow: 0 0 12px rgba(0,0,0,0.12); width: 320px; max-height: 80vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        border: 1px solid #e8e8e8; transition: all 0.2s ease; box-sizing: border-box;
        user-select: none; touch-action: none; overflow: hidden;
        display: flex; flex-direction: column;
      }
      #binTool.minimized {
        width:44px!important; height:44px!important; padding:0!important;
        border-radius:50%!important; opacity:0.8!important; cursor:move;
        overflow:hidden!important;
      }
      #binTool.minimized .title, #binTool.minimized .content,
      #binTool.minimized .author-info { display:none!important; }
      #binTool.minimized::after {
        content:"\ud83d\udce6"; font-size:20px; display:flex; align-items:center;
        justify-content:center; width:100%; height:100%;
      }
      #binTool .title {
        font-size:15px; font-weight:bold; margin-bottom:10px; display:flex;
        justify-content:space-between; align-items:center; padding-bottom:6px;
        border-bottom:1px solid #f0f0f0; cursor:move;
      }
      #binTool .content { overflow-y:auto; flex:1; }
      .binItem {
        padding:8px 10px; border-bottom:1px solid #f0f0f0; cursor:pointer;
        display:flex; justify-content:space-between; align-items:center;
        font-size:12px; transition:background 0.15s; gap:6px;
      }
      .binItem:hover { background:#f5f5f5; }
      .binItem.active { background:#e6f7ff; border-left:3px solid #4a90d9; }
      .binItemName { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .binItemInfo { color:#999; font-size:11px; margin-left:6px; white-space:nowrap; }
      .binItemToggle,.binItemEdit,.binItemDelete {
        width:22px; height:22px; border-radius:3px; border:none; color:#fff;
        font-size:12px; display:flex; align-items:center; justify-content:center;
        cursor:pointer; margin-left:3px;
      }
      .binItemToggle { background:#4a90d9; }
      .binItemEdit { background:#52c41a; }
      .binItemDelete { background:#ff4d4f; }
      #binTool button { background:#4a90d9; color:#fff; border:none; padding:7px 12px;
        border-radius:6px; cursor:pointer; margin-right:6px; font-size:13px; }
      #binTool #clearBtn { background:#ff6b6b; }
      #binStatus { margin-top:10px; font-size:12px; color:#666; }
      #binStatus.success { color:#52c41a; }
      #binStatus.error { color:#ff4d4f; }
      #currentLoginInfo { margin-top:10px; padding:8px; background:#fafafa;
        border:1px solid #e8e8e8; border-radius:6px; font-size:12px; }
      #currentLoginInfo.empty { color:#bbb; text-align:center; }
      .author-info { font-size:11px; color:#999; text-align:center;
        margin-top:8px; padding-top:6px; border-top:1px solid #f0f0f0; }
      #refreshBtn, #minimizeBtn {
        background:#f5f5f5; border:1px solid #e0e0e0; color:#666;
        width:26px; height:26px; border-radius:4px; cursor:pointer;
        display:flex; align-items:center; justify-content:center; font-size:16px;
      }
    `;
    document.head.appendChild(style);

    const panel = document.createElement("div");
    panel.id = "binTool";
    panel.innerHTML = `
      <div class="title">
        <span>\uD83D\uDCE6 上号器</span>
        <div style="display:flex;align-items:center;gap:6px;">
          <button id="refreshBtn" title="刷新网页">↻</button>
          <button id="minimizeBtn" title="缩小">∧</button>
        </div>
      </div>
      <div class="content">
        <button id="loadBtn">导入 BIN 文件</button>
        <button id="clearBtn">清空 BIN</button>
        <div id="binStatus">未加载 BIN 文件</div>
        <div id="currentLoginInfo" class="empty">未选择登录BIN</div>
        <div id="binList"></div>
      </div>
      <div class="author-info">免费脚本禁止售卖</div>
    `;
    document.documentElement.appendChild(panel);

    // 获取 DOM 引用
    const binListEl = document.getElementById("binList");
    const binStatusEl = document.getElementById("binStatus");
    const currentLoginInfoEl = document.getElementById("currentLoginInfo");
    const loadBtn = document.getElementById("loadBtn");
    const clearBtn = document.getElementById("clearBtn");
    const refreshBtn = document.getElementById("refreshBtn");
    const minimizeBtn = document.getElementById("minimizeBtn");

    // ===== 渲染列表 =====
    function renderBinList() {
      const list = loadBinFileList();
      list.sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
      });

      const currentId = getCurrentBinId();

      if (list.length === 0) {
        binListEl.innerHTML = "";
        binListEl.style.display = "none";
        currentLoginInfoEl.className = "empty";
        currentLoginInfoEl.innerHTML = "未选择登录BIN";
        return;
      }

      binListEl.style.display = "block";
      binListEl.innerHTML = "";

      list.forEach(function (item) {
        const isActive = item.id === currentId;
        const el = document.createElement("div");
        el.className = "binItem" + (isActive ? " active" : "");
        el.innerHTML =
          '<div class="binItemName">' +
          escapeHtml(item.name) +
          "</div>" +
          '<div class="binItemInfo">' +
          (item.size || formatSize(item.byteLength || 0)) +
          "</div>" +
          '<button class="binItemToggle" data-id="' +
          item.id +
          '" title="切换登录">⟳</button>' +
          '<button class="binItemEdit" data-id="' +
          item.id +
          '">✎</button>' +
          '<button class="binItemDelete" data-id="' +
          item.id +
          '">×</button>';

        // 切换按钮
        el.querySelector(".binItemToggle").onclick = function (e) {
          e.stopPropagation();
          selectAndInject(item.id);
        };
        // 编辑按钮
        el.querySelector(".binItemEdit").onclick = function (e) {
          e.stopPropagation();
          var newName = prompt("重命名 BIN", item.name);
          if (newName && newName.trim()) {
            renameBinFile(item.id, newName.trim());
            showToast("✅ 已重命名：" + newName.trim(), "success");
            renderBinList();
          }
        };
        // 删除按钮
        el.querySelector(".binItemDelete").onclick = function (e) {
          e.stopPropagation();
          if (confirm("确定删除「" + item.name + "」吗？")) {
            removeBinFile(item.id);
            showToast("✅ 已清除 BIN", "success");
            renderBinList();
          }
        };

        binListEl.appendChild(el);
      });

      // 更新当前登录信息
      if (currentId) {
        const current = list.find(function (i) {
          return i.id === currentId;
        });
        if (current) {
          currentLoginInfoEl.className = "";
          currentLoginInfoEl.innerHTML =
            '<div class="label">\uD83D\uDCBF 当前登录BIN：</div>' +
            '<div class="binName">' +
            escapeHtml(current.name) +
            "</div>";
        }
      } else {
        currentLoginInfoEl.className = "empty";
        currentLoginInfoEl.innerHTML = "未选择登录BIN";
      }
    }

    // ===== 选中并注入 =====
    function selectAndInject(id) {
      const list = loadBinFileList();
      const item = list.find(function (i) {
        return i.id === id;
      });
      if (!item) return;

      localStorage.setItem("current_bin_id", id);

      const data = loadBinData(id);
      if (!data) {
        showToast("BIN 数据加载失败", "error");
        return;
      }

      const result = injectLoginData(data, id);
      renderBinList();

      if (result) {
        setTimeout(function () {
          triggerRelogin();
        }, 500);
      }
    }

    // ===== 导入 =====
    loadBtn.onclick = function () {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".bin";
      fileInput.multiple = true;
      fileInput.onchange = function () {
        const files = Array.from(this.files);
        if (files.length === 0) return;

        showToast("正在导入 " + files.length + " 个文件...");

        let processed = 0;
        files.forEach(function (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const uint8 = new Uint8Array(e.target.result);
            const list = loadBinFileList();

            // 检查重复（按大小简单判断）
            const exists = list.find(function (item) {
              return item.byteLength === uint8.byteLength;
            });

            let id;
            if (exists) {
              id = exists.id;
            } else {
              id = generateId();
              const newItem = {
                id: id,
                name: file.name,
                byteLength: uint8.byteLength,
                size: formatSize(uint8.byteLength),
                order: list.length,
              };
              saveBinData(id, uint8);
              list.push(newItem);
              saveBinFileList(list);
            }

            processed++;
            if (processed === files.length) {
              // 自动选中第一个
              localStorage.setItem("current_bin_id", id);

              // 设置全局变量
              const binBytes = loadBinData(id);
              if (binBytes) {
                window.__binHex = Array.from(binBytes)
                  .map(function (b) {
                    return b.toString(16).padStart(2, "0");
                  })
                  .join("");
                window.__saveData = binBytes;
                window.__firstAuthDone = false;

                // 尝试立即解码
                try {
                  const text = new TextDecoder().decode(binBytes);
                  window.__saveInfoData = JSON.parse(text);
                } catch (e) {
                  // 需要游戏模块解码，等待 injectWatch
                }
              }

              showToast("✅ 已加载：" + file.name, "success");
              binStatusEl.textContent = "✅ 已加载 " + processed + " 个文件";
              binStatusEl.className = "success";
              renderBinList();

              // 启动拦截式注入
              installRequireIntercept();
            }
          };
          reader.onerror = function () {
            processed++;
          };
          reader.readAsArrayBuffer(file);
        });
      };
      fileInput.click();
    };

    // ===== 清空 =====
    clearBtn.onclick = function () {
      if (!confirm("确定清空所有BIN吗？")) return;

      const list = loadBinFileList();
      list.forEach(function (item) {
        deleteBinData(item.id);
      });
      localStorage.removeItem("bin_file_list");
      localStorage.removeItem("current_bin_id");

      window.__binHex = undefined;
      window.__saveData = undefined;
      window.__saveInfoData = undefined;

      showToast("✅ 已清空", "success");
      binStatusEl.textContent = "未加载 BIN 文件";
      binStatusEl.className = "";
      renderBinList();
    };

    // ===== 刷新 =====
    refreshBtn.onclick = function () {
      location.reload();
    };

    // ===== 最小化 =====
    minimizeBtn.onclick = function (e) {
      e.stopPropagation();
      panel.classList.toggle("minimized");
    };

    // ===== 拖拽 =====
    setupDrag(panel);

    // ===== 初始渲染 =====
    renderBinList();

    // 如果已有选中的 BIN，启动自动注入检测
    const savedId = getCurrentBinId();
    if (savedId) {
      const savedData = loadBinData(savedId);
      if (savedData) {
        binStatusEl.textContent = "✅ 已加载";
        binStatusEl.className = "success";
        window.__binHex = Array.from(savedData)
          .map(function (b) {
            return b.toString(16).padStart(2, "0");
          })
          .join("");
        window.__saveData = savedData;
        window.__firstAuthDone = false;
        installRequireIntercept();
      }
    }
  }

  // ==================== BIN 管理辅助 ====================

  function removeBinFile(id) {
    deleteBinData(id);
    const list = loadBinFileList().filter(function (item) {
      return item.id !== id;
    });
    saveBinFileList(list);
    if (localStorage.getItem("current_bin_id") === id) {
      localStorage.removeItem("current_bin_id");
    }
  }

  function renameBinFile(id, newName) {
    const list = loadBinFileList();
    const item = list.find(function (i) {
      return i.id === id;
    });
    if (item) {
      item.name = newName;
      saveBinFileList(list);
    }
  }

  // ==================== 拖拽 ====================

  function setupDrag(element) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    try {
      const pos = JSON.parse(localStorage.getItem("bin_tool_position"));
      if (pos && pos.left !== undefined && pos.top !== undefined) {
        element.style.left = pos.left + "px";
        element.style.top = pos.top + "px";
      }
    } catch (e) {}

    function savePosition() {
      const rect = element.getBoundingClientRect();
      localStorage.setItem(
        "bin_tool_position",
        JSON.stringify({
          left: rect.left,
          top: rect.top,
        }),
      );
    }

    element.addEventListener("mousedown", function (e) {
      if (e.target.closest("button")) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = element.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      e.preventDefault();
    });

    document.addEventListener("mousemove", function (e) {
      if (!isDragging) return;
      element.style.left =
        Math.max(
          0,
          Math.min(
            window.innerWidth - element.offsetWidth,
            startLeft + e.clientX - startX,
          ),
        ) + "px";
      element.style.top =
        Math.max(
          0,
          Math.min(
            window.innerHeight - element.offsetHeight,
            startTop + e.clientY - startY,
          ),
        ) + "px";
    });

    document.addEventListener("mouseup", function () {
      if (isDragging) {
        isDragging = false;
        savePosition();
      }
    });

    element.addEventListener(
      "touchstart",
      function (e) {
        if (e.target.closest("button")) return;
        if (e.touches.length === 1) {
          isDragging = true;
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          const rect = element.getBoundingClientRect();
          startLeft = rect.left;
          startTop = rect.top;
        }
      },
      { passive: true },
    );

    document.addEventListener(
      "touchmove",
      function (e) {
        if (!isDragging || e.touches.length !== 1) return;
        element.style.left =
          Math.max(
            0,
            Math.min(
              window.innerWidth - element.offsetWidth,
              startLeft + e.touches[0].clientX - startX,
            ),
          ) + "px";
        element.style.top =
          Math.max(
            0,
            Math.min(
              window.innerHeight - element.offsetHeight,
              startTop + e.touches[0].clientY - startY,
            ),
          ) + "px";
      },
      { passive: true },
    );

    document.addEventListener("touchend", function () {
      if (isDragging) {
        isDragging = false;
        savePosition();
      }
    });
  }

  // ==================== 启动 ====================

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    createPanel();
  } else {
    document.addEventListener("DOMContentLoaded", createPanel);
  }
})();
