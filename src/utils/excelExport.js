import * as XLSX from "xlsx";

export const downloadExcelWithOptions = (workbook, filename) => {
  const exportMethods = [
    () => tryBlobDownload(workbook, filename),
    () => tryBase64Download(workbook, filename),
    () => tryLinkDownload(workbook, filename),
  ];

  for (const method of exportMethods) {
    try {
      if (method()) return true;
    } catch (e) {
      console.warn("Excel导出方法失败:", e);
    }
  }
  return false;
};

const tryBlobDownload = (workbook, filename) => {
  try {
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    return true;
  } catch (e) {
    console.warn("Blob下载失败:", e);
    return false;
  }
};

const tryBase64Download = (workbook, filename) => {
  try {
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "base64" });
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${wbout}`;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (e) {
    console.warn("Base64下载失败:", e);
    return false;
  }
};

const tryLinkDownload = (workbook, filename) => {
  try {
    XLSX.writeFile(workbook, filename);
    return true;
  } catch (e) {
    console.warn("Link下载失败:", e);
    return false;
  }
};

export const copyDataToClipboard = (data, headers) => {
  if (!data || data.length === 0) {
    alert("没有可复制的数据");
    return false;
  }

  const headerRow = headers.join("\t");
  const dataRows = data.map((row) =>
    row
      .map((cell) => {
        if (cell === null || cell === undefined) return "";
        const str = String(cell);
        if (str.includes("\t") || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join("\t"),
  );

  const tsv = [headerRow, ...dataRows].join("\n");

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(tsv).then(() => {
      alert("数据已复制到剪贴板（TSV格式，可在Excel中粘贴）");
    });
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = tsv;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    alert("数据已复制到剪贴板（TSV格式，可在Excel中粘贴）");
    document.body.removeChild(textarea);
    return true;
  } catch (e) {
    console.error("复制失败:", e);
    document.body.removeChild(textarea);
    return false;
  }
};

export const downloadAsCSV = (workbook, filename) => {
  try {
    const csvWorkbook = XLSX.utils.book_new();
    const sheetNames = workbook.SheetNames;

    sheetNames.forEach((sheetName) => {
      const originalSheet = workbook.Sheets[sheetName];
      const csvSheet = XLSX.utils.sheet_to_csv(originalSheet);
      XLSX.utils.book_append_sheet(csvWorkbook, XLSX.utils.aoa_to_sheet([[]], {}), sheetName);
      csvWorkbook.Sheets[sheetName] = XLSX.utils.csv_to_sheet(csvSheet);
    });

    const csvFilename = filename.replace(/\.xlsx$/, ".csv");
    return downloadExcelWithOptions(csvWorkbook, csvFilename);
  } catch (e) {
    console.error("CSV导出失败:", e);
    return false;
  }
};