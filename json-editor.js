const EDITOR_STORAGE_KEY = "manual-hub-json-editor";
const DEFAULT_FILE_NAME = "manuals.json";
const DOCUMENT_FIELDS = [
  { key: "no", label: "文書番号", type: "text", placeholder: "例: 01-004" },
  { key: "category", label: "分類コード", type: "text", placeholder: "例: 01", list: "category-code-options" },
  { key: "categoryName", label: "分類名", type: "text", placeholder: "例: 運転・運用マニュアル", list: "category-name-options" },
  { key: "title", label: "タイトル", type: "text", placeholder: "例: ポンプ停止手順" },
  { key: "date", label: "改訂日", type: "date" },
  { key: "url", label: "マニュアル本体 URL", type: "url", placeholder: "https://..." }
];

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
  clearButton: document.querySelector("#clear-button"),
  addDocumentButton: document.querySelector("#add-document-button"),
  documentState: document.querySelector("#document-editor-state"),
  documentSummary: document.querySelector("#document-editor-summary"),
  documentList: document.querySelector("#document-editor-list")
};

let currentFileName = DEFAULT_FILE_NAME;
let isEditorJsonValid = false;

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

function getCategoryOptions(parsed) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { codes: [], names: [] };
  }

  const codes = new Set();
  const names = new Set();

  if (Array.isArray(parsed.categories)) {
    for (const category of parsed.categories) {
      if (!category || typeof category !== "object") {
        continue;
      }
      if (typeof category.code === "string" && category.code.trim()) {
        codes.add(category.code);
      }
      if (typeof category.name === "string" && category.name.trim()) {
        names.add(category.name);
      }
    }
  }

  if (Array.isArray(parsed.documents)) {
    for (const documentItem of parsed.documents) {
      if (!documentItem || typeof documentItem !== "object") {
        continue;
      }
      if (typeof documentItem.category === "string" && documentItem.category.trim()) {
        codes.add(documentItem.category);
      }
      if (typeof documentItem.categoryName === "string" && documentItem.categoryName.trim()) {
        names.add(documentItem.categoryName);
      }
    }
  }

  return {
    codes: Array.from(codes),
    names: Array.from(names)
  };
}

function setDocumentsEditorEnabled(enabled) {
  editorElements.addDocumentButton.disabled = !enabled;

  for (const input of editorElements.documentList.querySelectorAll("input")) {
    input.disabled = !enabled;
  }

  for (const button of editorElements.documentList.querySelectorAll("button")) {
    button.disabled = !enabled;
  }

  for (const fieldset of editorElements.documentList.querySelectorAll("fieldset")) {
    fieldset.classList.toggle("document-card--disabled", !enabled);
  }
}

function updateDocumentSummary(documentsLength) {
  editorElements.documentSummary.textContent = `documents: ${documentsLength} 件をフォームから編集できます。`;
}

function setDocumentState(message) {
  editorElements.documentState.textContent = message;
}

function createOptionList(id, values) {
  const list = document.createElement("datalist");
  list.id = id;

  for (const value of values) {
    const option = document.createElement("option");
    option.value = value;
    list.append(option);
  }

  return list;
}

function createDocumentField(index, field, documentItem) {
  const label = document.createElement("label");
  const input = document.createElement("input");
  const inputId = `document-${index}-${field.key}`;

  label.htmlFor = inputId;
  label.append(document.createTextNode(field.label));

  input.id = inputId;
  input.name = field.key;
  input.type = field.type;
  input.dataset.index = String(index);
  input.dataset.field = field.key;
  input.placeholder = field.placeholder || "";
  input.autocomplete = "off";
  input.value = typeof documentItem?.[field.key] === "string" ? documentItem[field.key] : "";

  if (field.list) {
    input.setAttribute("list", field.list);
  }

  label.append(input);
  return label;
}

function renderDocumentForms(parsed) {
  const isEditableRoot = parsed && typeof parsed === "object" && !Array.isArray(parsed);
  const documents = isEditableRoot && Array.isArray(parsed.documents) ? parsed.documents : [];

  editorElements.documentList.replaceChildren();

  if (!isEditableRoot) {
    updateDocumentSummary(0);
    setDocumentState("ルートがオブジェクト形式の JSON のときだけ documents を個別編集できます。");
    setDocumentsEditorEnabled(false);
    return;
  }

  const { codes, names } = getCategoryOptions(parsed);
  editorElements.documentList.append(createOptionList("category-code-options", codes));
  editorElements.documentList.append(createOptionList("category-name-options", names));

  if (!documents.length) {
    const empty = document.createElement("p");
    empty.className = "document-editor-empty";
    empty.textContent = "documents はまだ空です。「文書を追加」から新しい項目を作成できます。";
    editorElements.documentList.append(empty);
  }

  documents.forEach((documentItem, index) => {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    const header = document.createElement("div");
    const headerText = document.createElement("div");
    const title = document.createElement("h3");
    const subtext = document.createElement("p");
    const deleteButton = document.createElement("button");
    const fields = document.createElement("div");

    fieldset.className = "document-card";
    legend.textContent = `文書 ${index + 1}`;
    header.className = "document-card__header";
    headerText.className = "document-card__heading";
    title.textContent = documentItem?.title?.trim() || documentItem?.no?.trim() || `文書 ${index + 1}`;
    subtext.textContent = "各項目の変更は JSON テキストと下書き保存へ即時反映されます。";
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.dataset.action = "remove-document";
    deleteButton.dataset.index = String(index);
    deleteButton.textContent = "この文書を削除";
    fields.className = "document-card__fields";

    headerText.append(title, subtext);
    header.append(headerText, deleteButton);

    for (const field of DOCUMENT_FIELDS) {
      fields.append(createDocumentField(index, field, documentItem));
    }

    fieldset.append(legend, header, fields);
    editorElements.documentList.append(fieldset);
  });

  updateDocumentSummary(documents.length);
  setDocumentState(documents.length
    ? "個別フォームと JSON テキストは同期中です。必要に応じて整形やダウンロードも続けて実行できます。"
    : "有効な JSON です。必要なら「文書を追加」から documents を作成してください。");
  setDocumentsEditorEnabled(isEditorJsonValid);
}

function validateEditorContent() {
  try {
    const { parsed } = parseEditorJson();
    isEditorJsonValid = true;
    setStatus("success", "有効な JSON です", "この内容は整形・圧縮・ダウンロードできます。");
    renderDocumentForms(parsed);
    return true;
  } catch (error) {
    isEditorJsonValid = false;
    setStatus("error", "JSON を解析できません", buildParseErrorMessage(error, editorElements.editor.value));
    setDocumentState("JSON が無効なため、documents フォームは現在の表示のまま更新を停止しています。修正すると再同期します。");
    setDocumentsEditorEnabled(false);
    return false;
  }
}

function replaceEditorContent(nextContent, statusMessage) {
  editorElements.editor.value = nextContent;
  saveDraft();
  isEditorJsonValid = true;
  setStatus("success", statusMessage.title, statusMessage.detail);
  renderDocumentForms(JSON.parse(nextContent));
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

function syncEditorFromParsed(parsed) {
  editorElements.editor.value = `${JSON.stringify(parsed, null, 2)}\n`;
  isEditorJsonValid = true;
  saveDraft();
}

function updateDocumentField(index, fieldName, value) {
  try {
    const { parsed } = parseEditorJson();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return;
    }

    if (!Array.isArray(parsed.documents) || !parsed.documents[index] || typeof parsed.documents[index] !== "object") {
      return;
    }

    parsed.documents[index][fieldName] = value;
    syncEditorFromParsed(parsed);
  } catch (error) {
    setStatus("error", "documents を更新できません", buildParseErrorMessage(error, editorElements.editor.value));
    isEditorJsonValid = false;
    setDocumentsEditorEnabled(false);
  }
}

function addDocument() {
  try {
    const { parsed } = parseEditorJson();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return;
    }

    if (!Array.isArray(parsed.documents)) {
      parsed.documents = [];
    }

    parsed.documents.push({
      no: "",
      category: "",
      categoryName: "",
      title: "",
      date: "",
      url: ""
    });

    syncEditorFromParsed(parsed);
    renderDocumentForms(parsed);

    const lastNoField = editorElements.documentList.querySelector(`input[data-index="${parsed.documents.length - 1}"][data-field="no"]`);
    if (lastNoField) {
      lastNoField.focus();
    }
  } catch (error) {
    setStatus("error", "文書を追加できません", buildParseErrorMessage(error, editorElements.editor.value));
  }
}

function removeDocument(index) {
  try {
    const { parsed } = parseEditorJson();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !Array.isArray(parsed.documents)) {
      return;
    }

    parsed.documents.splice(index, 1);
    syncEditorFromParsed(parsed);
    renderDocumentForms(parsed);
  } catch (error) {
    setStatus("error", "文書を削除できません", buildParseErrorMessage(error, editorElements.editor.value));
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
    setDocumentState("初期 JSON を読み込めなかったため、documents フォームはまだ表示できません。");
    setDocumentsEditorEnabled(false);
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

editorElements.documentList.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || !isEditorJsonValid) {
    return;
  }

  const index = Number(target.dataset.index);
  const fieldName = target.dataset.field;
  if (!Number.isInteger(index) || !fieldName) {
    return;
  }

  updateDocumentField(index, fieldName, target.value);
});

editorElements.documentList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || !isEditorJsonValid) {
    return;
  }

  if (target.dataset.action === "remove-document") {
    const index = Number(target.dataset.index);
    if (Number.isInteger(index)) {
      removeDocument(index);
    }
  }
});

editorElements.addDocumentButton.addEventListener("click", addDocument);
editorElements.validateButton.addEventListener("click", validateEditorContent);
editorElements.formatButton.addEventListener("click", () => formatJson(2));
editorElements.minifyButton.addEventListener("click", () => formatJson(0));
editorElements.downloadButton.addEventListener("click", downloadJson);
editorElements.clearButton.addEventListener("click", () => {
  editorElements.editor.value = "";
  updateCurrentFileName(DEFAULT_FILE_NAME);
  localStorage.removeItem(EDITOR_STORAGE_KEY);
  isEditorJsonValid = false;
  editorElements.documentList.replaceChildren();
  updateDocumentSummary(0);
  setDocumentState("JSON をクリアしました。新しい JSON を貼り付けるか、ローカルファイルを読み込んでください。");
  setDocumentsEditorEnabled(false);
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
