const STORAGE_KEY = "manual-hub-documents";
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

function allDocuments() {
  const saved = savedDocuments();
  const removed = new Set(saved.filter((item) => item.deleted).map((item) => item.no));
  const dateOverrides = new Map(saved.filter((item) => item.override).map((item) => [item.no, item.date]));
  return [...documents.filter((item) => !removed.has(item.no)).map((item) => ({ ...item, date: dateOverrides.get(item.no) || item.date })), ...saved.filter((item) => !item.deleted && !item.override)];
}

function renderCategories() {
  categorySelect.innerHTML = categories.map(({ code, name }) => `<option value="${code}">${code} ${name}</option>`).join("");
}

function renderList() {
  const query = search.value.toLocaleLowerCase("ja-JP").replace(/\s/g, "");
  const filteredDocuments = allDocuments().filter((item) => !query || `${item.no}${item.title}${item.categoryName}`.toLocaleLowerCase("ja-JP").replace(/\s/g, "").includes(query));
  resultCount.textContent = `${filteredDocuments.length}件`;
  list.innerHTML = filteredDocuments.map((item) => `<div class="admin-list__item"><div><strong>${item.no}</strong><span>${item.title}</span><small>${item.categoryName}</small></div><label class="date-editor">改訂日<input type="date" value="${item.date}" data-date-no="${item.no}"></label><button class="date-button" type="button" data-save-date="${item.no}">更新</button><button class="delete-button" type="button" data-no="${item.no}">削除</button></div>`).join("");
  empty.hidden = filteredDocuments.length !== 0;
  list.querySelectorAll(".delete-button").forEach((button) => button.addEventListener("click", () => removeDocument(button.dataset.no)));
  list.querySelectorAll("[data-save-date]").forEach((button) => button.addEventListener("click", () => updateDate(button.dataset.saveDate)));
}

function updateDate(no) {
  const input = list.querySelector(`[data-date-no="${no}"]`);
  if (!input.value) return;
  const target = allDocuments().find((item) => item.no === no);
  const saved = savedDocuments().filter((item) => item.no !== no && !(item.override && item.no === no));
  if (documents.some((item) => item.no === no)) {
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
  if (documents.some((item) => item.no === no)) saved.push({ no, deleted: true });
  persist(saved);
  renderList();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const category = categories.find((item) => item.code === formData.get("category"));
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
});

renderCategories();
renderList();
search.addEventListener("input", renderList);
