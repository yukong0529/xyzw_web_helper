window.xxtea = (function () {
  var delta = 0x9e3779b9
  function toUint8Array(v, includeLength) {
    var length = v.length
    var n = length << 2
    if (includeLength) {
      var m = v[length - 1]
      n -= 4
      if (m < n - 3 || m > n) {
        return null
      }
      n = m
    }
    var bytes = new Uint8Array(n)
    for (var i = 0; i < n; ++i) {
      bytes[i] = v[i >> 2] >> ((i & 3) << 3)
    }
    return bytes
  }

  function toUint32Array(bytes, includeLength) {
    var length = bytes.length
    var n = length >> 2
    if ((length & 3) !== 0) {
      ++n
    }
    var v
    if (includeLength) {
      v = new Uint32Array(n + 1)
      v[n] = length
    } else {
      v = new Uint32Array(n)
    }
    for (var i = 0; i < length; ++i) {
      v[i >> 2] |= bytes[i] << ((i & 3) << 3)
    }
    return v
  }

  function mx(sum, y, z, p, e, k) {
    return (((z >>> 5) ^ (y << 2)) + ((y >>> 3) ^ (z << 4))) ^ ((sum ^ y) + (k[(p & 3) ^ e] ^ z))
  }

  function fixk(k) {
    if (k.length < 16) {
      var key = new Uint8Array(16)
      key.set(k)
      k = key
    }
    return k
  }

  function encryptUint32Array(v, k) {
    var length = v.length
    var n = length - 1
    var y, z, sum, e, p, q
    z = v[n]
    sum = 0
    for (q = Math.floor(6 + 52 / length) | 0; q > 0; --q) {
      sum += delta
      e = (sum >>> 2) & 3
      for (p = 0; p < n; ++p) {
        y = v[p + 1]
        z = v[p] += mx(sum, y, z, p, e, k)
      }
      y = v[0]
      z = v[n] += mx(sum, y, z, p, e, k)
    }
    return v
  }

  function decryptUint32Array(v, k) {
    var length = v.length
    var n = length - 1
    var y, z, sum, e, p, q
    y = v[0]
    q = Math.floor(6 + 52 / length)
    for (sum = q * delta; sum !== 0; sum -= delta) {
      e = (sum >>> 2) & 3
      for (p = n; p > 0; --p) {
        z = v[p - 1]
        y = v[p] -= mx(sum, y, z, p, e, k)
      }
      z = v[n]
      y = v[0] -= mx(sum, y, z, p, e, k)
    }
    return v
  }

  function toBytes(str) {
    var n = str.length
    // A single code unit uses at most 3 bytes.
    // Two code units at most 4.
    var bytes = new Uint8Array(n * 3)
    var length = 0
    for (var i = 0; i < n; i++) {
      var codeUnit = str.charCodeAt(i)
      if (codeUnit < 0x80) {
        bytes[length++] = codeUnit
      } else if (codeUnit < 0x800) {
        bytes[length++] = 0xc0 | (codeUnit >> 6)
        bytes[length++] = 0x80 | (codeUnit & 0x3f)
      } else if (codeUnit < 0xd800 || codeUnit > 0xdfff) {
        bytes[length++] = 0xe0 | (codeUnit >> 12)
        bytes[length++] = 0x80 | ((codeUnit >> 6) & 0x3f)
        bytes[length++] = 0x80 | (codeUnit & 0x3f)
      } else {
        if (i + 1 < n) {
          var nextCodeUnit = str.charCodeAt(i + 1)
          if (codeUnit < 0xdc00 && 0xdc00 <= nextCodeUnit && nextCodeUnit <= 0xdfff) {
            var rune = (((codeUnit & 0x03ff) << 10) | (nextCodeUnit & 0x03ff)) + 0x010000
            bytes[length++] = 0xf0 | (rune >> 18)
            bytes[length++] = 0x80 | ((rune >> 12) & 0x3f)
            bytes[length++] = 0x80 | ((rune >> 6) & 0x3f)
            bytes[length++] = 0x80 | (rune & 0x3f)
            i++
            continue
          }
        }
        throw new Error('Malformed string')
      }
    }
    return bytes.subarray(0, length)
  }

  function toShortString(bytes, n) {
    var charCodes = new Uint16Array(n)
    var i = 0,
      off = 0
    for (var len = bytes.length; i < n && off < len; i++) {
      var unit = bytes[off++]
      switch (unit >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          charCodes[i] = unit
          break
        case 12:
        case 13:
          if (off < len) {
            charCodes[i] = ((unit & 0x1f) << 6) | (bytes[off++] & 0x3f)
          } else {
            throw new Error('Unfinished UTF-8 octet sequence')
          }
          break
        case 14:
          if (off + 1 < len) {
            charCodes[i] =
              ((unit & 0x0f) << 12) | ((bytes[off++] & 0x3f) << 6) | (bytes[off++] & 0x3f)
          } else {
            throw new Error('Unfinished UTF-8 octet sequence')
          }
          break
        case 15:
          if (off + 2 < len) {
            var rune =
              (((unit & 0x07) << 18) |
                ((bytes[off++] & 0x3f) << 12) |
                ((bytes[off++] & 0x3f) << 6) |
                (bytes[off++] & 0x3f)) -
              0x10000
            if (0 <= rune && rune <= 0xfffff) {
              charCodes[i++] = ((rune >> 10) & 0x03ff) | 0xd800
              charCodes[i] = (rune & 0x03ff) | 0xdc00
            } else {
              throw new Error('Character outside valid Unicode range: 0x' + rune.toString(16))
            }
          } else {
            throw new Error('Unfinished UTF-8 octet sequence')
          }
          break
        default:
          throw new Error('Bad UTF-8 encoding 0x' + unit.toString(16))
      }
    }
    if (i < n) {
      charCodes = charCodes.subarray(0, i)
    }
    return String.fromCharCode.apply(String, charCodes)
  }

  function toLongString(bytes, n) {
    var buf = []
    var charCodes = new Uint16Array(0x8000)
    var i = 0,
      off = 0
    for (var len = bytes.length; i < n && off < len; i++) {
      var unit = bytes[off++]
      switch (unit >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          charCodes[i] = unit
          break
        case 12:
        case 13:
          if (off < len) {
            charCodes[i] = ((unit & 0x1f) << 6) | (bytes[off++] & 0x3f)
          } else {
            throw new Error('Unfinished UTF-8 octet sequence')
          }
          break
        case 14:
          if (off + 1 < len) {
            charCodes[i] =
              ((unit & 0x0f) << 12) | ((bytes[off++] & 0x3f) << 6) | (bytes[off++] & 0x3f)
          } else {
            throw new Error('Unfinished UTF-8 octet sequence')
          }
          break
        case 15:
          if (off + 2 < len) {
            var rune =
              (((unit & 0x07) << 18) |
                ((bytes[off++] & 0x3f) << 12) |
                ((bytes[off++] & 0x3f) << 6) |
                (bytes[off++] & 0x3f)) -
              0x10000
            if (0 <= rune && rune <= 0xfffff) {
              charCodes[i++] = ((rune >> 10) & 0x03ff) | 0xd800
              charCodes[i] = (rune & 0x03ff) | 0xdc00
            } else {
              throw new Error('Character outside valid Unicode range: 0x' + rune.toString(16))
            }
          } else {
            throw new Error('Unfinished UTF-8 octet sequence')
          }
          break
        default:
          throw new Error('Bad UTF-8 encoding 0x' + unit.toString(16))
      }
      if (i >= 0x7fff - 1) {
        var size = i + 1
        buf.push(String.fromCharCode.apply(String, charCodes.subarray(0, size)))
        n -= size
        i = -1
      }
    }
    if (i > 0) {
      buf.push(String.fromCharCode.apply(String, charCodes.subarray(0, i)))
    }
    return buf.join('')
  }

  function toString(bytes) {
    var n = bytes.length
    if (n === 0) return ''
    return n < 0x7fff ? toShortString(bytes, n) : toLongString(bytes, n)
  }

  function encrypt(data, key) {
    if (typeof data === 'string') data = toBytes(data)
    if (typeof key === 'string') key = toBytes(key)
    if (data === undefined || data === null || data.length === 0) {
      return data
    }
    return toUint8Array(
      encryptUint32Array(toUint32Array(data, true), toUint32Array(fixk(key), false)),
      false
    )
  }

  function encryptToString(data, key) {
    if (typeof Buffer.from === 'function') {
      return Buffer.from(encrypt(data, key)).toString('base64')
    } else {
      return new Buffer(encrypt(data, key)).toString('base64')
    }
  }

  function decrypt(data, key) {
    if (typeof data === 'string') {
      if (typeof Buffer.from === 'function') {
        data = Buffer.from(data, 'base64')
      } else {
        data = new Buffer(data, 'base64')
      }
    }
    if (typeof key === 'string') key = toBytes(key)
    if (data === undefined || data === null || data.length === 0) {
      return data
    }
    return toUint8Array(
      decryptUint32Array(toUint32Array(data, false), toUint32Array(fixk(key), false)),
      true
    )
  }

  function decryptToString(data, key) {
    return toString(decrypt(data, key))
  }

  return {
    toBytes,
    toString,
    encrypt,
    encryptToString,
    decrypt,
    decryptToString
  }
})()
window.convertAssets = function (url) {
  if (typeof url != 'string') {
    return url
  }
  if (!url.startsWith('assets/') || url.startsWith('assets/internal')) {
    return url
  }
  let newUrl = 'https://xxz-xyzw-res.hortorgames.com/remote/' + url.slice(7)
  if (url.startsWith('assets/game') || url.startsWith('assets/launcher') || url.startsWith('assets/TEST_REMOTE_MODULE')) {
    if (url.endsWith('.js') || url.endsWith('.jsc')) {
      newUrl += 'c'
    }
  }
  return newUrl
}

window.loadJscAndDecode = async function (url, callback) {
  const jscRes = await fetch(url, { cache: 'force-cache' })
  if (!jscRes.ok) {
    throw new Error('download failed: ' + url + ', status: ' + jscRes.status)
  }
  const jscData = await jscRes.arrayBuffer()
  const uint8Data = new Uint8Array(jscData)
  const jsCodeData = xxtea.decrypt(uint8Data, xxtea.toBytes('0Aed5E79bbEa69f8'))
  const decoder = new TextDecoder();
  let jsCode = decoder.decode(jsCodeData)
  
  // 删除 launcher 中禁用 loadAny 的代码
  jsCode = jsCode.replace(/cc\.assetManager\.loadAny=function\(\)\{\},?/g, '');
  // 删除 game 中禁用 loadBundle 的代码 (isH5 判断)
  jsCode = jsCode.replace(/[a-zA-Z]\.PlatformManager\.instance\.isH5&&\(cc\.assetManager\.loadBundle=function\(\)\{\}\),?/g, '');
  console.log('[loadDecodeJSC] 已删除H5禁用代码');
  
  callback(jsCode)
}

window.parseRemoteBundleVers = function (settingsObj) {
  let body = settingsObj.body
  if (typeof body === 'string') {
    body = JSON.parse(body)
  }

  let bundleVers = body && body.bundleVers
  if (typeof bundleVers === 'string') {
    bundleVers = JSON.parse(bundleVers)
  }

  if (!bundleVers || typeof bundleVers !== 'object') {
    throw new Error('invalid remote bundleVers')
  }

  return bundleVers
}

window.loadRemoteBundleVers = async function () {
  const manifestUrl = `https://xxz-xyzw.hortorgames.com/login/manifest?platform=hortor&version=0.32.0-android`
  console.log('[remoteAssets] POST manifest', manifestUrl)

  const settingsRes = await fetch(
    manifestUrl,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json,text/plain,*/*',
        'Content-Type': 'application/json;charset=UTF-8'
      },
      body: '',
      cache: 'no-store'
    }
  )
  if (!settingsRes.ok) {
    throw new Error('manifest failed: ' + settingsRes.status)
  }

  const settingsTxt = await settingsRes.text()
  let settingsObj
  try {
    settingsObj = JSON.parse(settingsTxt)
  } catch (err) {
    console.error('[remoteAssets] manifest 返回非 JSON', settingsTxt.slice(0, 120))
    throw err
  }

  const bundleVers = window.parseRemoteBundleVers(settingsObj)
  Object.assign(window._CCSettings.bundleVers, bundleVers)
  console.log('[remoteAssets] 远程版本已拉取', {
    launcher: bundleVers.launcher,
    game: bundleVers.game,
    COMMIT_ID: bundleVers.COMMIT_ID
  })
}

window.ensureBundleVers = async function () {
  await window.loadRemoteBundleVers()

  if (!window._CCSettings.bundleVers || !window._CCSettings.bundleVers.launcher) {
    throw new Error('remote bundleVers missing launcher')
  }
}


window.installRemoteAssetLoader = function () {
  if (typeof cc === 'undefined' || !cc.assetManager || !cc.assetManager.downloader) {
    return
  }

  const downloader = cc.assetManager.downloader
  if (downloader.__remoteAssetLoaderInstalled) {
    return
  }
  downloader.__remoteAssetLoaderInstalled = true

  const absoluteUrlRE = /^(?:\w+:\/\/|\.+\/).+/
  const encryptedBundleRE = /^https:\/\/xxz-xyzw-res\.hortorgames\.com\/remote\/(?:game|launcher|TEST_REMOTE_MODULE)(?:\/|$)/
  const originalDownload = downloader.download.bind(downloader)
  const originalDownloaders = downloader._downloaders || {}
  const originalJsonDownloader = originalDownloaders['.json']
  const originalScriptDownloader = originalDownloaders['.js']
  const loadedScripts = Object.create(null)

  function toRemoteUrl(url) {
    let converted = window.convertAssets(url)
    if (
      typeof converted === 'string' &&
      converted === url &&
      encryptedBundleRE.test(converted) &&
      (converted.endsWith('.js') || converted.endsWith('.jsc'))
    ) {
      converted = converted.endsWith('.jsc') ? converted : converted + 'c'
    }
    return converted
  }

  function executeScript(code, url) {
    ;(0, eval)(code + '\n//# sourceURL=' + url)
  }

  function downloadJson(url, options, onComplete) {
    const finalUrl = toRemoteUrl(url)
    if (originalJsonDownloader) {
      return originalJsonDownloader(finalUrl, options, onComplete)
    }

    fetch(finalUrl, { cache: 'force-cache' })
      .then(function (res) {
        if (!res.ok) {
          throw new Error('download failed: ' + finalUrl + ', status: ' + res.status)
        }
        return res.json()
      })
      .then(function (json) {
        onComplete && onComplete(null, json)
      })
      .catch(function (err) {
        onComplete && onComplete(err)
      })
  }

  function downloadScript(url, options, onComplete) {
    const finalUrl = toRemoteUrl(url)
    if (loadedScripts[finalUrl]) {
      onComplete && onComplete(null)
      return
    }
    if (encryptedBundleRE.test(finalUrl) && finalUrl.endsWith('.jsc')) {
      window
        .loadJscAndDecode(finalUrl, function (code) {
          try {
            executeScript(code, finalUrl)
            loadedScripts[finalUrl] = true
            onComplete && onComplete(null)
          } catch (err) {
            onComplete && onComplete(err)
          }
        })
        .catch(function (err) {
          onComplete && onComplete(err)
        })
      return
    }

    if (originalScriptDownloader) {
      return originalScriptDownloader(finalUrl, options, onComplete)
    }

    const script = document.createElement('script')
    script.async = options && options.async
    script.src = finalUrl
    script.onload = function () {
      script.parentNode && script.parentNode.removeChild(script)
      loadedScripts[finalUrl] = true
      onComplete && onComplete(null)
    }
    script.onerror = function () {
      script.parentNode && script.parentNode.removeChild(script)
      onComplete && onComplete(new Error('load script failed: ' + finalUrl))
    }
    document.body.appendChild(script)
  }

  function downloadBundle(url, options, onComplete) {
    const bundleName = cc.path.basename(url)
    const base = absoluteUrlRE.test(url) ? url : 'assets/' + bundleName
    const remoteBase = toRemoteUrl(base)
    const version = options.version || (downloader.bundleVers && downloader.bundleVers[bundleName])
    if (!version && bundleName !== cc.AssetManager.BuiltinBundleName.INTERNAL) {
      onComplete && onComplete(new Error('[remoteAssets] missing bundle version: ' + bundleName))
      return
    }
    const versionPart = version ? version + '.' : ''
    let finished = 0
    let error = null
    let config = null

    function done(err) {
      if (err) {
        error = err
      }
      finished++
      if (finished === 2) {
        onComplete && onComplete(error, config)
      }
    }

    downloadJson(base + '/config.' + versionPart + 'json', options, function (err, data) {
      if (err) {
        error = err
      }
      if (data) {
        data.base = remoteBase + '/'
        config = data
      }
      done(err)
    })

    downloadScript(base + '/index.' + versionPart + 'js', options, done)
  }

  downloader.download = function (id, url, ext, options, onComplete) {
    return originalDownload(id, toRemoteUrl(url), ext, options, onComplete)
  }

  downloader.register({
    '.js': downloadScript,
    bundle: downloadBundle
  })

  console.log('[remoteAssets] 资源加载已切换到 CDN')
}

window.boot = async function () {
  try {
    await window.ensureBundleVers()
  } catch (err) {
    console.error('[remoteAssets] 远程版本拉取失败，已停止启动以避免加载旧资源', err)
    throw err
  }

  window.installRemoteAssetLoader()

  var settings = window._CCSettings
  window._CCSettings = undefined
  var onProgress = null

  var RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES
  var INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL
  var MAIN = cc.AssetManager.BuiltinBundleName.MAIN
  function setLoadingDisplay() {
    // Loading splash scene
    var splash = document.getElementById('splash')
    var progressBar = splash.querySelector('.progress-bar span')
    onProgress = function (finish, total) {
      var percent = (100 * finish) / total
      if (progressBar) {
        progressBar.style.width = percent.toFixed(2) + '%'
      }
    }
    splash.style.display = 'block'
    progressBar.style.width = '0%'

    cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
      splash.style.display = 'none'
    })
  }

  var onStart = function () {
    cc.view.enableRetina(true)

    // 启用资源缓存
    cc.assetManager.downloader.maxConcurrency = 10;
    cc.assetManager.downloader.maxRequestsPerFrame = 10;
    // 强制使用缓存
    if (cc.assetManager.pipeline && cc.AssetManager.Pipeline && cc.AssetManager.Pipeline.CacheDownloader) {
      cc.assetManager.pipeline.insert(0, cc.AssetManager.Pipeline.CacheDownloader);
    }
    cc.view.resizeWithBrowserSize(true)

    if (cc.sys.isBrowser) {
      // setLoadingDisplay();
    }

    if (cc.sys.isMobile) {
      if (settings.orientation === 'landscape') {
        cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE)
      } else if (settings.orientation === 'portrait') {
        cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT)
      }
      cc.view.enableAutoFullScreen(
        [
          cc.sys.BROWSER_TYPE_BAIDU,
          cc.sys.BROWSER_TYPE_BAIDU_APP,
          cc.sys.BROWSER_TYPE_WECHAT,
          cc.sys.BROWSER_TYPE_MOBILE_QQ,
          cc.sys.BROWSER_TYPE_MIUI,
          cc.sys.BROWSER_TYPE_HUAWEI,
          cc.sys.BROWSER_TYPE_UC
        ].indexOf(cc.sys.browserType) < 0
      )
    }

    // Limit downloading max concurrent task to 2,
    // more tasks simultaneously may cause performance draw back on some android system / browsers.
    // You can adjust the number based on your own test result, you have to set it before any loading process to take effect.
    if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
      cc.assetManager.downloader.maxConcurrency = 2
      cc.assetManager.downloader.maxRequestsPerFrame = 2
    }

    var launchScene = settings.launchScene
    var bundle = cc.assetManager.bundles.find(function (b) {
      return b.getSceneInfo(launchScene)
    })

    bundle.loadScene(launchScene, null, onProgress, function (err, scene) {
      if (!err) {
        cc.director.runSceneImmediate(scene)
        if (cc.sys.isBrowser) {
          // show canvas
          var canvas = document.getElementById('GameCanvas')
          canvas.style.visibility = ''
          var div = document.getElementById('GameDiv')
          if (div) {
            div.style.backgroundImage = ''
          }
          console.log('Success to load scene: ' + launchScene)
        }
      }
    })
  }

  var option = {
    id: 'GameCanvas',
    debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
    showFPS: settings.debug,
    frameRate: 30,
    groupList: settings.groupList,
    collisionMatrix: settings.collisionMatrix
  }

  cc.assetManager.init({
    bundleVers: settings.bundleVers,
    remoteBundles: settings.remoteBundles,
    server: settings.server
  })

  var bundleRoot = [INTERNAL]
  settings.hasResourcesBundle && bundleRoot.push(RESOURCES)

  var count = 0
  function cb(err) {
    if (err) return console.error(err.message, err.stack)
    count++
    if (count === bundleRoot.length + 1) {
      cc.assetManager.loadBundle(MAIN, function (err) {
        if (!err) {
          cc.game.run(option, onStart)
        }
      })
    }
  }

  cc.assetManager.loadScript(
    settings.jsList.map(function (x) {
      return 'src/' + x
    }),
    cb
  )

  for (var i = 0; i < bundleRoot.length; i++) {
    cc.assetManager.loadBundle(bundleRoot[i], cb)
  }
}
