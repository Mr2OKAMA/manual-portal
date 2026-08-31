const state = { query: "", category: "" };
const STORAGE_KEY = "manual-hub-documents";
let categories = [];

async function loadDocuments() {
  try {
    const response = await fetch("./manuals.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: manuals.json が見つかりません。リポジトリルートで python3 -m http.server 8000 を実行してください。`);
    }
    
    const metadata = await response.json();
    if (!Array.isArray(metadata.categories) || !Array.isArray(metadata.documents)) {
      throw new Error("手順書メタデータの形式が不正です。");
    }
    categories = metadata.categories;
    
    const savedDocuments = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const removedNumbers = new Set(savedDocuments.filter((item) => item.deleted).map((item) => item.no));
    const dateOverrides = new Map(savedDocuments.filter((item) => item.override).map((item) => [item.no, item.date]));
    const addedDocuments = savedDocuments.filter((item) => !item.deleted && !item.override);
    const baseDocuments = metadata.documents.filter((item) => !removedNumbers.has(item.no)).map((item) => ({ ...item, date: dateOverrides.get(item.no) || item.date }));
    return [...baseDocuments, ...addedDocuments];
  } catch (error) {
    console.error("Error loading documents:", error);
    throw error;
  }
}

const elements = {
  search: document.querySelector("#search-input"),
  filter: document.querySelector("#category-filter"),
  list: document.querySelector("#manual-list"),
  empty: document.querySelector("#empty-state"),
  total: document.querySelector("#total-count"),
  summary: document.querySelector("#category-summary"),
  resultCount: document.querySelector("#result-count"),
  resultsLabel: document.querySelector("#results-label")
};

function normalize(value) {
  return value.toLocaleLowerCase("ja-JP").replace(/\s/g, "");
}

function formatDate(date) {
  return date.replaceAll("-", ".");
}

function renderCategoryOptions() {
  elements.filter.insertAdjacentHTML("beforeend", categories.map(({ code, name }) => `<option value="${code}">${code} ${name}</option>`).join(""));
}

function renderSummary(items) {
  elements.total.textContent = items.length;
  elements.summary.innerHTML = categories.map(({ code, name }) => {
    const count = items.filter((item) => item.category === code).length;
    return `<div class="summary-item"><span class="summary-item__code">${code}</span><span>${name}</span><strong>${count}<small>件</small></strong></div>`;
  }).join("");
}

function getFilteredDocuments(items) {
  const query = normalize(state.query);
  return items.filter((item) => {
    const matchesQuery = !query || normalize(`${item.no}${item.title}`).includes(query);
    return matchesQuery && (!state.category || item.category === state.category);
  });
}

function renderList(items) {
  const filteredDocuments = getFilteredDocuments(items);
  elements.resultCount.textContent = `${filteredDocuments.length}件`;
  elements.resultsLabel.textContent = state.query || state.category ? "検索結果" : "マニュアル一覧";
  elements.list.innerHTML = filteredDocuments.map((item) => `
    <tr>
      <td><span class="document-number">${item.no}</span></td>
      <td><span class="category-tag category-tag--${item.category}">${item.categoryName}</span></td>
      <td class="title-cell">${item.title}</td>
      <td class="date-cell">${formatDate(item.date)}</td>
      <td class="action-column"><a class="open-link" href="${item.url}" target="_blank" rel="noopener noreferrer">開く <span aria-hidden="true">↗</span></a></td>
    </tr>`).join("");
  elements.empty.hidden = filteredDocuments.length !== 0;
}

async function initialize() {
  try {
    const loadedDocuments = await loadDocuments();
    renderCategoryOptions();
    renderSummary(loadedDocuments);
    renderList(loadedDocuments);

    elements.search.addEventListener("input", (event) => {
      state.query = event.target.value;
      renderList(loadedDocuments);
    });
    elements.filter.addEventListener("change", (event) => {
      state.category = event.target.value;
      renderList(loadedDocuments);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "/" && document.activeElement !== elements.search) {
        event.preventDefault();
        elements.search.focus();
      }
    });
  } catch (error) {
    console.error(error);
    elements.empty.hidden = false;
    elements.empty.querySelector("strong").textContent = "手順書情報を読み込めませんでした";
    elements.empty.querySelector("p").textContent = error.message || "manuals.json の内容と公開設定を確認してください。";
  }
}

initialize();