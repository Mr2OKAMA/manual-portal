const EDITOR_STORAGE_KEY = "manual-hub-json-editor";
const DEFAULT_FILE_NAME = "manuals.json";

const editorElements = {
  fileInput: document.querySelector("#json-file-input"),
  openFileButton: document.querySelector("#open-file-button"),
  editor: document.querySelector("#json-editor"),
  status: document.querySelector("#editor-status"),
  fileName: document.querySelector("#current-file-name"),
  validateButton: document.querySelector("#validate-button"),
  formatButton: document.querySelector("#format-button"),
  minifyButton: document.querySelector("#minify-button"),
  downloadButton: document.querySelector("#download-button"),
  clearButton: document.querySelector("#clear-button")
};

let currentFileName = DEFAULT_FILE_NAME;

function setStatus(type, title, detail) {
  editorElements.status.className = `editor-status editor-status--${type}`;
  const titleElement = document.createElement("strong");
  titleElement.textContent = title;
  editorElements.status.replaceChildren(titleElement, document.createElement("br"), document.createTextNode(detail));
}

function updateCurrentFileName(fileName) {
  currentFileName = fileName || DEFAULT_FILE_NAME;
  editorElements.fileName.textContent = currentFileName;
}

function saveDraft() {
  localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify({
    content: editorElements.editor.value,
    fileName: currentFileName
  }));
}

function getLineColumn(text, position) {
  const lines = text.slice(0, position).split("\n");
  return { line: lines.length, column: lines.at(-1).length + 1 };
}

function buildParseErrorMessage(error, text) {
  const match = error.message.match(/position\s+(\d+)/i);
  if (!match) {
    return error.message;
  }
  const position = Number(match[1]);
  const { line, column } = getLineColumn(text, position);
  return `${error.message}（${line}行 ${column}列付近）`;
}

function parseEditorJson() {
  const text = editorElements.editor.value;
  if (!text.trim()) {
    throw new Error("JSON テキストが空です。内容を入力してください。");
  }
  return { parsed: JSON.parse(text), text };
}

function validateEditorContent() {
  try {
    parseEditorJson();
    setStatus("success", "有効な JSON です", "この内容は整形・圧縮・ダウンロードできます。");
    return true;
  } catch (error) {
    setStatus("error", "JSON を解析できません", buildParseErrorMessage(error, editorElements.editor.value));
    return false;
  }
}

function replaceEditorContent(nextContent, statusMessage) {
  editorElements.editor.value = nextContent;
  saveDraft();
  setStatus("success", statusMessage.title, statusMessage.detail);
}

function formatJson(spacing) {
  try {
    const { parsed } = parseEditorJson();
    replaceEditorContent(JSON.stringify(parsed, null, spacing), spacing ? {
      title: "JSON を整形しました",
      detail: "インデント 2 スペースで pretty print しました。"
    } : {
      title: "JSON を圧縮しました",
      detail: "不要な空白と改行を削除しました。"
    });
  } catch (error) {
    setStatus("error", spacing ? "整形できません" : "圧縮できません", buildParseErrorMessage(error, editorElements.editor.value));
  }
}

function downloadJson() {
  try {
    const { parsed } = parseEditorJson();
    const blob = new Blob([`${JSON.stringify(parsed, null, 2)}\n`], { type: "application/json;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = currentFileName.endsWith(".json") ? currentFileName : `${currentFileName}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
    setStatus("success", "JSON をダウンロードしました", `${link.download} を保存しました。`);
  } catch (error) {
    setStatus("error", "ダウンロードできません", buildParseErrorMessage(error, editorElements.editor.value));
  }
}

async function readJsonFile(file) {
  try {
    const buffer = await file.arrayBuffer();
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch (error) {
    throw new Error("UTF-8 の JSON ファイルのみ読み込めます。文字コードを確認してください。");
  }
}

async function loadInitialContent() {
  const saved = localStorage.getItem(EDITOR_STORAGE_KEY);
  if (saved) {
    try {
      const { content, fileName } = JSON.parse(saved);
      editorElements.editor.value = content || "";
      updateCurrentFileName(fileName || DEFAULT_FILE_NAME);
      validateEditorContent();
      return;
    } catch (error) {
      localStorage.removeItem(EDITOR_STORAGE_KEY);
    }
  }

  try {
    const response = await fetch("./manuals.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const text = await response.text();
    editorElements.editor.value = `${text.trim()}\n`;
    updateCurrentFileName(DEFAULT_FILE_NAME);
    validateEditorContent();
  } catch (error) {
    setStatus("info", "初期 JSON を自動読み込みできませんでした", "そのまま貼り付けるか、ローカルの JSON ファイルを読み込んでください。");
  }
}

editorElements.openFileButton.addEventListener("click", () => {
  editorElements.fileInput.click();
});

editorElements.fileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  try {
    const text = await readJsonFile(file);
    editorElements.editor.value = text;
    updateCurrentFileName(file.name || DEFAULT_FILE_NAME);
    saveDraft();
    validateEditorContent();
  } catch (error) {
    setStatus("error", "ファイルを読み込めません", error.message);
  } finally {
    event.target.value = "";
  }
});

editorElements.editor.addEventListener("input", () => {
  saveDraft();
  validateEditorContent();
});

editorElements.validateButton.addEventListener("click", validateEditorContent);
editorElements.formatButton.addEventListener("click", () => formatJson(2));
editorElements.minifyButton.addEventListener("click", () => formatJson(0));
editorElements.downloadButton.addEventListener("click", downloadJson);
editorElements.clearButton.addEventListener("click", () => {
  editorElements.editor.value = "";
  updateCurrentFileName(DEFAULT_FILE_NAME);
  localStorage.removeItem(EDITOR_STORAGE_KEY);
  setStatus("info", "エディターをクリアしました", "新しい JSON を貼り付けるか、ローカルファイルを読み込んでください。");
  editorElements.editor.focus();
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    downloadJson();
  }
});

loadInitialContent();
