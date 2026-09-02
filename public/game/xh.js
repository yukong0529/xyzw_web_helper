// ==UserScript==
// @name         雪花
// @namespace    http://tampermonkey.net/
// @version      2.3.0
// @description  内置进原生浏览器的网页提供导入脚本功能
// @author       远星
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_addStyle
// @grant        GM_addElement
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        GM_log
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        GM_openInTab
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_download
// @grant        GM_getTab
// @grant        GM_saveTab
// @grant        GM_getTabs
// @grant        GM_cookie
// @grant        GM_webRequest
// @grant        GM_info
// @grant        unsafeWindow
// @grant        window.close
// @grant        window.focus
// @grant        window.onurlchange
// @connect      *
// @run-at       document-end
// @noframes     false
// @sandbox      raw
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 【极致模拟版 v2.3】Tampermonkey 运行时环境 ====================
    // 完整模拟 Tampermonkey/篡改猴 运行时环境，提供与真实油猴一样的 API 体验
    // 注意：由于浏览器安全限制，部分功能（如绝对跨域）需要服务器CORS支持
    (function initGMAPIMock() {
      const SCRIPT_HANDLER = '雪花';
      const VERSION = '2.3.0';
      
      console.log(`%c[${SCRIPT_HANDLER} v${VERSION}] %c初始化中...`, 
        'color: #4CAF50; font-weight: bold;', 'color: inherit;');
      
      // ========== 环境检测 ==========
      const ENV = {
        // 检测是否为真实油猴环境
        isTampermonkey: typeof GM_info !== 'undefined' && GM_info.scriptHandler === 'Tampermonkey',
        isViolentmonkey: typeof GM_info !== 'undefined' && GM_info.scriptHandler === 'Violentmonkey',
        isGreasemonkey: typeof GM_info !== 'undefined' && GM_info.scriptHandler === 'Greasemonkey',
        isScriptCat: typeof GM_info !== 'undefined' && GM_info.scriptHandler === 'ScriptCat',
        // 检测是否有原生跨域能力
        hasNativeGMXHR: typeof GM_xmlhttpRequest === 'function',
        // 检测新版GM API
        hasGMObject: typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function',
        // 当前页面信息
        currentUrl: location.href,
        currentOrigin: location.origin,
        isSecureContext: window.isSecureContext,
        // 浏览器信息
        userAgent: navigator.userAgent,
        isChrome: /Chrome/.test(navigator.userAgent) && !/Edge|Edg/.test(navigator.userAgent),
        isFirefox: /Firefox/.test(navigator.userAgent),
        isEdge: /Edge|Edg/.test(navigator.userAgent),
        isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
      };
      
      ENV.isRealUserscriptEnv = ENV.isTampermonkey || ENV.isViolentmonkey || ENV.isGreasemonkey || ENV.isScriptCat;
      
      // 如果已经在真实油猴环境中，跳过模拟
      if (ENV.isRealUserscriptEnv) {
        console.log(`%c[${SCRIPT_HANDLER}] %c检测到真实油猴环境: ${GM_info.scriptHandler}`, 
          'color: #4CAF50; font-weight: bold;', 'color: #2196F3;');
        console.log(`%c[${SCRIPT_HANDLER}] %c使用原生API，跳过模拟`, 
          'color: #4CAF50; font-weight: bold;', 'color: inherit;');
        return;
      }
      
      console.log(`%c[${SCRIPT_HANDLER}] %c未检测到真实油猴环境，启用完整模拟`, 
        'color: #4CAF50; font-weight: bold;', 'color: #FF9800;');
      
      // ========== 增强 unsafeWindow ==========
      if (typeof unsafeWindow === 'undefined') {
        try {
          // 尝试获取真实的window对象（Firefox风格）
          const realWindow = window.wrappedJSObject || window;
          window.unsafeWindow = realWindow;
        } catch (e) {
          window.unsafeWindow = window;
        }
      }
      
      // ========== 全局内部存储（模拟Tampermonkey内部状态） ==========
      const __GM_STORAGE__ = {
        valueChangeListeners: new Map(),
        listenerIdCounter: 0,
        tabData: {},
        tabs: new Map(),
        resources: new Map(),
        webRequestRules: [],
        requireCache: new Map(),
        menuCommands: new Map(),
        menuCommandIdCounter: 0,
        scriptRunId: 'run_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        crossTabChannel: null
      };
      
      // ========== 跨标签页通信（模拟Tampermonkey的跨标签页功能） ==========
      try {
        __GM_STORAGE__.crossTabChannel = new BroadcastChannel('GM_CROSS_TAB_CHANNEL');
        __GM_STORAGE__.crossTabChannel.onmessage = function(event) {
          const { type, key, newValue, remote } = event.data || {};
          if (type === 'valueChange' && remote) {
            // 触发本地监听器
            __GM_STORAGE__.valueChangeListeners.forEach((listener) => {
              if (listener.key === key) {
                try {
                  listener.callback(key, undefined, newValue, true);
                } catch (e) {}
              }
            });
          }
        };
      } catch (e) {
        // BroadcastChannel不可用
      }
      
      // ========== 基础存储 API ==========
      if (typeof GM_getValue === 'undefined' || typeof GM_setValue === 'undefined') {
        console.log('[GM API 模拟]: 检测到 GM_getValue/GM_setValue 不存在，启用 localStorage 模拟');
        
        window.GM_getValue = function(key, defaultValue) {
          try {
            const value = localStorage.getItem('GM_' + key);
            if (value === null) return defaultValue;
            try {
              return JSON.parse(value);
            } catch (e) {
              return value;
            }
          } catch (error) {
            console.warn('[GM API 模拟]: GM_getValue 失败', error);
            return defaultValue;
          }
        };
        
        window.GM_setValue = function(key, value) {
          try {
            const oldValue = GM_getValue(key);
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem('GM_' + key, stringValue);
            
            // 触发值变化监听器
            __GM_STORAGE__.valueChangeListeners.forEach((listener, id) => {
              if (listener.key === key) {
                try {
                  listener.callback(key, oldValue, value, false);
                } catch (e) {
                  console.warn('[GM_setValue]: 监听器回调错误', e);
                }
              }
            });
            
            return true;
          } catch (error) {
            console.warn('[GM API 模拟]: GM_setValue 失败', error);
            return false;
          }
        };
      } else {
        console.log('[GM API 模拟]: GM_getValue/GM_setValue 已存在，使用原生实现');
      }
      
      // ========== GM_addValueChangeListener / GM_removeValueChangeListener ==========
      if (typeof GM_addValueChangeListener === 'undefined') {
        window.GM_addValueChangeListener = function(key, callback) {
          const listenerId = ++__GM_STORAGE__.listenerIdCounter;
          __GM_STORAGE__.valueChangeListeners.set(listenerId, { key, callback });
          console.log('[GM_addValueChangeListener]: 添加监听器', key, 'ID:', listenerId);
          return listenerId;
        };
        console.log('[GM API 模拟]: GM_addValueChangeListener 已创建');
      }
      
      if (typeof GM_removeValueChangeListener === 'undefined') {
        window.GM_removeValueChangeListener = function(listenerId) {
          const deleted = __GM_STORAGE__.valueChangeListeners.delete(listenerId);
          console.log('[GM_removeValueChangeListener]: 移除监听器', listenerId, deleted ? '成功' : '不存在');
          return deleted;
        };
        console.log('[GM API 模拟]: GM_removeValueChangeListener 已创建');
      }
      
      // ========== GM_info 对象 (完全模拟Tampermonkey结构) ==========
      if (typeof GM_info === 'undefined') {
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        
        window.GM_info = {
          // 脚本信息 - 完全模拟Tampermonkey结构
          script: {
            // 基本信息
            name: SCRIPT_HANDLER,
            namespace: 'http://tampermonkey.net/',
            description: '完整模拟Tampermonkey运行时环境，支持跨域请求',
            version: VERSION,
            author: 'Toolbox Enhanced',
            homepage: '',
            homepageURL: '',
            website: '',
            source: '',
            icon: '',
            icon64: '',
            updateURL: '',
            downloadURL: '',
            supportURL: '',
            
            // 匹配规则
            includes: [],
            matches: ['*://*/*'],
            excludes: [],
            excludeMatches: [],
            
            // 权限
            grant: [
              'GM_getValue', 'GM_setValue', 'GM_deleteValue', 'GM_listValues',
              'GM_addValueChangeListener', 'GM_removeValueChangeListener',
              'GM_addStyle', 'GM_addElement', 'GM_xmlhttpRequest', 'GM.xmlHttpRequest',
              'GM_notification', 'GM_setClipboard', 'GM_openInTab', 'GM_getResourceText',
              'GM_getResourceURL', 'GM_registerMenuCommand', 'GM_unregisterMenuCommand',
              'GM_download', 'GM_getTab', 'GM_saveTab', 'GM_getTabs', 'GM_cookie',
              'GM_webRequest', 'GM_info', 'unsafeWindow', 'window.close', 'window.focus'
            ],
            
            // 连接域
            connect: ['*'],
            
            // 资源
            resources: [],
            
            // 执行配置
            runAt: 'document-end',
            noframes: false,
            unwrap: false,
            
            // 内部属性
            uuid: uuid,
            antifeatures: {},
            options: {
              awareOfChrome: true,
              compat_metadata: false,
              compat_foreach: false,
              compat_powerful_this: false,
              compat_prototypes: false,
              compat_wrappedjsobject: false,
              run_at: 'document-end',
              noframes: false,
              check_for_updates: true
            },
            
            // 依赖
            require: [],
            position: 1
          },
          
          // 脚本元数据字符串
          scriptMetaStr: `// ==UserScript==\n// @name ${SCRIPT_HANDLER}\n// @version ${VERSION}\n// ==/UserScript==`,
          
          // 脚本管理器信息
          scriptHandler: SCRIPT_HANDLER,
          version: VERSION,
          
          // Tampermonkey特有属性
          scriptWillUpdate: false,
          isIncognito: false,
          isFirstPartyIsolation: false,
          
          // 下载模式
          downloadMode: 'browser',
          
          // 执行上下文
          injectInto: 'page',
          
          // 平台信息 - 完全模拟Tampermonkey
          platform: {
            arch: navigator.userAgent.includes('x64') || navigator.userAgent.includes('Win64') ? 'x86-64' : 'x86-32',
            browserName: ENV.isChrome ? 'Chrome' : 
                         ENV.isFirefox ? 'Firefox' : 
                         ENV.isEdge ? 'Edge' : 
                         ENV.isSafari ? 'Safari' : 'Unknown',
            browserVersion: (navigator.userAgent.match(/(?:Chrome|Firefox|Edge|Safari)\/([\d.]+)/) || [])[1] || 'Unknown',
            os: navigator.platform.includes('Win') ? 'Windows' : 
                navigator.platform.includes('Mac') ? 'MacOS' : 
                navigator.platform.includes('Linux') ? 'Linux' : 
                navigator.platform.includes('Android') ? 'Android' : 
                navigator.platform.includes('iPhone') || navigator.platform.includes('iPad') ? 'iOS' : 'Unknown'
          },
          
          // 子资源信息
          script: null // 将在下面填充
        };
        
        // 确保script引用正确
        window.GM_info.script = window.GM_info.script || GM_info.script;
        
        console.log(`%c[${SCRIPT_HANDLER}] %cGM_info 创建完成 (完整Tampermonkey结构)`, 
          'color: #4CAF50; font-weight: bold;', 'color: inherit;');
      } else {
        console.log(`%c[${SCRIPT_HANDLER}] %cGM_info 已存在，使用原生实现`, 
          'color: #4CAF50; font-weight: bold;', 'color: inherit;');
      }
      
      // ========== GM_addStyle (增强版：自动标记脚本ID) ==========
      if (typeof GM_addStyle === 'undefined') {
        window.GM_addStyle = function(css) {
          var style = document.createElement('style');
          style.type = 'text/css';
          style.textContent = css;
          
          // 自动标记当前执行的脚本ID（如果有）
          if (window.__CURRENT_SCRIPT_ID__) {
            style.setAttribute('data-hjm-owner', window.__CURRENT_SCRIPT_ID__);
          }
          
          (document.head || document.documentElement).appendChild(style);
          return style;
        };
        console.log('[GM API 模拟]: GM_addStyle 已创建 (支持脚本追踪)');
      }
      
      // ========== GM_addElement (增强版：自动标记脚本ID) ==========
      if (typeof GM_addElement === 'undefined') {
        window.GM_addElement = function(parentNode, tagName, attributes) {
          // 处理参数重载
          if (typeof parentNode === 'string') {
            attributes = tagName;
            tagName = parentNode;
            parentNode = document.head;
          }
          
          const element = document.createElement(tagName);
          
          // 自动标记当前执行的脚本ID（如果有）
          if (window.__CURRENT_SCRIPT_ID__) {
            element.setAttribute('data-hjm-owner', window.__CURRENT_SCRIPT_ID__);
          }
          
          if (attributes) {
            for (const [key, value] of Object.entries(attributes)) {
              if (key === 'textContent') {
                element.textContent = value;
              } else if (key === 'innerHTML') {
                element.innerHTML = value;
              } else {
                element.setAttribute(key, value);
              }
            }
          }
          
          parentNode.appendChild(element);
          return element;
        };
        console.log('[GM API 模拟]: GM_addElement 已创建 (支持脚本追踪)');
      }
      
      // ========== GM_deleteValue ==========
      if (typeof GM_deleteValue === 'undefined') {
        window.GM_deleteValue = function(key) {
          try {
            localStorage.removeItem('GM_' + key);
            return true;
          } catch (error) {
            console.warn('[GM API 模拟]: GM_deleteValue 错误', error);
            return false;
          }
        };
        console.log('[GM API 模拟]: GM_deleteValue 已创建');
      }
      
      // ========== GM_listValues ==========
      if (typeof GM_listValues === 'undefined') {
        window.GM_listValues = function() {
          try {
            var keys = [];
            for (var i = 0; i < localStorage.length; i++) {
              var key = localStorage.key(i);
              if (key && key.startsWith('GM_')) {
                keys.push(key.substring(3));
              }
            }
            return keys;
          } catch (error) {
            console.warn('[GM API 模拟]: GM_listValues 错误', error);
            return [];
          }
        };
        console.log('[GM API 模拟]: GM_listValues 已创建');
      }
      
      // ========== GM_log ==========
      if (typeof GM_log === 'undefined') {
        window.GM_log = function() {
          console.log.apply(console, ['[GM_log]:'].concat(Array.prototype.slice.call(arguments)));
        };
        console.log('[GM API 模拟]: GM_log 已创建');
      }
      
      // ========== GM_notification ==========
      if (typeof GM_notification === 'undefined') {
        window.GM_notification = function(details) {
          // 尝试使用浏览器通知API
          if ('Notification' in window) {
            if (Notification.permission === 'granted') {
              const notification = new Notification(details.title || '通知', {
                body: details.text || details.body || '',
                icon: details.image || details.icon,
                tag: details.tag,
                requireInteraction: details.timeout === 0
              });
              
              if (details.onclick) notification.onclick = details.onclick;
              if (details.timeout && details.timeout > 0) {
                setTimeout(() => notification.close(), details.timeout);
              }
              return notification;
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  GM_notification(details);
                }
              });
            }
          }
          console.log('[GM_notification]:', details.title, details.text || details.body);
        };
        console.log('[GM API 模拟]: GM_notification 已创建');
      }
      
      // ========== GM_setClipboard ==========
      if (typeof GM_setClipboard === 'undefined') {
        window.GM_setClipboard = function(data, type) {
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(data).then(() => {
                console.log('[GM_setClipboard]: 复制成功');
              }).catch(err => {
                // Fallback方法
                fallbackCopy(data);
              });
              return true;
            } else {
              return fallbackCopy(data);
            }
          } catch (error) {
            console.warn('[GM_setClipboard]: 错误', error);
            return false;
          }
          
          function fallbackCopy(text) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
          }
        };
        console.log('[GM API 模拟]: GM_setClipboard 已创建');
      }
      
      // ========== GM_openInTab ==========
      if (typeof GM_openInTab === 'undefined') {
        window.GM_openInTab = function(url, options) {
          try {
            const loadInBackground = options && options.active === false;
            const newWindow = window.open(url, '_blank');
            if (newWindow && !loadInBackground) newWindow.focus();
            return newWindow;
          } catch (error) {
            console.warn('[GM_openInTab]: 错误', error);
            return null;
          }
        };
        console.log('[GM API 模拟]: GM_openInTab 已创建');
      }
      
      // ========== GM_getResourceText / GM_getResourceURL ==========
      if (typeof GM_getResourceText === 'undefined') {
        window.GM_getResourceText = function(name) {
          console.warn('[GM_getResourceText]: 需要@resource元数据支持');
          return '';
        };
      }
      if (typeof GM_getResourceURL === 'undefined') {
        window.GM_getResourceURL = function(name) {
          console.warn('[GM_getResourceURL]: 需要@resource元数据支持');
          return '';
        };
      }
      
      // ========== GM_registerMenuCommand / GM_unregisterMenuCommand ==========
      if (typeof GM_registerMenuCommand === 'undefined') {
        window.__GM_MENU_COMMANDS__ = [];
        window.GM_registerMenuCommand = function(name, fn, accessKey) {
          const commandId = window.__GM_MENU_COMMANDS__.length;
          window.__GM_MENU_COMMANDS__.push({ id: commandId, name, fn, accessKey });
          console.log('[GM_registerMenuCommand]: 注册菜单命令', name);
          return commandId;
        };
      }
      if (typeof GM_unregisterMenuCommand === 'undefined') {
        window.GM_unregisterMenuCommand = function(menuCmdId) {
          if (window.__GM_MENU_COMMANDS__?.[menuCmdId]) {
            delete window.__GM_MENU_COMMANDS__[menuCmdId];
          }
        };
      }
      
      // ========== GM_download ==========
      if (typeof GM_download === 'undefined') {
        window.GM_download = function(details) {
          try {
            const url = typeof details === 'string' ? details : details.url;
            const name = typeof details === 'object' ? details.name : null;
            
            const link = document.createElement('a');
            link.href = url;
            if (name) link.download = name;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            if (typeof details === 'object' && details.onload) details.onload();
          } catch (error) {
            console.warn('[GM_download]: 下载失败', error);
            if (typeof details === 'object' && details.onerror) details.onerror(error);
          }
        };
        console.log('[GM API 模拟]: GM_download 已创建');
      }
      
      // ========== GM_cookie ==========
      if (typeof GM_cookie === 'undefined') {
        window.GM_cookie = {
          list: function(details, callback) {
            try {
              const cookies = document.cookie.split(';').map(c => {
                const [name, value] = c.trim().split('=');
                return { name, value, domain: location.hostname };
              });
              callback(cookies, null);
            } catch (e) {
              callback([], e);
            }
          },
          set: function(details, callback) {
            try {
              let cookieStr = `${details.name}=${details.value}`;
              if (details.path) cookieStr += `; path=${details.path}`;
              if (details.domain) cookieStr += `; domain=${details.domain}`;
              if (details.secure) cookieStr += '; secure';
              if (details.httpOnly) cookieStr += '; httpOnly';
              if (details.expirationDate) {
                const date = new Date(details.expirationDate * 1000);
                cookieStr += `; expires=${date.toUTCString()}`;
              }
              document.cookie = cookieStr;
              callback && callback();
            } catch (e) {
              callback && callback(e);
            }
          },
          delete: function(details, callback) {
            try {
              document.cookie = `${details.name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${details.path || '/'}`;
              callback && callback();
            } catch (e) {
              callback && callback(e);
            }
          }
        };
        console.log('[GM API 模拟]: GM_cookie 已创建 (增强版)');
      }
      
      // ========== GM_getTab / GM_saveTab / GM_getTabs ==========
      if (typeof GM_getTab === 'undefined') {
        window.GM_getTab = function(callback) {
          const tabId = window.__GM_TAB_ID__ || (window.__GM_TAB_ID__ = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
          const tabData = __GM_STORAGE__.tabData[tabId] || {};
          callback(tabData);
        };
        console.log('[GM API 模拟]: GM_getTab 已创建');
      }
      
      if (typeof GM_saveTab === 'undefined') {
        window.GM_saveTab = function(tabData) {
          const tabId = window.__GM_TAB_ID__ || (window.__GM_TAB_ID__ = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
          __GM_STORAGE__.tabData[tabId] = tabData;
          // 同时保存到sessionStorage以便持久化
          try {
            sessionStorage.setItem('GM_TAB_' + tabId, JSON.stringify(tabData));
          } catch (e) {}
        };
        console.log('[GM API 模拟]: GM_saveTab 已创建');
      }
      
      if (typeof GM_getTabs === 'undefined') {
        window.GM_getTabs = function(callback) {
          // 从 sessionStorage 恢复所有标签页数据
          const tabs = {};
          try {
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              if (key && key.startsWith('GM_TAB_')) {
                const tabId = key.replace('GM_TAB_', '');
                tabs[tabId] = JSON.parse(sessionStorage.getItem(key));
              }
            }
          } catch (e) {}
          // 合并内存中的数据
          Object.assign(tabs, __GM_STORAGE__.tabData);
          callback(tabs);
        };
        console.log('[GM API 模拟]: GM_getTabs 已创建');
      }
      
      // ========== GM_webRequest ==========
      if (typeof GM_webRequest === 'undefined') {
        window.GM_webRequest = function(rules, listener) {
          console.log('[GM_webRequest]: 注册网络请求规则', rules);
          __GM_STORAGE__.webRequestRules.push({ rules, listener });
          
          // 尝试使用 PerformanceObserver 监听网络请求
          if (typeof PerformanceObserver !== 'undefined') {
            try {
              const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                  if (entry.entryType === 'resource') {
                    rules.forEach(rule => {
                      if (rule.selector && rule.selector.include) {
                        const pattern = rule.selector.include;
                        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                        if (regex.test(entry.name)) {
                          console.log('[GM_webRequest]: 匹配请求', entry.name);
                          if (listener) {
                            listener('onBeforeRequest', { url: entry.name });
                          }
                        }
                      }
                    });
                  }
                });
              });
              observer.observe({ entryTypes: ['resource'] });
            } catch (e) {
              console.warn('[GM_webRequest]: PerformanceObserver 不可用');
            }
          }
          
          return {
            abort: function() {
              const index = __GM_STORAGE__.webRequestRules.findIndex(r => r.rules === rules);
              if (index !== -1) {
                __GM_STORAGE__.webRequestRules.splice(index, 1);
              }
            }
          };
        };
        console.log('[GM API 模拟]: GM_webRequest 已创建 (限制功能)');
      }
      
      // ========== exportFunction / cloneInto (Firefox风格沙箱函数) ==========
      if (typeof exportFunction === 'undefined') {
        window.exportFunction = function(fn, targetScope, options) {
          const name = options?.defineAs;
          if (name && targetScope) {
            targetScope[name] = fn;
          }
          return fn;
        };
        console.log('[GM API 模拟]: exportFunction 已创建');
      }
      
      if (typeof cloneInto === 'undefined') {
        window.cloneInto = function(obj, targetScope, options) {
          // 简单的深拷贝实现
          try {
            if (options?.cloneFunctions) {
              return JSON.parse(JSON.stringify(obj, (key, value) => {
                if (typeof value === 'function') {
                  return value.toString();
                }
                return value;
              }));
            }
            return JSON.parse(JSON.stringify(obj));
          } catch (e) {
            return obj;
          }
        };
        console.log('[GM API 模拟]: cloneInto 已创建');
      }
      
      // ========== GM_require (@require 模拟) ==========
      window.GM_require = async function(url) {
        console.log('[GM_require]: 加载外部脚本', url);
        
        // 检查缓存
        if (__GM_STORAGE__.requireCache.has(url)) {
          console.log('[GM_require]: 使用缓存', url);
          return __GM_STORAGE__.requireCache.get(url);
        }
        
        return new Promise((resolve, reject) => {
          GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: function(response) {
              if (response.status >= 200 && response.status < 300) {
                try {
                  // 创建并执行脚本
                  const script = document.createElement('script');
                  script.textContent = response.responseText;
                  document.head.appendChild(script);
                  
                  __GM_STORAGE__.requireCache.set(url, true);
                  console.log('[GM_require]: 加载成功', url);
                  resolve(true);
                } catch (e) {
                  console.error('[GM_require]: 执行失败', e);
                  reject(e);
                }
              } else {
                reject(new Error(`加载失败: ${response.status}`));
              }
            },
            onerror: function(error) {
              console.error('[GM_require]: 加载失败', error);
              reject(error);
            }
          });
        });
      };
      console.log('[GM API 模拟]: GM_require 已创建');
      
      // ========== 【核心】增强版 GM_xmlhttpRequest 支持跨域 ==========
      // 保存原生GM_xmlhttpRequest引用（如果存在）
      const nativeGMXHR = (typeof GM_xmlhttpRequest === 'function') ? GM_xmlhttpRequest : null;
      const nativeGMXHR2 = (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function') ? GM.xmlHttpRequest : null;
      
      // 服务器代理配置
      const PROXY_CONFIG = {
        enabled: false,  // 禁用服务器代理，使用WebSocket拦截方案
        // 代理API端点（同源）
        manifestEndpoint: '/api/manifest',
        proxyEndpoint: '/api/proxy',
        // 需要代理的目标域名
        proxyHosts: [
          'xxz-xyzw.hortorgames.com',
          'xxz-xyzw-res.hortorgames.com',
          'ucenter-app-server.hortorgames.com',
          'comb-platform.hortorgames.com'
        ]
      };
      
      // 检查是否需要使用代理
      function shouldUseProxy(url) {
        try {
          const urlObj = new URL(url);
          return PROXY_CONFIG.proxyHosts.some(host => 
            urlObj.hostname === host || urlObj.hostname.endsWith('.' + host)
          );
        } catch (e) {
          return false;
        }
      }
      
      // 通过服务器代理发起请求
      function makeProxyRequest(details) {
        const url = details.url;
        const method = details.method || 'GET';
        const data = details.data || details.body;
        const timeout = details.timeout || 30000;
        
        console.log(`[雪花-代理]: 使用服务器代理请求 ${url}`);
        
        // 检查是否是manifest请求（优化路径）
        const isManifestRequest = url.includes('/login/manifest');
        
        let proxyUrl;
        let proxyMethod;
        let proxyBody;
        
        if (isManifestRequest) {
          // 使用专用的manifest端点
          proxyUrl = PROXY_CONFIG.manifestEndpoint;
          proxyMethod = 'GET';
          proxyBody = null;
          console.log(`[雪花-代理]: 使用manifest专用端点`);
        } else {
          // 使用通用代理端点
          proxyUrl = `${PROXY_CONFIG.proxyEndpoint}?url=${encodeURIComponent(url)}`;
          proxyMethod = method;
          proxyBody = data;
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          if (details.ontimeout) details.ontimeout();
        }, timeout);
        
        const fetchOptions = {
          method: proxyMethod,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          signal: controller.signal
        };
        
        if (proxyBody && proxyMethod !== 'GET' && proxyMethod !== 'HEAD') {
          fetchOptions.body = typeof proxyBody === 'string' ? proxyBody : JSON.stringify(proxyBody);
        }
        
        fetch(proxyUrl, fetchOptions)
          .then(async response => {
            clearTimeout(timeoutId);
            
            let responseText = '';
            let responseData = null;
            
            try {
              responseText = await response.text();
              try {
                responseData = JSON.parse(responseText);
              } catch (e) {
                responseData = responseText;
              }
            } catch (e) {
              responseData = responseText;
            }
            
            const responseObj = {
              responseText: responseText,
              response: responseData,
              status: response.status,
              statusText: response.statusText,
              responseHeaders: [...response.headers.entries()].map(([k, v]) => `${k}: ${v}`).join('\r\n'),
              finalUrl: url
            };
            
            console.log(`[雪花-代理]: 响应状态 ${response.status}`);
            
            if (response.ok) {
              if (details.onload) details.onload(responseObj);
            } else {
              if (details.onerror) details.onerror(responseObj);
            }
          })
          .catch(error => {
            clearTimeout(timeoutId);
            console.warn('[雪花-代理]: 代理请求失败', error.message);
            
            // 代理失败时回退到直接请求
            console.log('[雪花-代理]: 回退到直接请求');
            makeFetchRequest(details);
          });
        
        return {
          abort: function() {
            controller.abort();
            if (details.onabort) details.onabort();
          }
        };
      }
      
      // fetch请求函数
      function makeFetchRequest(details) {
        const method = details.method || 'GET';
        const url = details.url;
        const headers = details.headers || {};
        const data = details.data || details.body;
        const timeout = details.timeout || 30000;
        const responseType = details.responseType || '';
        const anonymous = details.anonymous || false;
        
        const fetchOptions = {
          method: method,
          headers: headers,
          mode: 'cors',
          credentials: anonymous ? 'omit' : 'include'
        };
        
        if (data && method !== 'GET' && method !== 'HEAD') {
          fetchOptions.body = data;
        }
        
        const controller = new AbortController();
        fetchOptions.signal = controller.signal;
        
        const timeoutId = setTimeout(() => {
          controller.abort();
          if (details.ontimeout) details.ontimeout();
        }, timeout);
        
        fetch(url, fetchOptions)
          .then(async response => {
            clearTimeout(timeoutId);
            
            let responseText = '';
            let responseData = null;
            
            try {
              if (responseType === 'arraybuffer') {
                responseData = await response.arrayBuffer();
              } else if (responseType === 'blob') {
                responseData = await response.blob();
              } else if (responseType === 'json') {
                responseData = await response.json();
                responseText = JSON.stringify(responseData);
              } else {
                responseText = await response.text();
                responseData = responseText;
              }
            } catch (e) {
              responseText = await response.text();
              responseData = responseText;
            }
            
            const responseObj = {
              responseText: responseText,
              response: responseData,
              status: response.status,
              statusText: response.statusText,
              responseHeaders: [...response.headers.entries()].map(([k, v]) => `${k}: ${v}`).join('\r\n'),
              finalUrl: response.url
            };
            
            if (response.ok) {
              if (details.onload) details.onload(responseObj);
            } else {
              if (details.onerror) details.onerror(responseObj);
            }
          })
          .catch(error => {
            clearTimeout(timeoutId);
            console.warn('[GM_xmlhttpRequest fetch]: 请求失败', error.message);
            
            // fetch失败时回退到XHR
            console.log('[GM_xmlhttpRequest]: fetch失败，回退到XHR');
            makeXHRRequest(details);
          });
        
        return {
          abort: function() {
            controller.abort();
            if (details.onabort) details.onabort();
          }
        };
      }
      
      // 创建增强版跨域请求函数
      function createEnhancedXHR() {
        return function(details) {
          const method = details.method || 'GET';
          const url = details.url;
          
          console.log(`[GM_xmlhttpRequest 增强]: ${method} ${url}`);
          
          // 检查是否跨域
          let isCrossOrigin = false;
          try {
            const urlObj = new URL(url);
            isCrossOrigin = urlObj.origin !== location.origin;
          } catch (e) {
            isCrossOrigin = true;
          }
          
          // 策略1: 优先使用原生 GM_xmlhttpRequest
          if (nativeGMXHR && ENV.isRealUserscriptEnv) {
            console.log('[GM_xmlhttpRequest]: 使用原生油猴API');
            return nativeGMXHR(details);
          }
          
          // 策略2: 尝试使用新版 GM.xmlHttpRequest
          if (nativeGMXHR2) {
            console.log('[GM_xmlhttpRequest]: 使用 GM.xmlHttpRequest');
            return nativeGMXHR2(details);
          }
          
          // 策略3: 如果是跨域请求且目标在代理白名单中，使用服务器代理
          if (isCrossOrigin && PROXY_CONFIG.enabled && shouldUseProxy(url)) {
            console.log('[GM_xmlhttpRequest]: 使用服务器代理');
            return makeProxyRequest(details);
          }
          
          // 策略4: 尝试使用 fetch 进行跨域请求
          if (isCrossOrigin && typeof fetch === 'function') {
            console.log('[GM_xmlhttpRequest]: 尝试使用 fetch 跨域请求');
            return makeFetchRequest(details);
          }
          
          // 策略5: 使用标准 XMLHttpRequest
          return makeXHRRequest(details);
        };
      }
      
      // 标准XHR请求函数
      function makeXHRRequest(details) {
        const method = details.method || 'GET';
        const url = details.url;
        const headers = details.headers || {};
        const data = details.data || details.body;
        const timeout = details.timeout || 30000;
        const responseType = details.responseType || '';
        const withCredentials = details.withCredentials !== false;
        
        const xhr = new XMLHttpRequest();
        
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            const response = {
              responseText: xhr.responseText,
              response: xhr.response,
              status: xhr.status,
              statusText: xhr.statusText,
              responseHeaders: xhr.getAllResponseHeaders(),
              finalUrl: xhr.responseURL || url
            };
            
            if (xhr.status >= 200 && xhr.status < 300) {
              if (details.onload) details.onload(response);
            } else if (xhr.status === 0) {
              // 可能是跨域错误
              console.warn('[GM_xmlhttpRequest XHR]: 请求被拦截，可能是CORS限制');
              if (details.onerror) details.onerror({ error: 'CORS或网络错误', status: 0 });
            } else {
              if (details.onerror) details.onerror(response);
            }
          }
        };
        
        xhr.onprogress = function(event) {
          if (details.onprogress) {
            details.onprogress({
              lengthComputable: event.lengthComputable,
              loaded: event.loaded,
              total: event.total
            });
          }
        };
        
        xhr.onerror = function() {
          console.warn('[GM_xmlhttpRequest XHR]: 网络错误');
          if (details.onerror) details.onerror({ error: '网络请求失败' });
        };
        
        xhr.ontimeout = function() {
          if (details.ontimeout) details.ontimeout();
        };
        
        try {
          xhr.open(method, url, true);
          
          // 设置响应类型
          if (responseType) {
            xhr.responseType = responseType;
          }
          
          // 设置超时
          xhr.timeout = timeout;
          
          // 设置跨域凭证
          xhr.withCredentials = withCredentials;
          
          // 设置请求头
          for (const [key, value] of Object.entries(headers)) {
            try {
              // 跳过不安全的请求头
              const unsafeHeaders = ['host', 'content-length', 'connection', 'cookie', 'origin', 'referer'];
              if (!unsafeHeaders.includes(key.toLowerCase())) {
                xhr.setRequestHeader(key, value);
              }
            } catch (e) {
              console.warn('[GM_xmlhttpRequest XHR]: 设置请求头失败', key);
            }
          }
          
          xhr.send(data || null);
          
          return {
            abort: function() {
              xhr.abort();
              if (details.onabort) details.onabort();
            }
          };
        } catch (error) {
          console.error('[GM_xmlhttpRequest XHR]: 请求错误', error);
          if (details.onerror) details.onerror({ error: error.message });
          return null;
        }
      }
      
      // 应用增强版 GM_xmlhttpRequest
      window.GM_xmlhttpRequest = createEnhancedXHR();
      console.log('[GM API 模拟]: GM_xmlhttpRequest 已创建 (增强跨域版)');
      
      // ========== 新版 GM 对象 API ==========
      if (typeof GM === 'undefined') {
        window.GM = {};
      }
      
      // GM.xmlHttpRequest - 新版API
      if (typeof GM.xmlHttpRequest === 'undefined') {
        GM.xmlHttpRequest = function(details) {
          return new Promise((resolve, reject) => {
            const modifiedDetails = {
              ...details,
              onload: (response) => {
                if (details.onload) details.onload(response);
                resolve(response);
              },
              onerror: (error) => {
                if (details.onerror) details.onerror(error);
                reject(error);
              }
            };
            GM_xmlhttpRequest(modifiedDetails);
          });
        };
        console.log('[GM API 模拟]: GM.xmlHttpRequest 已创建 (Promise版)');
      }
      
      // GM.getValue / GM.setValue - Promise版本
      if (typeof GM.getValue === 'undefined') {
        GM.getValue = function(key, defaultValue) {
          return Promise.resolve(GM_getValue(key, defaultValue));
        };
      }
      if (typeof GM.setValue === 'undefined') {
        GM.setValue = function(key, value) {
          return Promise.resolve(GM_setValue(key, value));
        };
      }
      if (typeof GM.deleteValue === 'undefined') {
        GM.deleteValue = function(key) {
          return Promise.resolve(GM_deleteValue(key));
        };
      }
      if (typeof GM.listValues === 'undefined') {
        GM.listValues = function() {
          return Promise.resolve(GM_listValues());
        };
      }
      
      // GM.notification
      if (typeof GM.notification === 'undefined') {
        GM.notification = function(details) {
          return new Promise((resolve) => {
            GM_notification(details);
            resolve();
          });
        };
      }
      
      // GM.setClipboard
      if (typeof GM.setClipboard === 'undefined') {
        GM.setClipboard = function(data, type) {
          return Promise.resolve(GM_setClipboard(data, type));
        };
      }
      
      // GM.openInTab
      if (typeof GM.openInTab === 'undefined') {
        GM.openInTab = function(url, options) {
          return Promise.resolve(GM_openInTab(url, options));
        };
      }
      
      // GM.addStyle
      if (typeof GM.addStyle === 'undefined') {
        GM.addStyle = function(css) {
          return Promise.resolve(GM_addStyle(css));
        };
      }
      
      // GM.addElement
      if (typeof GM.addElement === 'undefined') {
        GM.addElement = function(parentNode, tagName, attributes) {
          return Promise.resolve(GM_addElement(parentNode, tagName, attributes));
        };
      }
      
      // GM.registerMenuCommand
      if (typeof GM.registerMenuCommand === 'undefined') {
        GM.registerMenuCommand = function(name, fn, accessKey) {
          return Promise.resolve(GM_registerMenuCommand(name, fn, accessKey));
        };
      }
      
      // GM.unregisterMenuCommand
      if (typeof GM.unregisterMenuCommand === 'undefined') {
        GM.unregisterMenuCommand = function(menuCmdId) {
          return Promise.resolve(GM_unregisterMenuCommand(menuCmdId));
        };
      }
      
      // GM.download
      if (typeof GM.download === 'undefined') {
        GM.download = function(details) {
          return new Promise((resolve, reject) => {
            const modifiedDetails = typeof details === 'object' ? {
              ...details,
              onload: () => resolve(),
              onerror: (e) => reject(e)
            } : details;
            GM_download(modifiedDetails);
          });
        };
      }
      
      // GM.getTab
      if (typeof GM.getTab === 'undefined') {
        GM.getTab = function() {
          return new Promise((resolve) => {
            GM_getTab(resolve);
          });
        };
      }
      
      // GM.saveTab
      if (typeof GM.saveTab === 'undefined') {
        GM.saveTab = function(tabData) {
          return Promise.resolve(GM_saveTab(tabData));
        };
      }
      
      // GM.getTabs
      if (typeof GM.getTabs === 'undefined') {
        GM.getTabs = function() {
          return new Promise((resolve) => {
            GM_getTabs(resolve);
          });
        };
      }
      
      // GM.info
      if (typeof GM.info === 'undefined') {
        Object.defineProperty(GM, 'info', {
          get: function() { return GM_info; }
        });
      }
      
      console.log(`%c[${SCRIPT_HANDLER}] %cGM 对象创建完成 (完整 Promise API)`, 
        'color: #4CAF50; font-weight: bold;', 'color: inherit;');
      
      // ========== 完成 ==========
      const apiCount = 40;
      console.log('%c' + '='.repeat(50), 'color: #4CAF50;');
      console.log(`%c[${SCRIPT_HANDLER} v${VERSION}] %c初始化完成!`, 
        'color: #4CAF50; font-weight: bold; font-size: 14px;', 'color: inherit; font-size: 14px;');
      console.log(`%c[${SCRIPT_HANDLER}] %c✅ 支持 ${apiCount} 个 Tampermonkey/篡改猴 API`, 
        'color: #4CAF50; font-weight: bold;', 'color: inherit;');
      console.log(`%c[${SCRIPT_HANDLER}] %c✅ 完整模拟 Tampermonkey 运行时环境`, 
        'color: #4CAF50; font-weight: bold;', 'color: inherit;');
      console.log(`%c[${SCRIPT_HANDLER}] %c✅ 跨域请求: fetch + XHR 混合策略`, 
        'color: #4CAF50; font-weight: bold;', 'color: inherit;');
      console.log(`%c[${SCRIPT_HANDLER}] %c✅ GM.* Promise API 完整支持`, 
        'color: #4CAF50; font-weight: bold;', 'color: inherit;');
      console.log(`%c[${SCRIPT_HANDLER}] %c✅ 跨标签页通信、值变化监听、菜单命令`, 
        'color: #4CAF50; font-weight: bold;', 'color: inherit;');
      console.log(`%c[${SCRIPT_HANDLER}] %c✅ GM_webRequest 网络拦截、GM_cookie 操作`, 
        'color: #4CAF50; font-weight: bold;', 'color: inherit;');
      console.log('%c' + '='.repeat(50), 'color: #4CAF50;');
      
      // 将SCRIPT_HANDLER和VERSION导出到全局
      window.__GM_HANDLER__ = SCRIPT_HANDLER;
      window.__GM_VERSION__ = VERSION;
    })();

    // 添加样式
    GM_addStyle(`
    /* 工具容器 */
    #script-tool-container {
      position: fixed;
      z-index: 9999;
    }
    
    /* 工具开关按钮 - 修改：移除白色背景，只显示❄️图标 */
    .script-tool-toggle {
      background: transparent !important;
      color: #3182ce;
      border: none !important;
      padding: 0 !important;
      border-radius: 50%;
      cursor: pointer;
      font-size: 24px;
      box-shadow: none !important;
      transition: all 0.15s ease;
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10001;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      touch-action: none;
      will-change: transform;
    }
    
    .script-tool-toggle:hover {
      background: transparent !important;
      transform: scale(1.2);
      filter: drop-shadow(0 2px 4px rgba(49, 130, 206, 0.4));
    }
    
    .script-tool-toggle.dragging {
      cursor: grabbing;
      background: transparent !important;
      transform: scale(1.25);
      z-index: 10002;
      transition: transform 0.1s ease;
      filter: drop-shadow(0 3px 6px rgba(49, 130, 206, 0.6));
    }
    
    /* 工具面板 - 核心修复：严格限制不超屏幕边界 */
    .script-tool-panel {
      display: none;
      background: rgba(247, 250, 252, 0.98);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 18px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      padding: 20px;
      margin: 0;
      width: 340px;
      max-width: calc(100vw - 24px);
      max-height: calc(100vh - 80px);
      overflow: hidden;
      opacity: 1;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      z-index: 10000;
      position: absolute;
      box-sizing: border-box;
      right: 0;
      top: calc(100% + 12px);
    }
    
    /* 面板显示时 */
    .script-tool-panel.show {
      display: block;
      animation: modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    /* 模态框滑入动画 */
    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-16px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    /* 面板头部 - 优化版：修复灰色底版问题 */
    .panel-header {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(226, 232, 240, 0.8);
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 8px 8px 0 0;
      background-color: transparent !important;
    }
    
    .panel-header:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }
    
    /* 标题样式 - 优化版 */
    .script-tool-panel h3 {
      margin: 0;
      color: #2d3748;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.3px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.2s ease;
      background-color: transparent !important;
    }
    
    .panel-header:hover h3 {
      color: #3182ce;
    }
    
    /* 标题图标样式 */
    .script-tool-panel h3::before {
      content: "❄️";
      font-size: 20px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
    
    /* 导入区域 - 优化版 */
    .script-import-section {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(226, 232, 240, 0.8);
    }
    
    /* 导入脚本按钮 - 优化版：修改为竞技场风格 */
    #import-script-btn {
      background: rgba(49, 130, 206, 0.1);
      color: #3182ce;
      border: 1px solid rgba(49, 130, 206, 0.2);
      padding: 12px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      letter-spacing: 0.5px;
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(5px);
    }
    
    #import-script-btn:hover {
      background: rgba(49, 130, 206, 0.15);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(49, 130, 206, 0.2);
    }
    
    #import-script-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    #import-script-btn::before {
      content: "📁";
      font-size: 16px;
      transition: transform 0.3s ease;
    }
    
    #import-script-btn:hover::before {
      transform: scale(1.1) rotate(10deg);
    }
    
    /* 脚本列表区域 - 优化版 */
    .script-list-section {
      margin-bottom: 20px;
    }
    
    .script-list-section h4 {
      margin-bottom: 12px;
      color: #334155;
      font-size: 15px;
      font-weight: 600;
      padding-left: 4px;
      letter-spacing: 0.2px;
    }
    
    .script-list {
      max-height: 320px;
      overflow-y: auto;
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 10px;
      padding: 12px;
      background-color: rgba(255, 255, 255, 0.6);
      box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.04);
      backdrop-filter: blur(5px);
    }
    
    /* 脚本项 - 优化版 */
    .script-item {
      background-color: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 10px;
      transition: all 0.25s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      backdrop-filter: blur(5px);
    }
    
    .script-item:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
      border-color: rgba(203, 213, 224, 0.9);
      transform: translateY(-2px);
      background-color: rgba(255, 255, 255, 0.8);
    }
    
    .script-item:last-child {
      margin-bottom: 0;
    }
    
    .script-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    /* 脚本名称与控制按钮在同一行 - 修改布局 */
    .script-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      width: 100%;
    }
    
    /* 脚本名称 - 适当放大字体大小 */
    .script-name {
      font-weight: 600;
      color: #2d3748;
      font-size: 16px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: 0.1px;
      flex: 1;
      min-width: 0;
    }
    
    /* 脚本控制按钮 - 优化版：缩小按钮大小 */
    .script-controls {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
      align-items: center;
    }
    
    /* 脚本开关按钮 - 优化版：竞技场风格，缩小按钮大小 */
    .script-toggle {
      background: rgba(56, 161, 105, 0.1);
      color: #38a169;
      border: 1px solid rgba(56, 161, 105, 0.2);
      padding: 5px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      min-width: 55px;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 0.3px;
      backdrop-filter: blur(5px);
    }
    
    .script-toggle:hover {
      background: rgba(56, 161, 105, 0.15);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(56, 161, 105, 0.2);
    }
    
    .script-toggle.off {
      background: rgba(229, 62, 62, 0.1);
      color: #e53e3e;
      border: 1px solid rgba(229, 62, 62, 0.2);
    }
    
    .script-toggle.off:hover {
      background: rgba(229, 62, 62, 0.15);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(229, 62, 62, 0.2);
    }
    
    /* 删除按钮 - 优化版：竞技场风格，缩小按钮大小 */
    .script-delete {
      background: rgba(148, 163, 184, 0.1);
      color: #64748b;
      border: 1px solid rgba(148, 163, 184, 0.2);
      padding: 5px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      min-width: 45px;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 0.3px;
      backdrop-filter: blur(5px);
    }
    
    .script-delete:hover {
      background: rgba(148, 163, 184, 0.15);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(148, 163, 184, 0.2);
    }
    
    /* 图标隐藏/显示按钮 - 与运行中/已停止样式一致 */
    .script-icon-toggle {
      background: rgba(56, 161, 105, 0.1);
      color: #38a169;
      border: 1px solid rgba(56, 161, 105, 0.2);
      padding: 5px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      min-width: 55px;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 0.3px;
      backdrop-filter: blur(5px);
    }
    
    .script-icon-toggle:hover {
      background: rgba(56, 161, 105, 0.15);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(56, 161, 105, 0.2);
    }
    
    .script-icon-toggle.hidden {
      background: rgba(229, 62, 62, 0.1);
      color: #e53e3e;
      border: 1px solid rgba(229, 62, 62, 0.2);
    }
    
    .script-icon-toggle.hidden:hover {
      background: rgba(229, 62, 62, 0.15);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(229, 62, 62, 0.2);
    }
    
    .script-description {
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid rgba(226, 232, 240, 0.5);
    }
    
    /* 手机端适配 - 优化版 */
    @media (max-width: 768px) {
      #script-tool-container {
        top: 10px;
        right: 10px;
      }
      
      /* 移动端❄️按钮进一步缩小 */
      .script-tool-toggle {
        width: 46px;
        height: 46px;
        font-size: 26px;
        padding: 0;
        background: transparent !important;
        border: none !important;
      }
      
      .script-tool-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) !important;
        margin: 0;
        padding: 16px;
        width: calc(100vw - 32px);
        max-width: calc(100vw - 32px);
        height: auto;
        max-height: calc(100vh - 40px);
        overflow-y: auto;
        overflow-x: hidden;
        right: auto !important;
        bottom: auto !important;
        font-size: 14px;
        z-index: 10000;
        border-radius: 20px;
      }
      
      .script-item {
        flex-direction: column;
        align-items: stretch;
      }
      
      .script-header {
        flex-direction: row;
        align-items: center;
        gap: 8px;
      }
      
      .script-controls {
        margin-top: 0;
        justify-content: flex-end;
        width: auto;
      }
          
      .script-icon-toggle {
        background: rgba(56, 161, 105, 0.1);
        color: #38a169;
        border: 1px solid rgba(56, 161, 105, 0.2);
        padding: 5px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        min-width: 55px;
      }
          
      .script-icon-toggle:hover {
        background: rgba(56, 161, 105, 0.15);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(56, 161, 105, 0.2);
      }
          
      .script-icon-toggle.hidden {
        background: rgba(229, 62, 62, 0.1);
        color: #e53e3e;
        border: 1px solid rgba(229, 62, 62, 0.2);
      }
          
      .script-icon-toggle.hidden:hover {
        background: rgba(229, 62, 62, 0.15);
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(229, 62, 62, 0.2);
      }
      
      /* 移动端按钮触摸反馈 */
      .script-toggle, #import-script-btn {
        padding: 6px 12px;
        font-size: 12px;
      }
      
      .script-delete {
        padding: 6px 12px;
        font-size: 12px;
      }
      
      /* 移动端脚本列表优化 */
      .script-list {
        max-height: 220px;
        padding: 10px;
        background-color: rgba(255, 255, 255, 0.7);
      }
      
      .script-item {
        padding: 10px;
        margin-bottom: 8px;
        background-color: rgba(255, 255, 255, 0.6);
      }
      
      /* 移动端脚本名称字体大小调整 */
      .script-name {
        font-size: 14px;
      }
      
      .script-tool-panel h3 {
        font-size: 17px;
      }
      
      .script-tool-panel h4 {
        font-size: 15px;
      }
      
      /* 移动端动画调整 */
      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.92);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }
      
      .panel-header {
        padding-bottom: 12px;
        margin-bottom: 14px;
        background-color: transparent !important;
      }
      
      .script-description {
        font-size: 11px;
        margin-top: 4px;
        padding-top: 4px;
      }
    }

    /* 基础样式补充，防止布局错乱 */
    body {
      min-width: 320px;
    }
    
    /* 滚动条样式优化 */
    .script-list::-webkit-scrollbar {
      width: 6px;
    }
    
    .script-list::-webkit-scrollbar-track {
      background: rgba(241, 245, 249, 0.5);
      border-radius: 3px;
    }
    
    .script-list::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.5);
      border-radius: 3px;
    }
    
    .script-list::-webkit-scrollbar-thumb:hover {
      background: rgba(100, 116, 139, 0.7);
    }

    /* 批量操作按钮样式 - 与导入按钮样式一致 */
    .batch-toggle-section {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(226, 232, 240, 0.8);
    }
    
    .batch-toggle-btn {
      background: rgba(49, 130, 206, 0.1);
      color: #3182ce;
      border: 1px solid rgba(49, 130, 206, 0.2);
      padding: 12px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      letter-spacing: 0.5px;
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(5px);
    }
    
    .batch-toggle-btn:hover {
      background: rgba(49, 130, 206, 0.15);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(49, 130, 206, 0.2);
    }
    
    .batch-toggle-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    /* 消息提示样式 - 符合控制面板全局UI风格 */
    .script-message {
      position: fixed;
      left: 50%;
      bottom: 20px;
      transform: translateX(-50%);
      background-color: rgba(247, 250, 252, 0.98);
      color: #2d3748;
      padding: 16px 20px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10002;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(15px);
      max-width: 90%;
      width: 320px;
      text-align: center;
      pointer-events: none;
    }
    
    /* 成功消息样式 */
    .script-message.success {
      background-color: rgba(56, 161, 105, 0.1);
      color: #2f855a;
      border-color: rgba(56, 161, 105, 0.2);
    }
    
    /* 失败消息样式 */
    .script-message.error {
      background-color: rgba(239, 68, 68, 0.1);
      color: #c53030;
      border-color: rgba(239, 68, 68, 0.2);
    }
    
    /* 消息显示动画 */
    .script-message.show {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0) scale(1);
    }
    
    /* 消息隐藏动画 */
    .script-message.hide {
      opacity: 0;
      visibility: hidden;
      transform: translateX(-50%) translateY(20px) scale(0.95);
    }
    
    /* 确认弹窗样式 - 居中显示 */
    .script-confirm {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10003;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      backdrop-filter: blur(5px);
    }
    
    /* 确认弹窗显示 */
    .script-confirm.show {
      opacity: 1;
      visibility: visible;
    }
    
    /* 确认弹窗内容 */
    .script-confirm-content {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      max-width: 90%;
      width: 320px;
      transform: scale(0.9);
      transition: transform 0.3s ease;
    }
    
    /* 确认弹窗显示时的缩放动画 */
    .script-confirm.show .script-confirm-content {
      transform: scale(1);
    }
    
    /* 确认弹窗消息 */
    .script-confirm-message {
      font-size: 14px;
      color: #333333;
      margin-bottom: 20px;
      text-align: center;
      line-height: 1.5;
    }
    
    /* 确认弹窗按钮容器 */
    .script-confirm-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    
    /* 确认弹窗按钮基础样式 */
    .script-confirm-btn {
      padding: 8px 20px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 80px;
    }
    
    /* 取消按钮样式 */
    .script-confirm-cancel {
      background-color: #f7fafc;
      color: #4a5568;
    }
    
    /* 取消按钮悬停样式 */
    .script-confirm-cancel:hover {
      background-color: #edf2f7;
      border-color: #cbd5e0;
    }
    
    /* 确定按钮样式 */
    .script-confirm-ok {
      background-color: #3182ce;
      color: #ffffff;
      border-color: #3182ce;
    }
    
    /* 确定按钮悬停样式 */
    .script-confirm-ok:hover {
      background-color: #2b6cb0;
      border-color: #2b6cb0;
    }
    `);

    // 高性能拖拽管理器
    class DragManager {
      constructor(element, onDragCallback) {
        this.element = element;
        this.onDragCallback = onDragCallback;
        this.isDragging = false;
        this.rafId = null;
        this.startX = 0;
        this.startY = 0;
        this.startLeft = 0;
        this.startTop = 0;
        this.touchId = null;
        this.isTouchDevice = false;
        this.lastMoveTime = 0;
        this.moveThreshold = 5;
        this.hasMoved = false;
        
        this.init();
      }
      
      init() {
        this.element.addEventListener('mousedown', this.handleStart.bind(this));
        document.addEventListener('mousemove', this.handleMove.bind(this));
        document.addEventListener('mouseup', this.handleEnd.bind(this));
        
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        document.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
        
        this.element.addEventListener('dragstart', (e) => e.preventDefault());
      }
      
      handleStart(e) {
        if (e.button === 2) return;
        this.isTouchDevice = false;
        this.startDragging(e.clientX, e.clientY, e);
        e.preventDefault();
        e.stopPropagation();
      }
      
      handleTouchStart(e) {
        if (e.touches.length > 1) return;
        this.isTouchDevice = true;
        this.touchId = e.touches[0].identifier;
        const touch = e.touches[0];
        this.startDragging(touch.clientX, touch.clientY, e);
        e.preventDefault();
        e.stopPropagation();
      }
      
      startDragging(clientX, clientY, originalEvent) {
        this.isDragging = true;
        this.hasMoved = false;
        this.startX = clientX;
        this.startY = clientY;
        
        const leftStyle = this.element.style.left;
        const topStyle = this.element.style.top;
        
        if (leftStyle && topStyle && leftStyle !== 'auto' && topStyle !== 'auto') {
          this.startLeft = parseFloat(leftStyle) || 0;
          this.startTop = parseFloat(topStyle) || 0;
        } else {
          const rect = this.element.getBoundingClientRect();
          this.startLeft = rect.left;
          this.startTop = rect.top;
        }
        
        this.element.classList.add('dragging');
        
        if (this.onDragCallback && this.onDragCallback.onStart) {
          this.onDragCallback.onStart(originalEvent);
        }
        
        this.startAnimationFrame();
      }
      
      handleMove(e) {
        if (!this.isDragging || this.isTouchDevice) return;
        this.hasMoved = true;
        this.updatePosition(e.clientX, e.clientY);
        e.preventDefault();
      }
      
      handleTouchMove(e) {
        if (!this.isDragging || !this.isTouchDevice) return;
        this.hasMoved = true;
        
        let touch = null;
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === this.touchId) {
            touch = e.touches[i];
            break;
          }
        }
        
        if (!touch) return;
        this.updatePosition(touch.clientX, touch.clientY);
        e.preventDefault();
      }
      
      updatePosition(clientX, clientY) {
        const now = Date.now();
        
        if (this.isTouchDevice && now - this.lastMoveTime < 16) {
          return;
        }
        
        this.lastMoveTime = now;
        
        const deltaX = clientX - this.startX;
        const deltaY = clientY - this.startY;
        let newLeft = this.startLeft + deltaX;
        let newTop = this.startTop + deltaY;
        
        const elementWidth = this.element.offsetWidth || 50;
        const elementHeight = this.element.offsetHeight || 50;
        const maxLeft = Math.max(0, window.innerWidth - elementWidth);
        const maxTop = Math.max(0, window.innerHeight - elementHeight);
        
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));
        
        this.element.style.left = `${newLeft}px`;
        this.element.style.top = `${newTop}px`;
        this.element.style.right = 'auto';
        this.element.style.bottom = 'auto';
        this.element.style.transform = 'none';
        
        if (this.onDragCallback && this.onDragCallback.onMove) {
          this.onDragCallback.onMove(newLeft, newTop);
        }
      }
      
      startAnimationFrame() {
        const update = () => {
          if (this.isDragging) {
            this.rafId = requestAnimationFrame(update);
          }
        };
        this.rafId = requestAnimationFrame(update);
      }
      
      handleEnd(e) {
        if (!this.isDragging || this.isTouchDevice) return;
        this.endDragging(e);
      }
      
      handleTouchEnd(e) {
        if (!this.isDragging || !this.isTouchDevice) return;
        this.endDragging(e);
      }
      
      endDragging(originalEvent) {
        this.isDragging = false;
        this.element.classList.remove('dragging');
        
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
        
        const left = parseFloat(this.element.style.left) || 0;
        const top = parseFloat(this.element.style.top) || 0;
        
        localStorage.setItem('scriptToolPosition', JSON.stringify({
          left: left + 'px',
          top: top + 'px'
        }));
        
        const moveDistance = this.calculateMoveDistance();
        
        if (this.onDragCallback && this.onDragCallback.onEnd) {
          this.onDragCallback.onEnd(originalEvent, moveDistance);
        }
        
        this.hasMoved = false;
      }
      
      calculateMoveDistance() {
        const currentLeft = parseFloat(this.element.style.left) || 0;
        const currentTop = parseFloat(this.element.style.top) || 0;
        
        const deltaX = Math.abs(currentLeft - this.startLeft);
        const deltaY = Math.abs(currentTop - this.startTop);
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      }
      
      destroy() {
        this.element.removeEventListener('mousedown', this.handleStart);
        document.removeEventListener('mousemove', this.handleMove);
        document.removeEventListener('mouseup', this.handleEnd);
        
        this.element.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
        document.removeEventListener('touchcancel', this.handleTouchEnd);
        
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
        }
      }
    }
    
    // ==================== IndexedDB 大文件存储类 ====================
    // 解决 localStorage 5MB 限制问题，支持存储大型混淆脚本
    class ScriptStorage {
      constructor() {
        this.dbName = 'XueHuaScriptDB';
        this.dbVersion = 1;
        this.storeName = 'scripts';
        this.db = null;
        this.isReady = false;
        this.readyPromise = this.initDB();
      }
      
      // 初始化 IndexedDB
      async initDB() {
        return new Promise((resolve, reject) => {
          try {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
              console.error('[ScriptStorage] IndexedDB 打开失败:', event.target.error);
              // 降级到 localStorage
              this.useFallback = true;
              resolve(false);
            };
            
            request.onsuccess = (event) => {
              this.db = event.target.result;
              this.isReady = true;
              console.log('[ScriptStorage] IndexedDB 初始化成功');
              resolve(true);
            };
            
            request.onupgradeneeded = (event) => {
              const db = event.target.result;
              
              // 创建脚本存储对象
              if (!db.objectStoreNames.contains(this.storeName)) {
                const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                store.createIndex('name', 'name', { unique: false });
                console.log('[ScriptStorage] 创建脚本存储表');
              }
            };
          } catch (e) {
            console.error('[ScriptStorage] IndexedDB 初始化异常:', e);
            this.useFallback = true;
            resolve(false);
          }
        });
      }
      
      // 等待数据库就绪
      async waitReady() {
        await this.readyPromise;
        return this.isReady;
      }
      
      // 保存所有脚本
      async saveScripts(scripts) {
        await this.waitReady();
        
        // 如果 IndexedDB 不可用，使用 localStorage 降级方案
        if (this.useFallback || !this.db) {
          return this.saveToLocalStorage(scripts);
        }
        
        return new Promise((resolve, reject) => {
          try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            // 先清空旧数据
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => {
              // 逐个添加脚本
              let addedCount = 0;
              const totalCount = scripts.length;
              
              if (totalCount === 0) {
                console.log('[ScriptStorage] 脚本列表为空，已清空存储');
                resolve(true);
                return;
              }
              
              scripts.forEach(script => {
                const addRequest = store.add(script);
                
                addRequest.onsuccess = () => {
                  addedCount++;
                  if (addedCount === totalCount) {
                    console.log(`[ScriptStorage] 成功保存 ${totalCount} 个脚本到 IndexedDB`);
                    // 同时保存元数据到 localStorage（不含代码，用于快速加载）
                    this.saveMetadataToLocalStorage(scripts);
                    resolve(true);
                  }
                };
                
                addRequest.onerror = (event) => {
                  console.error('[ScriptStorage] 保存脚本失败:', script.name, event.target.error);
                };
              });
            };
            
            clearRequest.onerror = (event) => {
              console.error('[ScriptStorage] 清空存储失败:', event.target.error);
              // 降级到 localStorage
              this.saveToLocalStorage(scripts).then(resolve).catch(reject);
            };
            
            transaction.onerror = (event) => {
              console.error('[ScriptStorage] 事务失败:', event.target.error);
              this.saveToLocalStorage(scripts).then(resolve).catch(reject);
            };
          } catch (e) {
            console.error('[ScriptStorage] 保存异常:', e);
            this.saveToLocalStorage(scripts).then(resolve).catch(reject);
          }
        });
      }
      
      // 保存元数据到 localStorage（不含代码，用于快速检测）
      saveMetadataToLocalStorage(scripts) {
        try {
          const metadata = scripts.map(s => ({
            id: s.id,
            name: s.name,
            version: s.version,
            enabled: s.enabled,
            iconHidden: s.iconHidden
          }));
          localStorage.setItem('userScripts_meta', JSON.stringify(metadata));
        } catch (e) {
          console.warn('[ScriptStorage] 保存元数据失败:', e);
        }
      }
      
      // 降级方案：分块保存到 localStorage
      async saveToLocalStorage(scripts) {
        try {
          // 尝试直接保存
          const data = JSON.stringify(scripts);
          
          // 检查大小（localStorage 限制约 5MB）
          const sizeInMB = new Blob([data]).size / (1024 * 1024);
          
          if (sizeInMB > 4.5) {
            console.warn(`[ScriptStorage] 数据过大 (${sizeInMB.toFixed(2)}MB)，尝试分块存储`);
            return this.saveChunked(scripts);
          }
          
          localStorage.setItem('userScripts', data);
          console.log(`[ScriptStorage] 成功保存到 localStorage (${sizeInMB.toFixed(2)}MB)`);
          return true;
        } catch (e) {
          if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.warn('[ScriptStorage] localStorage 空间不足，尝试分块存储');
            return this.saveChunked(scripts);
          }
          console.error('[ScriptStorage] localStorage 保存失败:', e);
          throw e;
        }
      }
      
      // 分块存储（将大脚本代码单独存储）
      async saveChunked(scripts) {
        try {
          // 清理旧的分块数据
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('userScript_code_')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          // 分离大脚本代码
          const scriptsWithoutLargeCode = scripts.map(script => {
            const codeSize = new Blob([script.code || '']).size;
            
            // 如果代码超过 100KB，单独存储
            if (codeSize > 100 * 1024) {
              // 尝试存储代码到单独的 key
              try {
                localStorage.setItem(`userScript_code_${script.id}`, script.code);
                console.log(`[ScriptStorage] 大脚本 "${script.name}" 代码已分离存储 (${(codeSize/1024).toFixed(1)}KB)`);
                return { ...script, code: `__CHUNKED__${script.id}` };
              } catch (e) {
                console.error(`[ScriptStorage] 无法存储大脚本 "${script.name}":`, e);
                // 如果单个脚本都存不下，提示用户
                throw new Error(`脚本 "${script.name}" 太大 (${(codeSize/1024/1024).toFixed(2)}MB)，无法存储。请考虑使用更小的脚本文件。`);
              }
            }
            
            return script;
          });
          
          localStorage.setItem('userScripts', JSON.stringify(scriptsWithoutLargeCode));
          localStorage.setItem('userScripts_chunked', 'true');
          console.log('[ScriptStorage] 分块存储完成');
          return true;
        } catch (e) {
          console.error('[ScriptStorage] 分块存储失败:', e);
          throw e;
        }
      }
      
      // 加载所有脚本
      async loadScripts() {
        await this.waitReady();
        
        // 优先从 IndexedDB 加载
        if (!this.useFallback && this.db) {
          const scripts = await this.loadFromIndexedDB();
          if (scripts && scripts.length > 0) {
            return scripts;
          }
        }
        
        // 从 localStorage 加载
        return this.loadFromLocalStorage();
      }
      
      // 从 IndexedDB 加载
      async loadFromIndexedDB() {
        return new Promise((resolve, reject) => {
          try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = (event) => {
              const scripts = event.target.result || [];
              console.log(`[ScriptStorage] 从 IndexedDB 加载了 ${scripts.length} 个脚本`);
              resolve(scripts);
            };
            
            request.onerror = (event) => {
              console.error('[ScriptStorage] IndexedDB 加载失败:', event.target.error);
              resolve([]);
            };
          } catch (e) {
            console.error('[ScriptStorage] IndexedDB 加载异常:', e);
            resolve([]);
          }
        });
      }
      
      // 从 localStorage 加载
      loadFromLocalStorage() {
        try {
          const data = localStorage.getItem('userScripts');
          if (!data) return [];
          
          let scripts = JSON.parse(data);
          
          // 检查是否有分块存储的代码
          const isChunked = localStorage.getItem('userScripts_chunked') === 'true';
          
          if (isChunked) {
            scripts = scripts.map(script => {
              if (script.code && script.code.startsWith('__CHUNKED__')) {
                const scriptId = script.code.replace('__CHUNKED__', '');
                const code = localStorage.getItem(`userScript_code_${scriptId}`);
                if (code) {
                  console.log(`[ScriptStorage] 恢复分块存储的脚本代码: ${script.name}`);
                  return { ...script, code };
                } else {
                  console.warn(`[ScriptStorage] 找不到脚本代码: ${script.name}`);
                  return { ...script, code: '// 代码丢失' };
                }
              }
              return script;
            });
          }
          
          console.log(`[ScriptStorage] 从 localStorage 加载了 ${scripts.length} 个脚本`);
          return scripts;
        } catch (e) {
          console.error('[ScriptStorage] localStorage 加载失败:', e);
          return [];
        }
      }
      
      // 迁移旧数据到 IndexedDB
      async migrateFromLocalStorage() {
        await this.waitReady();
        
        if (this.useFallback || !this.db) return;
        
        try {
          const scripts = this.loadFromLocalStorage();
          if (scripts.length > 0) {
            // 检查 IndexedDB 是否已有数据
            const existingScripts = await this.loadFromIndexedDB();
            if (existingScripts.length === 0) {
              console.log('[ScriptStorage] 开始迁移数据到 IndexedDB...');
              await this.saveScripts(scripts);
              console.log('[ScriptStorage] 数据迁移完成');
            }
          }
        } catch (e) {
          console.error('[ScriptStorage] 数据迁移失败:', e);
        }
      }
    }
    
    // 全局存储实例
    const scriptStorage = new ScriptStorage();
    
    // 脚本管理类
    class ScriptManager {
      constructor() {
        // 直接从 localStorage 加载脚本（支持分块存储）
        this.scripts = this.loadScriptsFromStorage();
        this.activeScripts = new Set();
        this.dragManager = null;
        this.iconCheckInterval = null;
        this.domObserver = null; // DOM变化观察器
        this.init();
      }
      
      // 从存储加载脚本（支持分块存储）
      loadScriptsFromStorage() {
        try {
          const data = localStorage.getItem('userScripts');
          console.log('[loadScripts] userScripts 数据:', data ? `${data.length} 字符` : '空');
          
          if (!data) {
            console.log('[loadScripts] 没有找到已保存的脚本');
            return [];
          }
          
          let scripts = JSON.parse(data);
          console.log('[loadScripts] 解析到', scripts.length, '个脚本');
          
          // 检查是否有分块存储的代码需要恢复
          const isChunked = localStorage.getItem('userScripts_chunked') === 'true';
          console.log('[loadScripts] 分块存储标记:', isChunked);
          
          // 恢复分块存储的代码
          scripts = scripts.map(script => {
            // 检查代码是否是分块存储的标记
            if (script.code && typeof script.code === 'string' && script.code.startsWith('__CHUNKED__')) {
              const scriptId = script.code.replace('__CHUNKED__', '');
              const codeKey = `userScript_code_${scriptId}`;
              const code = localStorage.getItem(codeKey);
              console.log(`[loadScripts] 尝试恢复脚本 "${script.name}" 的代码, key: ${codeKey}, 找到: ${code ? '是' : '否'}`);
              
              if (code) {
                console.log(`[loadScripts] 成功恢复脚本代码: ${script.name} (${code.length} 字符)`);
                return { ...script, code };
              } else {
                console.warn(`[loadScripts] 找不到脚本代码: ${script.name}, key: ${codeKey}`);
                return { ...script, code: '// 代码丢失，请重新导入脚本', _codeLost: true };
              }
            }
            return script;
          });
          
          // 打印每个脚本的状态
          scripts.forEach((s, i) => {
            const codeLen = s.code ? s.code.length : 0;
            const isLost = s._codeLost ? ' [代码丢失]' : '';
            console.log(`[loadScripts] 脚本${i+1}: ${s.name}, enabled: ${s.enabled}, code: ${codeLen}字符${isLost}`);
          });
          
          console.log(`[loadScripts] 成功加载 ${scripts.length} 个脚本`);
          return scripts;
        } catch (e) {
          console.error('[loadScripts] 加载脚本失败:', e);
          return [];
        }
      }
      
      init() {
        this.createUI();
        this.bindEvents();
        this.renderScriptList();
        this.loadActiveScripts();
        this.initDrag();
        this.applyHiddenIcons(); // 应用隐藏图标状态
      }
      
      createUI() {
        // 创建工具开关按钮
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'script-tool-toggle';
        toggleBtn.className = 'script-tool-toggle';
        toggleBtn.textContent = '❄️';
        document.body.appendChild(toggleBtn);
        
        // 创建工具容器
        const container = document.createElement('div');
        container.id = 'script-tool-container';
        container.innerHTML = `
          <div id="script-tool-panel" class="script-tool-panel">
            <div class="panel-header">
              <h3>雪花</h3>
            </div>
            <div class="script-import-section">
              <button id="import-script-btn">选择脚本文件</button>
            </div>
            <div class="script-list-section">
              <h4>已导入脚本</h4>
              <div id="script-list" class="script-list"></div>
            </div>
            <div id="script-message" class="script-message"></div>
          </div>
        `;
        document.body.appendChild(container);
        
        // 创建确认弹窗
        const confirmDialog = document.createElement('div');
        confirmDialog.id = 'script-confirm';
        confirmDialog.className = 'script-confirm';
        confirmDialog.innerHTML = `
          <div class="script-confirm-content">
            <div class="script-confirm-message"></div>
            <div class="script-confirm-buttons">
              <button id="script-confirm-cancel" class="script-confirm-btn script-confirm-cancel">取消</button>
              <button id="script-confirm-ok" class="script-confirm-btn script-confirm-ok">确定</button>
            </div>
          </div>
        `;
        document.body.appendChild(confirmDialog);
      }
      
      initDrag() {
        const toggleBtn = document.getElementById('script-tool-toggle');
        const container = document.getElementById('script-tool-container');
        
        const savedPosition = localStorage.getItem('scriptToolPosition');
        
        if (savedPosition) {
          const position = JSON.parse(savedPosition);
          let left = parseFloat(position.left) || (window.innerWidth - toggleBtn.offsetWidth - 20);
          let top = parseFloat(position.top) || 20;
          
          const maxLeft = window.innerWidth - toggleBtn.offsetWidth;
          const maxTop = window.innerHeight - toggleBtn.offsetHeight;
          
          const newLeft = Math.max(0, Math.min(left, maxLeft));
          const newTop = Math.max(0, Math.min(top, maxTop));
          
          toggleBtn.style.left = `${newLeft}px`;
          toggleBtn.style.top = `${newTop}px`;
          toggleBtn.style.right = 'auto';
          toggleBtn.style.bottom = 'auto';
          toggleBtn.style.transform = 'none';
          
          if (window.innerWidth > 768) {
            container.style.left = `${newLeft}px`;
            container.style.top = `${newTop}px`;
            container.style.transform = 'none';
          }
        } else {
          toggleBtn.style.left = 'auto';
          toggleBtn.style.top = '20px';
          toggleBtn.style.right = '20px';
          toggleBtn.style.bottom = 'auto';
          toggleBtn.style.transform = 'none';
          
          if (window.innerWidth > 768) {
            const rect = toggleBtn.getBoundingClientRect();
            container.style.left = `${rect.left}px`;
            container.style.top = `${rect.top}px`;
            container.style.transform = 'none';
          }
        }
        
        this.dragManager = new DragManager(toggleBtn, {
          onStart: () => {
            console.log('开始拖拽');
          },
          onMove: (left, top) => {
            if (window.innerWidth > 768) {
              container.style.left = `${left}px`;
              container.style.top = `${top}px`;
            }
          },
          onEnd: (e, moveDistance) => {
            if (moveDistance < 5) {
              this.togglePanel();
            }
          }
        });
      }
      
      bindEvents() {
        // 注意：点击事件由 DragManager 的 onEnd 回调处理，这里不再重复绑定
        
        document.getElementById('import-script-btn').addEventListener('click', () => {
          this.openFileSelect();
        });
        
        this.bindPanelHeaderCloseEvent();
        
        window.addEventListener('resize', () => {
          this.adjustButtonPosition();
        });
      }
      
      openFileSelect() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        
        fileInput.addEventListener('change', (e) => {
          this.handleFileSelect(e.target.files);
        });
        
        fileInput.click();
      }
      
      adjustButtonPosition() {
        const toggleBtn = document.getElementById('script-tool-toggle');
        const container = document.getElementById('script-tool-container');
        const savedPosition = localStorage.getItem('scriptToolPosition');
        
        if (savedPosition) {
          const position = JSON.parse(savedPosition);
          const left = parseInt(position.left) || (window.innerWidth - toggleBtn.offsetWidth - 20);
          const top = parseInt(position.top) || 20;
          
          const maxLeft = window.innerWidth - toggleBtn.offsetWidth;
          const maxTop = window.innerHeight - toggleBtn.offsetHeight;
          
          const newLeft = Math.max(0, Math.min(left, maxLeft));
          const newTop = Math.max(0, Math.min(top, maxTop));
          
          toggleBtn.style.left = `${newLeft}px`;
          toggleBtn.style.top = `${newTop}px`;
          toggleBtn.style.right = 'auto';
          toggleBtn.style.bottom = 'auto';
          toggleBtn.style.transform = 'none';
          
          if (window.innerWidth > 768) {
            container.style.left = `${newLeft}px`;
            container.style.top = `${newTop}px`;
            container.style.transform = 'none';
          }
        }
      }
      
      bindPanelHeaderCloseEvent() {
        // 重要：只选择油猴脚本自己面板内的 panel-header，避免影响咸鱼工具箱
        const scriptPanel = document.getElementById('script-tool-panel');
        if (!scriptPanel) return;
        
        const panelHeader = scriptPanel.querySelector('.panel-header');
        
        if (panelHeader) {
          // 使用实例方法引用，确保可以正确移除事件监听器
          if (!this.handleHeaderClick) {
            this.handleHeaderClick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.closePanel();
            };
          }
          
          // 先移除旧的监听器（如果存在）
          panelHeader.removeEventListener('click', this.handleHeaderClick);
          panelHeader.removeEventListener('touchstart', this.handleHeaderClick);
          
          // 添加新的监听器
          panelHeader.addEventListener('click', this.handleHeaderClick);
          panelHeader.addEventListener('touchstart', this.handleHeaderClick, { passive: false });
        }
      }
      
      showMessage(message, type = 'info') {
        const messageEl = document.getElementById('script-message');
        if (!messageEl) return;
        
        messageEl.textContent = message;
        messageEl.classList.remove('success', 'error', 'info');
        messageEl.classList.add(type);
        messageEl.classList.remove('hide');
        messageEl.classList.add('show');
        
        setTimeout(() => {
          messageEl.classList.remove('show');
          messageEl.classList.add('hide');
        }, 3000);
      }
      
      showConfirm(message, onConfirm, onCancel) {
        const confirmEl = document.getElementById('script-confirm');
        const messageEl = confirmEl.querySelector('.script-confirm-message');
        const okBtn = document.getElementById('script-confirm-ok');
        const cancelBtn = document.getElementById('script-confirm-cancel');
        
        if (!confirmEl || !messageEl || !okBtn || !cancelBtn) return;
        
        messageEl.textContent = message;
        confirmEl.classList.add('show');
        
        const handleOk = () => {
          okBtn.removeEventListener('click', handleOk);
          cancelBtn.removeEventListener('click', handleCancel);
          confirmEl.removeEventListener('click', handleConfirmClick);
          confirmEl.classList.remove('show');
          
          if (typeof onConfirm === 'function') {
            onConfirm();
          }
        };
        
        const handleCancel = () => {
          okBtn.removeEventListener('click', handleOk);
          cancelBtn.removeEventListener('click', handleCancel);
          confirmEl.removeEventListener('click', handleConfirmClick);
          confirmEl.classList.remove('show');
          
          if (typeof onCancel === 'function') {
            onCancel();
          }
        };
        
        const handleConfirmClick = (e) => {
          if (e.target === confirmEl) {
            handleCancel();
          }
        };
        
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        confirmEl.addEventListener('click', handleConfirmClick);
      }
      
      togglePanel() {
        const panel = document.getElementById('script-tool-panel');
        
        if (panel.classList.contains('show')) {
          this.closePanel();
        } else {
          this.openPanel();
        }
      }
      
      openPanel() {
        const panel = document.getElementById('script-tool-panel');
        const toggleBtn = document.getElementById('script-tool-toggle');
        const container = document.getElementById('script-tool-container');
        
        panel.classList.add('show');
        toggleBtn.style.display = 'none';
        
        this.bindPanelHeaderCloseEvent();
        
        if (window.innerWidth <= 768) {
          this.adjustMobilePanelPosition();
        } else {
          // 电脑端：确保面板不超出屏幕边界
          this.adjustPanelBoundary();
        }
      }
      
      closePanel() {
        const panel = document.getElementById('script-tool-panel');
        const toggleBtn = document.getElementById('script-tool-toggle');
        
        panel.classList.remove('show');
        toggleBtn.style.display = 'flex';
      }
      
      adjustMobilePanelPosition() {
        const panel = document.getElementById('script-tool-panel');
        panel.style.left = '50%';
        panel.style.top = '50%';
        panel.style.transform = 'translate(-50%, -50%)';
      }
      
      adjustPanelBoundary() {
        const panel = document.getElementById('script-tool-panel');
        const container = document.getElementById('script-tool-container');
        
        // 等待DOM更新后再计算
        setTimeout(() => {
          // 获取容器和面板尺寸
          const containerRect = container.getBoundingClientRect();
          const panelWidth = panel.offsetWidth || 340;
          const panelHeight = panel.offsetHeight || 500;
          
          // 重置为默认样式
          panel.style.right = '0';
          panel.style.left = 'auto';
          panel.style.top = 'calc(100% + 12px)';
          
          // 等待样式应用后计算实际位置
          requestAnimationFrame(() => {
            const panelRect = panel.getBoundingClientRect();
            
            // 检查右边界
            if (panelRect.right > window.innerWidth) {
              // 超出右边界，改为左对齐
              panel.style.right = 'auto';
              panel.style.left = '0';
            }
            
            // 检查左边界 - 关键修复
            if (panelRect.left < 0) {
              // 超出左边界，计算需要右移的距离
              const offset = Math.abs(panelRect.left) + 10; // 加10px边距
              panel.style.left = `${offset}px`;
              panel.style.right = 'auto';
            }
            
            // 检查底部边界
            if (panelRect.bottom > window.innerHeight) {
              // 超出底部，向上调整
              const overflow = panelRect.bottom - window.innerHeight;
              const currentTop = panelRect.top - containerRect.bottom - 12; // 当前相对偏移
              panel.style.top = `calc(100% + 12px - ${overflow + 20}px)`;
            }
            
            // 检查顶部边界
            if (panelRect.top < 0) {
              // 超出顶部，设置最小边距
              panel.style.top = '10px';
            }
          });
        }, 50);
      }
      
      handleFileSelect(files) {
        if (files.length === 0) return;
        
        let importedCount = 0;
        let failedCount = 0;
        const totalFiles = files.length;
        
        console.log('开始处理文件导入:', files.length, '个文件');
        
        for (let file of files) {
          console.log('开始读取文件:', file.name, file.type);
          
          const fileExt = file.name.split('.').pop().toLowerCase();
          const mimeType = file.type;
          
          const isJsFile = fileExt === 'js' || 
                          mimeType === 'application/javascript' || 
                          mimeType === 'text/javascript' ||
                          mimeType === 'application/x-javascript' ||
                          mimeType === 'application/ecmascript' ||
                          mimeType === 'text/ecmascript' ||
                          (mimeType === '' && (fileExt === 'js' || file.name.includes('.js')));
          
          const isTxtFile = fileExt === 'txt' || 
                           mimeType === 'text/plain' ||
                           mimeType.startsWith('text/');
          
          if (!isJsFile && !isTxtFile) {
            console.warn('不支持的文件类型:', file.name, 'MIME类型:', mimeType, '扩展名:', fileExt);
            this.showMessage(`仅支持导入.js和.txt文件，${file.name}（类型：${mimeType || fileExt}）不支持`, 'error');
            failedCount++;
            continue;
          }
          
          const reader = new FileReader();
          reader.onload = (e) => {
            console.log('文件读取完成:', file.name, '大小:', e.target.result.length, '字符');
            const result = this.importScript(e.target.result, file.name);
            
            console.log('[handleFileSelect] importScript 返回结果:', result);
            
            // 只要脚本对象创建成功就算导入成功（即使保存失败）
            if (result && result.script) {
              importedCount++;
              console.log('脚本导入成功:', file.name, result.saveSuccess ? '(已保存)' : '(未保存，刷新后丢失)');
            } else {
              failedCount++;
              console.error('导入脚本失败:', file.name, result ? result.error : '返回结果为空');
            }
            
            if (importedCount + failedCount === totalFiles) {
              let message = `批量导入完成！`;
              message += `\n成功导入: ${importedCount} 个脚本`;
              if (failedCount > 0) {
                message += `\n导入失败: ${failedCount} 个脚本`;
              }
              
              let type = 'info';
              if (failedCount === 0) {
                type = 'success';
              } else if (importedCount === 0) {
                type = 'error';
              }
              
              this.showMessage(message, type);
            }
          };
          reader.onerror = (error) => {
            console.error('文件读取失败:', file.name, error);
            failedCount++;
            
            if (importedCount + failedCount === totalFiles) {
              let message = `批量导入完成！`;
              message += `\n成功导入: ${importedCount} 个脚本`;
              if (failedCount > 0) {
                message += `\n导入失败: ${failedCount} 个脚本`;
              }
              
              let type = 'info';
              if (failedCount === 0) {
                type = 'success';
              } else if (importedCount === 0) {
                type = 'error';
              }
              
              this.showMessage(message, type);
            }
          };
          reader.readAsText(file);
        }
      }
      
      parseScriptMetadata(scriptContent) {
        const metadata = {
          name: '未命名脚本',
          namespace: '',
          version: '1.0',
          description: '',
          author: '',
          match: [],
          include: [],
          exclude: [],
          connect: [],
          grant: [],
          require: [],
          resource: [],
          runAt: 'document-end',
          icon: '',
          downloadURL: '',
          updateURL: ''
        };
        
        const metaRegex = /^\s*\/\/\s*@(\w+)\s+([^\n]*)$/gm;
        let match;
        
        while ((match = metaRegex.exec(scriptContent)) !== null) {
          const key = match[1].toLowerCase();
          const value = match[2].trim();
          
          if (['match', 'include', 'exclude', 'connect', 'grant', 'require', 'resource'].includes(key)) {
            metadata[key].push(value);
          } else if (key === 'run-at') {
            metadata.runAt = value;
          } else if (key === 'icon') {
            metadata.icon = value;
          } else if (key === 'download-url') {
            metadata.downloadURL = value;
          } else if (key === 'update-url') {
            metadata.updateURL = value;
          } else {
            metadata[key] = value;
          }
        }
        
        if (metadata.name === '未命名脚本') {
          const functionNameRegex = /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/;
          const nameMatch = scriptContent.match(functionNameRegex);
          if (nameMatch) {
            metadata.name = nameMatch[1];
          } else {
            const fileNameMatch = scriptContent.match(/\/([^\/]+)\.js/);
            if (fileNameMatch) {
              metadata.name = fileNameMatch[1];
            }
          }
        }
        
        return metadata;
      }
      
      extractScriptCode(scriptContent) {
        const endMarkers = [
          '==/UserScript==',
          '==/UserJS==',
          '// @end',
          '// ==/Script==',
          '/* ==/UserScript== */'
        ];
        
        for (const marker of endMarkers) {
          const regex = new RegExp('\\s*' + marker.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&') + '\\s*', 'i');
          const match = scriptContent.match(regex);
          if (match) {
            const endOfMetadata = match.index + match[0].length;
            return scriptContent.substring(endOfMetadata).trim();
          }
        }
        
        const metadataStart = scriptContent.indexOf('// ==UserScript==');
        if (metadataStart !== -1) {
          let currentPos = metadataStart;
          let inMetadata = true;
          
          while (currentPos < scriptContent.length && inMetadata) {
            const nextLineStart = scriptContent.indexOf('\n', currentPos);
            if (nextLineStart === -1) break;
            
            const nextLine = scriptContent.substring(currentPos, nextLineStart).trim();
            currentPos = nextLineStart + 1;
            
            if (!nextLine.startsWith('//')) {
              inMetadata = false;
            }
          }
          
          return scriptContent.substring(currentPos).trim();
        }
        
        const functionStart = scriptContent.indexOf('function(');
        const arrowFunctionStart = scriptContent.indexOf('=>');
        const varStart = scriptContent.indexOf('var ');
        const letStart = scriptContent.indexOf('let ');
        const constStart = scriptContent.indexOf('const ');
        const consoleLogStart = scriptContent.indexOf('console.log');
        
        const codeStarts = [functionStart, arrowFunctionStart, varStart, letStart, constStart, consoleLogStart]
          .filter(pos => pos !== -1)
          .sort((a, b) => a - b);
        
        if (codeStarts.length > 0) {
          return scriptContent.substring(codeStarts[0]).trim();
        }
        
        return scriptContent;
      }
      
      importScript(scriptContent, fileName) {
        let script = null;
        let saveSuccess = false;
        
        try {
          // 检测脚本大小
          const contentSize = new Blob([scriptContent]).size;
          const contentSizeMB = contentSize / (1024 * 1024);
          
          console.log(`[导入脚本] 文件: ${fileName}, 大小: ${contentSizeMB.toFixed(2)}MB`);
          
          // 警告大文件
          if (contentSizeMB > 2) {
            console.warn(`[导入脚本] 大文件警告: ${fileName} (${contentSizeMB.toFixed(2)}MB)`);
          }
          
          const metadata = this.parseScriptMetadata(scriptContent);
          const code = this.extractScriptCode(scriptContent);
          
          script = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            name: metadata.name || fileName.replace(/\.js$/i, ''),
            description: metadata.description,
            version: metadata.version,
            author: metadata.author,
            fileName: fileName,
            code: code,
            enabled: true,
            metadata: metadata,
            createdAt: new Date().toISOString(),
            iconHidden: false, // 默认不隐藏图标
            codeSize: contentSize // 记录代码大小
          };
          
          // 添加到内存
          this.scripts.push(script);
          console.log(`[importScript] 脚本已添加到内存: ${script.name}`);
          
        } catch (e) {
          console.error('[importScript] 创建脚本对象失败:', e);
          return { script: null, saveSuccess: false, error: e.message };
        }
        
        // 运行脚本（用try-catch包裹，防止运行错误影响导入结果）
        try {
          this.runScript(script);
          this.activeScripts.add(script.id);
          console.log(`[importScript] 脚本已运行: ${script.name}`);
        } catch (runError) {
          console.error('[importScript] 运行脚本时出错:', runError);
        }
        
        // 保存到存储（用try-catch包裹）
        try {
          saveSuccess = this.saveScripts();
          console.log(`[importScript] 保存结果: ${saveSuccess}`);
        } catch (saveError) {
          console.error('[importScript] 保存脚本时出错:', saveError);
        }
        
        // 渲染列表（用try-catch包裹）
        try {
          this.renderScriptList();
        } catch (renderError) {
          console.error('[importScript] 渲染列表时出错:', renderError);
        }
        
        if (saveSuccess) {
          console.log(`[importScript] 脚本导入并保存成功: ${script.name}`);
        } else {
          console.warn(`[importScript] 脚本已加载但保存失败: ${script.name}`);
        }
        
        // 返回结果，script 一定不为 null（除非创建失败）
        return { script, saveSuccess };
      }
      
      deleteScript(scriptId) {
        const script = this.scripts.find(s => s.id === scriptId);
        
        if (script) {
          console.log(`[删除脚本] 开始删除脚本: ${script.name}`);
          
          // 先停止脚本（清理所有DOM元素和资源）
          this.stopScript(script);
          this.activeScripts.delete(scriptId);
          
          // 清理分块存储的代码（如果有）
          try {
            localStorage.removeItem(`userScript_code_${scriptId}`);
          } catch (e) {
            console.warn('[删除脚本] 清理分块存储失败:', e);
          }
          
          console.log(`[删除脚本] 脚本已完全删除: ${script.name}`);
        }
        
        this.scripts = this.scripts.filter(s => s.id !== scriptId);
        this.saveScripts();
        
        // 删除后强制刷新页面，确保UI完全清理
        location.reload();
      }
      
      toggleScript(scriptId) {
        const script = this.scripts.find(s => s.id === scriptId);
        if (!script) return;
        
        script.enabled = !script.enabled;
        
        if (script.enabled) {
          if (this.activeScripts.has(scriptId)) {
            this.stopScript(script);
          }
          
          this.runScript(script);
          this.activeScripts.add(scriptId);
          this.showMessage(`脚本 "${script.name}" 已启用`, 'success');
          console.log('脚本已启用并立即刷新:', script.name);
        } else {
          this.showMessage(`正在停止脚本 "${script.name}"...`, 'info');
          this.stopScript(script);
          this.activeScripts.delete(scriptId);
          this.showMessage(`脚本 "${script.name}" 已停止`, 'success');
          console.log('脚本已停用:', script.name);
        }
        
        this.saveScripts();
        this.renderScriptList();
      }
      
      runScript(script) {
        try {
          console.log('准备运行脚本:', script.name, 'ID:', script.id);
          
          // 【新方案】启动实时DOM监听，标记脚本创建的元素
          const stopTracking = this.startScriptElementTracking(script.id, script.name);
          
          // 设置当前执行的脚本ID（让GM_addStyle/GM_addElement可以自动标记）
          window.__CURRENT_SCRIPT_ID__ = script.id;
          
          const scriptElement = document.createElement('script');
          scriptElement.id = `user-script-${script.id}`;
          scriptElement.setAttribute('data-script-id', script.id);
          scriptElement.setAttribute('data-script-name', script.name);
          
          const codePreview = script.code.length > 200 ? script.code.substring(0, 200) + '...' : script.code;
          console.log('执行脚本代码片段:', codePreview);
          
          // 将脚本代码包装，在执行后清除当前脚本ID
          const wrappedCode = `
            (function() {
              try {
                ${script.code}
              } finally {
                // 延迟清除，让异步代码也有机会使用
                setTimeout(function() {
                  if (window.__CURRENT_SCRIPT_ID__ === '${script.id}') {
                    window.__CURRENT_SCRIPT_ID__ = null;
                  }
                }, 2000);
              }
            })();
          `;
          
          scriptElement.textContent = wrappedCode;
          
          scriptElement.onerror = (error) => {
            console.error('脚本执行错误:', error);
            this.showMessage(`脚本 "${script.name}" 执行时发生错误`, 'error');
          };
          
          document.head.appendChild(scriptElement);
          
          // 等待脚本创建元素，然后停止跟踪并应用隐藏
          // 延长到 3 秒，因为很多脚本会在异步代码中创建元素
          setTimeout(() => {
            stopTracking(); // 停止跟踪
            console.log(`[跟踪完成] 脚本 "${script.name}" 元素标记完成`);
            
            // 如果该脚本图标被隐藏，立即隐藏已标记的元素
            if (script.iconHidden) {
              this.hideScriptIcon(script.id);
              this.startObserving(); // 启动MutationObserver监听后续变化
            }
          }, 3000); // 给脚本更多时间创建元素
          
          console.log('脚本已成功添加到页面并开始执行:', script.name);
        } catch (error) {
          console.error('运行脚本时出错:', error);
          console.error('错误详情:', error.stack);
          this.showMessage(`运行脚本 "${script.name}" 时出错: ${error.message}`, 'error');
          // 确保清除当前脚本ID
          window.__CURRENT_SCRIPT_ID__ = null;
        }
      }
      
      stopScript(script) {
        console.log(`%c[停止脚本] 开始停止脚本: ${script.name}, ID: ${script.id}`, 'color: #e53e3e; font-weight: bold;');
        
        // 1. 移除脚本标签
        const scriptElement = document.getElementById(`user-script-${script.id}`);
        if (scriptElement) {
          scriptElement.remove();
          console.log(`[停止脚本] 已移除脚本标签`);
        }
        
        // 2. 移除脚本创建的所有DOM元素（通过 data-hjm-owner 属性识别）
        const ownedElements = document.querySelectorAll(`[data-hjm-owner="${script.id}"]`);
        console.log(`[停止脚本] 找到 ${ownedElements.length} 个带有 data-hjm-owner 的元素`);
        
        let removedCount = 0;
        ownedElements.forEach(el => {
          try {
            const tagName = el.tagName;
            const elId = el.id;
            const elClass = el.className;
            
            // 不要移除大眼睛的元素
            if (el.closest?.('#script-tool-container')) {
              return;
            }
            
            // 先恢复显示状态（以防元素被隐藏）
            el.style.removeProperty('display');
            
            // 从 DOM 中移除
            if (el.parentNode) {
              el.parentNode.removeChild(el);
              removedCount++;
              console.log(`[停止脚本] 移除元素: ${tagName}`, elId || elClass || '(无标识)');
            }
          } catch (e) {
            console.warn(`[停止脚本] 移除元素失败:`, e);
          }
        });
        
        console.log(`[停止脚本] 已移除 ${removedCount} 个脚本创建的DOM元素`);
        
        // 3. 移除脚本添加的样式标签（head中的style）
        const styleElements = document.querySelectorAll(`style[data-hjm-owner="${script.id}"]`);
        console.log(`[停止脚本] 找到 ${styleElements.length} 个样式标签`);
        styleElements.forEach(style => {
          try {
            style.remove();
            console.log(`[停止脚本] 已移除样式标签`);
          } catch (e) {}
        });
        
        // 4. 额外扫描：查找可能未被标记但是脚本名称匹配的元素
        const namedElements = document.querySelectorAll(`[data-hjm-owner-name="${script.name}"]`);
        if (namedElements.length > 0) {
          console.log(`[停止脚本] 发现 ${namedElements.length} 个名称匹配的元素`);
          namedElements.forEach(el => {
            try {
              if (el.parentNode && !el.closest?.('#script-tool-container')) {
                el.parentNode.removeChild(el);
              }
            } catch (e) {}
          });
        }
        
        // 5. 清理脚本可能注册的全局定时器
        if (window.__GM_SCRIPT_TIMERS__ && window.__GM_SCRIPT_TIMERS__[script.id]) {
          const timers = window.__GM_SCRIPT_TIMERS__[script.id];
          timers.intervals?.forEach(id => clearInterval(id));
          timers.timeouts?.forEach(id => clearTimeout(id));
          delete window.__GM_SCRIPT_TIMERS__[script.id];
          console.log(`[停止脚本] 已清理脚本定时器`);
        }
        
        // 6. 触发全局清理事件（让脚本有机会自行清理）
        try {
          window.dispatchEvent(new CustomEvent('GM_SCRIPT_STOP', { 
            detail: { scriptId: script.id, scriptName: script.name } 
          }));
        } catch (e) {}
        
        // 7. 清除当前脚本ID（如果还是该脚本）
        if (window.__CURRENT_SCRIPT_ID__ === script.id) {
          window.__CURRENT_SCRIPT_ID__ = null;
        }
        
        console.log(`%c[停止脚本] 脚本已完全停止: ${script.name}`, 'color: #38a169; font-weight: bold;');
      }
      
      renderScriptList() {
        const scriptList = document.getElementById('script-list');
        scriptList.innerHTML = '';
        
        if (this.scripts.length === 0) {
          scriptList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">暂无导入的脚本</p>';
          return;
        }
        
        this.scripts.forEach(script => {
          const scriptItem = document.createElement('div');
          scriptItem.className = 'script-item';
          
          scriptItem.innerHTML = `
            <div class="script-info">
              <div class="script-header">
                <div class="script-name">${script.name}</div>
                <div class="script-controls">
                  <button class="script-icon-toggle ${script.iconHidden ? 'hidden' : ''}" data-id="${script.id}" title="${script.iconHidden ? '点击显示图标' : '点击隐藏图标'}">
                    ${script.iconHidden ? '显现' : '隐藏'}
                  </button>
                  <button class="script-toggle ${script.enabled ? '' : 'off'}" data-id="${script.id}">
                    ${script.enabled ? '运行中' : '已停止'}
                  </button>
                  <button class="script-delete" data-id="${script.id}">删除</button>
                </div>
              </div>
              <div class="script-description">${script.description || '无描述'}</div>
            </div>
          `;
          
          scriptItem.querySelector('.script-icon-toggle').addEventListener('click', (e) => {
            e.stopPropagation(); // 防止事件冒泡
            this.toggleScriptIcon(script.id);
          });
          
          // 手机端触摸事件支持
          scriptItem.querySelector('.script-icon-toggle').addEventListener('touchend', (e) => {
            e.preventDefault(); // 防止默认行为
            e.stopPropagation(); // 防止事件冒泡
            this.toggleScriptIcon(script.id);
          });
          
          scriptItem.querySelector('.script-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleScript(script.id);
          });
          
          scriptItem.querySelector('.script-toggle').addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleScript(script.id);
          });
          
          scriptItem.querySelector('.script-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showConfirm(`确定要删除脚本 "${script.name}" 吗？`, () => {
              this.deleteScript(script.id);
            });
          });
          
          scriptItem.querySelector('.script-delete').addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showConfirm(`确定要删除脚本 "${script.name}" 吗？`, () => {
              this.deleteScript(script.id);
            });
          });
          
          scriptList.appendChild(scriptItem);
        });
        
        // 添加批量操作按钮
        if (this.scripts.length > 0) {
          const batchSection = document.createElement('div');
          batchSection.className = 'batch-toggle-section';
          
          const allHidden = this.scripts.every(s => s.iconHidden);
          const someHidden = this.scripts.some(s => s.iconHidden);
          
          batchSection.innerHTML = `
            <button id="batch-hide-btn" class="batch-toggle-btn">
              ${allHidden ? '显示所有图标' : '隐藏所有图标'}
            </button>
          `;
          
          scriptList.appendChild(batchSection);
          
          const batchBtn = batchSection.querySelector('#batch-hide-btn');
          batchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const shouldHide = !allHidden;
            this.scripts.forEach(script => {
              if (script.iconHidden !== shouldHide) {
                this.toggleScriptIcon(script.id, true);
              }
            });
            this.renderScriptList();
            this.showMessage(shouldHide ? '已隐藏所有脚本图标' : '已显示所有脚本图标', 'success');
          });
          
          // 手机端触摸事件支持
          batchBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const shouldHide = !allHidden;
            this.scripts.forEach(script => {
              if (script.iconHidden !== shouldHide) {
                this.toggleScriptIcon(script.id, true);
              }
            });
            this.renderScriptList();
            this.showMessage(shouldHide ? '已隐藏所有脚本图标' : '已显示所有脚本图标', 'success');
          });
        }
      }
      
      // 保存脚本（使用 localStorage 分块存储）
      saveScripts() {
        try {
          // 先尝试直接存储
          const data = JSON.stringify(this.scripts);
          const sizeInMB = new Blob([data]).size / (1024 * 1024);
          console.log(`[saveScripts] 准备保存 ${this.scripts.length} 个脚本, 数据大小: ${sizeInMB.toFixed(2)}MB`);
          
          // 如果数据较小，直接存储
          if (sizeInMB < 4) {
            try {
              localStorage.setItem('userScripts', data);
              // 清理旧的分块数据
              this.cleanupChunkedData();
              localStorage.removeItem('userScripts_chunked');
              console.log(`[saveScripts] 直接存储成功 (${sizeInMB.toFixed(2)}MB)`);
              return true;
            } catch (e) {
              // 直接存储失败，尝试分块存储
              console.warn('[saveScripts] 直接存储失败，尝试分块存储:', e.message);
              return this.saveScriptsChunked();
            }
          }
          
          // 数据较大，使用分块存储
          console.log(`[saveScripts] 数据较大 (${sizeInMB.toFixed(2)}MB)，使用分块存储`);
          return this.saveScriptsChunked();
        } catch (e) {
          // 捕获 QuotaExceededError
          if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
            console.warn('[saveScripts] localStorage 空间不足，尝试分块存储');
            return this.saveScriptsChunked();
          }
          console.error('[saveScripts] 保存失败:', e);
          return false;
        }
      }
      
      // 清理旧的分块数据
      cleanupChunkedData() {
        try {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('userScript_code_')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`[saveScripts] 清理分块数据: ${key}`);
          });
        } catch (e) {
          console.warn('[saveScripts] 清理分块数据失败:', e);
        }
      }
      
      // 分块存储大脚本
      saveScriptsChunked() {
        try {
          console.log('[saveScripts] 开始分块存储...');
          
          // 清理旧的分块数据
          this.cleanupChunkedData();
          
          // 分离大脚本代码（超过50KB的单独存储）
          const scriptsWithoutLargeCode = this.scripts.map(script => {
            const codeSize = new Blob([script.code || '']).size;
            
            if (codeSize > 50 * 1024) {
              // 大脚本代码单独存储
              const codeKey = `userScript_code_${script.id}`;
              try {
                localStorage.setItem(codeKey, script.code);
                console.log(`[saveScripts] 大脚本 "${script.name}" 代码已分离存储 (${(codeSize/1024).toFixed(1)}KB), key: ${codeKey}`);
                return { ...script, code: `__CHUNKED__${script.id}`, _codeSize: codeSize };
              } catch (e) {
                console.error(`[saveScripts] 无法存储大脚本 "${script.name}":`, e);
                // 返回不含代码的版本，至少保存元数据
                return { ...script, code: '// 代码太大，无法保存', _codeSize: codeSize, _codeLost: true };
              }
            }
            
            return script;
          });
          
          const mainData = JSON.stringify(scriptsWithoutLargeCode);
          console.log(`[saveScripts] 主数据大小: ${(new Blob([mainData]).size / 1024).toFixed(1)}KB`);
          
          localStorage.setItem('userScripts', mainData);
          localStorage.setItem('userScripts_chunked', 'true');
          console.log('[saveScripts] 分块存储完成');
          return true;
        } catch (e) {
          console.error('[saveScripts] 分块存储失败:', e);
          return false;
        }
      }
      
      loadActiveScripts() {
        const activeScripts = this.scripts.filter(script => script.enabled);
        
        activeScripts.forEach(script => {
          this.runScript(script);
          this.activeScripts.add(script.id);
        });
        
        // 【关键修复】延迟应用隐藏状态（等待所有脚本创建元素并标记完成）
        setTimeout(() => {
          const hiddenScripts = this.scripts.filter(s => s.iconHidden && s.enabled);
          if (hiddenScripts.length > 0) {
            console.log(`[初始化] 检测到 ${hiddenScripts.length} 个需要隐藏图标的脚本`);
            hiddenScripts.forEach(script => {
              this.hideScriptIcon(script.id);
            });
            this.startObserving(); // 启动监听
          }
        }, 1200); // 给所有脚本足够时间创建元素
      }
      
      // 单个脚本图标切换
      toggleScriptIcon(scriptId, skipMessage = false) {
        const script = this.scripts.find(s => s.id === scriptId);
        if (!script) return;
        
        script.iconHidden = !script.iconHidden;
        
        if (script.iconHidden) {
          this.hideScriptIcon(scriptId);
          this.startObserving(); // 启动监听
          if (!skipMessage) {
            this.showMessage(`已隐藏 "${script.name}" 的图标`, 'success');
          }
        } else {
          this.showScriptIcon(scriptId);
          // 检查是否还有其他隐藏的脚本
          const hasHidden = this.scripts.some(s => s.iconHidden);
          if (!hasHidden) {
            this.stopObserving(); // 停止监听
          }
          if (!skipMessage) {
            this.showMessage(`已显示 "${script.name}" 的图标`, 'success');
          }
        }
        
        this.saveScripts();
        this.renderScriptList();
      }
      
      // 【实时跟踪】监听脚本运行期间创建的所有DOM元素
      startScriptElementTracking(scriptId, scriptName) {
        console.log(`[实时跟踪] 开始监听脚本 "${scriptName}" 创建的元素`);
        
        let trackedCount = 0;
        
        // 检查元素是否应该被排除
        const shouldExclude = (el) => {
          // 排除大眼睛元素
          if (el.closest?.('#script-tool-container') || 
              (el.id && el.id.includes('script-tool'))) {
            return true;
          }
          
          // 排除内置咸鱼工具箱元素（除非该脚本本身是咸鱼工具箱）
          const isXianyuToolbox = scriptName && (scriptName.includes('咸鱼') || scriptName.includes('工具箱') || scriptName.includes('accelerator'));
          if (!isXianyuToolbox) {
            if (el.id === 'accelerator-panel' || el.id === 'accelerator-toggle-btn') {
              return true;
            }
            if (el.closest?.('#accelerator-panel') || el.closest?.('#accelerator-toggle-btn')) {
              return true;
            }
          }
          
          // 【修复】排除游戏界面元素，避免隐藏游戏本身
          const tag = el.tagName?.toLowerCase();
          if (tag === 'canvas') {
            return true;
          }
          if (el.id === 'game' || el.id === 'gameContainer' || el.id === 'GameDiv' || el.id === 'Cocos2dGameContainer' || el.id === 'cocosContainer') {
            return true;
          }
          if (el.classList?.contains('game-container') || el.classList?.contains('game-content') || el.classList?.contains('cocos-container')) {
            return true;
          }
          if (el.closest?.('canvas') || el.closest?.('#game') || el.closest?.('#gameContainer') || el.closest?.('#GameDiv')) {
            return true;
          }
          
          return false;
        };
        
        // 检查并标记元素（不限制位置和zIndex）
        const checkAndMark = (el) => {
          if (shouldExclude(el)) return;
          
          // 跳过已标记的元素
          if (el.hasAttribute('data-hjm-owner')) return;
          
          const tag = el.tagName?.toLowerCase();
          // 跳过基础标签
          if (['html', 'head', 'body', 'script', 'meta', 'link', 'br', 'hr'].includes(tag)) {
            return;
          }
          
          try {
            // 标记元素归属
            el.setAttribute('data-hjm-owner', scriptId);
            el.setAttribute('data-hjm-owner-name', scriptName);
            trackedCount++;
            
            // 如果是比较重要的元素，打印日志
            if (el.id || (el.className && typeof el.className === 'string' && el.className.length > 0)) {
              console.log(`[实时跟踪] 标记元素:`, el.tagName, el.id || el.className.split(' ')[0] || '(无标识)', `属于: ${scriptName}`);
            }
          } catch (e) {
            // 忽略已删除的元素
          }
        };
        
        // 创建MutationObserver监听新增元素
        const trackingObserver = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) { // 元素节点
                checkAndMark(node);
                // 递归检查子元素
                node.querySelectorAll?.('*').forEach(child => checkAndMark(child));
              }
            });
          });
        });
        
        trackingObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        // 也监听head，因为脚本可能添加样式
        trackingObserver.observe(document.head, {
          childList: true,
          subtree: true
        });
        
        // 返回停止跟踪的函数
        return () => {
          trackingObserver.disconnect();
          console.log(`[实时跟踪] 停止监听，共标记 ${trackedCount} 个元素`);
        };
      }
      
      // 隐藏脚本的图标 - 只隐藏已标记归属的元素
      hideScriptIcon(scriptId) {
        const script = this.scripts.find(s => s.id === scriptId);
        if (!script) return;
        
        console.log(`[隐藏图标] 开始隐藏脚本 "${script.name}" 的元素`);
        
        // 【重要】不再自动扫描标记，只隐藏已被实时跟踪标记的元素
        // 避免将其他脚本的元素错误标记为当前脚本
        const ownedElements = document.querySelectorAll(`[data-hjm-owner="${scriptId}"]`);
        console.log(`[隐藏图标] 找到 ${ownedElements.length} 个已标记的元素`);
        
        let hiddenCount = 0;
        
        // 查找所有标记为该脚本创建的元素
        ownedElements.forEach(el => {
          if (!el.hasAttribute('data-hjm-hidden')) {
            try {
              const style = window.getComputedStyle(el);
              if (style.display !== 'none' && style.visibility !== 'hidden') {
                el.setAttribute('data-hjm-hidden', scriptId);
                el.setAttribute('data-hjm-display', style.display);
                el.style.setProperty('display', 'none', 'important');
                hiddenCount++;
                console.log(`[隐藏图标] 隐藏:`, el.tagName, el.id || el.className || '(无标识)');
              }
            } catch (e) {
              // 忽略错误
            }
          }
        });
        
        if (hiddenCount === 0 && ownedElements.length === 0) {
          console.log(`[隐藏图标] 该脚本没有被标记的元素，可能脚本未创建UI或跟踪时间不足`);
        }
        
        console.log(`[隐藏图标] 共隐藏 ${hiddenCount} 个元素`);
      }
      
      // 扫描并标记脚本创建的元素（用于手动点击隐藏时）
      scanAndMarkScriptElements(scriptId, scriptName) {
        console.log(`[扫描标记] 扫描并标记脚本 "${scriptName}" 的元素`);
        
        let markedCount = 0;
        const allElements = document.querySelectorAll('*');
        
        // 检查是否为咸鱼工具箱脚本（导入版）
        const isXianyuToolbox = scriptName && (scriptName.includes('咸鱼') || scriptName.includes('工具箱') || scriptName.includes('accelerator'));
        
        // 获取已经被其他脚本标记的元素ID集合
        const ownedByOthers = new Set();
        document.querySelectorAll('[data-hjm-owner]').forEach(el => {
          if (el.getAttribute('data-hjm-owner') !== scriptId) {
            ownedByOthers.add(el);
          }
        });
        
        allElements.forEach(el => {
          // 跳过已被其他脚本标记的
          if (ownedByOthers.has(el)) return;
          
          // 排除大眼睛元素
          if (el.closest?.('#script-tool-container') || 
              (el.id && el.id.includes('script-tool'))) {
            return;
          }
          
          // 【关键修复】如果是导入的咸鱼工具箱脚本，则不排除其创建的元素
          // 只有非咸鱼工具箱脚本才排除内置咸鱼工具箱的元素
          if (!isXianyuToolbox) {
            if (el.id === 'accelerator-panel' || el.id === 'accelerator-toggle-btn') {
              return;
            }
            if (el.closest?.('#accelerator-panel') || el.closest?.('#accelerator-toggle-btn')) {
              return;
            }
          }
          
          // 跳过基础标签
          const tag = el.tagName?.toLowerCase();
          if (['html', 'head', 'body', 'script', 'style', 'meta', 'link'].includes(tag)) {
            return;
          }
          
          try {
            const style = window.getComputedStyle(el);
            const position = style.position;
            const zIndex = parseInt(style.zIndex) || 0;
            
            if ((position === 'fixed' || position === 'absolute') && zIndex > 100) {
              // 排除游戏容器
              const isGameContainer = 
                tag === 'canvas' ||
                el.id === 'game' ||
                el.id === 'gameContainer' ||
                el.classList.contains('game-container') ||
                el.classList.contains('game-content') ||
                el.closest('canvas') !== null;
              
              if (!isGameContainer && !el.hasAttribute('data-hjm-owner')) {
                el.setAttribute('data-hjm-owner', scriptId);
                el.setAttribute('data-hjm-owner-name', scriptName);
                markedCount++;
                console.log(`[扫描标记] 标记元素:`, el.tagName, el.id || el.className || '(无标识)', `属于: ${scriptName}`);
              }
            }
          } catch (e) {
            // 忽略错误
          }
        });
        
        console.log(`[扫描标记] 共标记 ${markedCount} 个元素`);
      }
      
      // 显示单个脚本的图标
      showScriptIcon(scriptId) {
        const script = this.scripts.find(s => s.id === scriptId);
        console.log(`[显示图标] 开始显示脚本 "${script?.name || scriptId}" 的元素`);
        
        let shownCount = 0;
        
        document.querySelectorAll(`[data-hjm-hidden="${scriptId}"]`).forEach(el => {
          const originalDisplay = el.getAttribute('data-hjm-display') || '';
          el.style.display = originalDisplay;
          el.removeAttribute('data-hjm-hidden');
          el.removeAttribute('data-hjm-display');
          shownCount++;
          console.log(`[显示图标] 显示:`, el.tagName, el.id || el.className || '(无标识)');
        });
        
        console.log(`[显示图标] 共显示 ${shownCount} 个元素`);
      }
      
      // DOM变化监听 - 自动隐藏新出现的元素
      startObserving() {
        if (this.domObserver) return; // 已经在监听
        
        console.log('启动DOM监听...');
        
        this.domObserver = new MutationObserver((mutations) => {
          const hiddenScripts = this.scripts.filter(s => s.iconHidden);
          if (hiddenScripts.length === 0) {
            this.stopObserving();
            return;
          }
          
          // 检查新增的节点
          mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) { // 元素节点
                hiddenScripts.forEach(script => {
                  this.hideNewElement(node, script.id);
                });
              }
            });
          });
        });
        
        this.domObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
      
      stopObserving() {
        if (this.domObserver) {
          console.log('停止DOM监听');
          this.domObserver.disconnect();
          this.domObserver = null;
        }
      }
      
      hideNewElement(el, scriptId) {
        // 只隐藏标记为该脚本创建的元素
        if (el.getAttribute('data-hjm-owner') === scriptId && !el.hasAttribute('data-hjm-hidden')) {
          try {
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
              el.setAttribute('data-hjm-hidden', scriptId);
              el.setAttribute('data-hjm-display', style.display);
              el.style.setProperty('display', 'none', 'important');
              console.log(`[MutationObserver] 隐藏新增元素:`, el.tagName, el.id || el.className || '(无标识)');
            }
          } catch (e) {
            // 忽略错误
          }
        }
        
        // 递归检查子元素
        el.querySelectorAll?.('*').forEach(child => {
          this.hideNewElement(child, scriptId);
        });
      }
      
      // 应用所有隐藏图标状态
      applyHiddenIcons() {
        console.log('应用隐藏图标状态...');
        
        const hiddenScripts = this.scripts.filter(s => s.iconHidden);
        if (hiddenScripts.length === 0) return;
        
        // 等待页面加载
        setTimeout(() => {
          hiddenScripts.forEach(script => {
            this.hideScriptIcon(script.id);
          });
          this.startObserving(); // 启动监听
        }, 1000);
      }
    }
    
    // 初始化脚本管理器
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        window.scriptManager = new ScriptManager();
      });
    } else {
      window.scriptManager = new ScriptManager();
    }
})();