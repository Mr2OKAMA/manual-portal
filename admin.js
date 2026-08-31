const STORAGE_KEY = "manual-hub-documents";
let metadata = { categories: [], documents: [] };
const savedDocuments = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const categorySelect = document.querySelector("#admin-category");
const form = document.querySelector("#manual-form");
const list = document.querySelector("#admin-list");
const message = document.querySelector("#form-message");
const search = document.querySelector("#admin-search");
const resultCount = document.querySelector("#admin-result-count");
const empty = document.querySelector("#admin-empty");

function persist(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

async function loadMetadata() {
  try {
    // シンプルな相対パスで読み込む
    const response = await fetch("./manuals.json");
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: manuals.json が見つかりません。リポジトリルートで python3 -m http.server 8000 を実行してください。`);
    }
    
    const loadedMetadata = await response.json();
    if (!Array.isArray(loadedMetadata.categories) || !Array.isArray(loadedMetadata.documents)) {
      throw new Error("手順書メタデータの形式が不正です。categories と documents は配列である必要があります。");
    }
    metadata = loadedMetadata;
  } catch (error) {
    console.error("Metadata loading error:", error);
    throw new Error(`メタデータ読み込みエラー: ${error.message}`);
  }
}

function allDocuments() {
  const saved = savedDocuments();
  const removed = new Set(saved.filter((item) => item.deleted).map((item) => item.no));
  const dateOverrides = new Map(saved.filter((item) => item.override).map((item) => [item.no, item.date]));
  return [...metadata.documents.filter((item) => !removed.has(item.no)).map((item) => ({ ...item, date: dateOverrides.get(item.no) || item.date })), ...saved.filter((item) => !item.deleted && !item.override)];
}

function renderCategories() {
  categorySelect.innerHTML = metadata.categories.map(({ code, name }) => `<option value="${code}">${code} ${name}</option>`).join("");
}

function renderList() {
  const query = search.value.toLocaleLowerCase("ja-JP").replace(/\s/g, "");
  const filteredDocuments = allDocuments().filter((item) => !query || `${item.no}${item.title}${item.categoryName}`.toLocaleLowerCase("ja-JP").replace(/\s/g, "").includes(query));
  resultCount.textContent = `${filteredDocuments.length}件`;
  list.innerHTML = filteredDocuments.map((item) => `<div class="admin-list__item"><div><strong>${item.no}</strong><span>${item.title}</span><small>${item.categoryName}</small></div><label class="delete-label"><input class="delete-button" type="checkbox" data-no="${item.no}"><span>削除</span></label><div class="date-update"><input class="date-input" type="date" value="${item.date}" data-date-no="${item.no}"><button class="update-button" data-save-date="${item.no}">更新</button></div></div>`).join("");
  empty.hidden = filteredDocuments.length !== 0;
  list.querySelectorAll(".delete-button").forEach((button) => button.addEventListener("click", () => removeDocument(button.dataset.no)));
  list.querySelectorAll("[data-save-date]").forEach((button) => button.addEventListener("click", () => updateDate(button.dataset.saveDate)));
}

function updateDate(no) {
  const input = list.querySelector(`[data-date-no="${no}"]`);
  if (!input.value) return;
  const target = allDocuments().find((item) => item.no === no);
  const saved = savedDocuments().filter((item) => item.no !== no && !(item.override && item.no === no));
  if (metadata.documents.some((item) => item.no === no)) {
    saved.push({ no, date: input.value, override: true });
  } else {
    saved.push({ ...target, date: input.value });
  }
  persist(saved);
  renderList();
  message.textContent = "改訂日を更新しました。一覧画面にも反映されています。";
  message.className = "form-message form-message--success";
}

function removeDocument(no) {
  const target = allDocuments().find((item) => item.no === no);
  if (!target || !window.confirm(`「${target.title}」を削除しますか？`)) return;
  const saved = savedDocuments().filter((item) => item.no !== no);
  if (metadata.documents.some((item) => item.no === no)) saved.push({ no, deleted: true });
  persist(saved);
  renderList();
}

function registerDocument(event) {
  event.preventDefault();
  const formData = new FormData(form);
  const category = metadata.categories.find((item) => item.code === formData.get("category"));
  const item = { no: formData.get("no").trim(), category: category.code, categoryName: category.name, title: formData.get("title").trim(), date: formData.get("date"), url: formData.get("url").trim() };
  if (!form.reportValidity()) return;
  if (allDocuments().some((document) => document.no === item.no)) {
    message.textContent = "この文書番号はすでに登録されています。";
    message.className = "form-message form-message--error";
    return;
  }
  persist([...savedDocuments().filter((document) => document.no !== item.no), item]);
  form.reset();
  message.textContent = "登録しました。一覧画面に反映されています。";
  message.className = "form-message form-message--success";
  renderList();
}

async function initialize() {
  try {
    await loadMetadata();
    renderCategories();
    renderList();
    form.addEventListener("submit", registerDocument);
    search.addEventListener("input", renderList);
  } catch (error) {
    console.error(error);
    message.textContent = error.message || "手順書情報を読み込めませんでした。";
    message.className = "form-message form-message--error";
  }
}

initialize();