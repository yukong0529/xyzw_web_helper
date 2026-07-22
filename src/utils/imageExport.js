/**
 * 将Canvas导出为图片并下载
 * 兼容处理移动端大图导出问题
 * 支持多种导出方式，自动降级
 * @param {HTMLCanvasElement} canvas - canvas元素
 * @param {string} filename - 文件名
 */
export const downloadCanvasAsImage = (canvas, filename) => {
  try {
    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("Canvas转换Blob失败");
          fallbackToDataURL(canvas, filename);
          return;
        }

        const exportMethods = [
          () => tryNavigatorShare(blob, filename),
          () => tryClipboardWrite(blob, filename),
          () => downloadBlob(blob, filename),
          () => fallbackToDataURL(canvas, filename),
        ];

        executeWithFallback(exportMethods);
      }, "image/png");
    } else {
      fallbackToDataURL(canvas, filename);
    }
  } catch (e) {
    console.error("导出图片出错:", e);
    fallbackToDataURL(canvas, filename);
  }
};

const executeWithFallback = async (methods) => {
  for (const method of methods) {
    try {
      const result = await method();
      if (result !== false) return;
    } catch (e) {
      console.warn("导出方法失败，尝试下一种:", e);
    }
  }
};

const tryNavigatorShare = (blob, filename) => {
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare({ files: [file] })) {
      return navigator
        .share({
          files: [file],
          title: filename,
          text: filename,
        })
        .then(() => true);
    }
  }
  return Promise.resolve(false);
};

const tryClipboardWrite = (blob, filename) => {
  if (navigator.clipboard && navigator.clipboard.write) {
    const file = new File([blob], filename, { type: blob.type });
    const clipboardItem = new ClipboardItem({ [file.type]: file });
    return navigator.clipboard.write([clipboardItem]).then(() => {
      alert("图片已复制到剪贴板，请粘贴使用");
      return true;
    });
  }
  return Promise.resolve(false);
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);

  try {
    link.click();
  } catch (e) {
    console.error("Link click failed", e);
    URL.revokeObjectURL(url);
    return false;
  }

  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
  return true;
};

const fallbackToDataURL = (canvas, filename) => {
  try {
    const imgUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imgUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (e) {
    console.error("DataURL导出失败:", e);
    alert("所有导出方式均失败，可能是图片过大");
    return false;
  }
};

export const openImageInNewWindow = (canvas, filename) => {
  try {
    const imgUrl = canvas.toDataURL("image/png");
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>${filename}</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;">
            <img src="${imgUrl}" style="max-width:100%;height:auto;" />
            <p style="position:fixed;bottom:10px;left:50%;transform:translateX(-50%);color:#666;font-size:14px;">
              右键图片可以选择保存图片
            </p>
          </body>
        </html>
      `);
      newWindow.document.close();
      return true;
    }
  } catch (e) {
    console.error("新窗口打开失败:", e);
    return false;
  }
};

export const copyImageToClipboard = (canvas, filename) => {
  if (!navigator.clipboard || !navigator.clipboard.write) {
    alert("当前浏览器不支持剪贴板功能");
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Canvas转换Blob失败");
        resolve(false);
        return;
      }
      const file = new File([blob], filename, { type: "image/png" });
      const clipboardItem = new ClipboardItem({ [blob.type]: file });
      navigator.clipboard
        .write([clipboardItem])
        .then(() => {
          alert("图片已复制到剪贴板，请粘贴使用");
          resolve(true);
        })
        .catch((e) => {
          console.error("复制到剪贴板失败:", e);
          resolve(false);
        });
    }, "image/png");
  });
};

export const downloadAsBase64 = (canvas, filename) => {
  try {
    const imgUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imgUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (e) {
    console.error("Base64下载失败:", e);
    return false;
  }
};

const canvasToBlob = (canvas) => {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
};

export const downloadImageWithOptions = async (canvas, filename) => {
  const blob = await canvasToBlob(canvas);
  if (!blob) {
    return { success: false, method: "转换失败" };
  }

  const methods = [
    { name: "分享", fn: () => tryNavigatorShare(blob, filename) },
    { name: "复制", fn: () => copyImageToClipboard(canvas, filename) },
    {
      name: "新窗口",
      fn: () => Promise.resolve(openImageInNewWindow(canvas, filename)),
    },
    { name: "下载", fn: () => Promise.resolve(downloadBlob(blob, filename)) },
  ];

  for (const method of methods) {
    try {
      const result = await method.fn();
      if (result) {
        return { success: true, method: method.name };
      }
    } catch (e) {
      console.warn(`方法 ${method.name} 失败:`, e);
    }
  }

  fallbackToDataURL(canvas, filename);
  return { success: true, method: "Base64下载" };
};
