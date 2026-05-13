const state = {
  dataset: null,
  filters: {
    catalog: "",
    status: "",
    family: "",
    query: "",
    likelyOnly: false
  }
};

const elements = {
  statline: document.getElementById("statline"),
  groupList: document.getElementById("group-list"),
  catalogFilter: document.getElementById("catalog-filter"),
  statusFilter: document.getElementById("status-filter"),
  familyFilter: document.getElementById("family-filter"),
  searchFilter: document.getElementById("search-filter"),
  likelyFilter: document.getElementById("likely-filter"),
  refreshButton: document.getElementById("refresh-button"),
  applyButton: document.getElementById("apply-button"),
  familyOptions: document.getElementById("family-options"),
  cardTemplate: document.getElementById("card-template")
};

wireEvents();
loadAudit();

async function loadAudit() {
  setBusy(true);
  try {
    const response = await fetch("/api/audit");
    state.dataset = await response.json();
    populateFilters();
    render();
  } catch (error) {
    renderError(error);
  } finally {
    setBusy(false);
  }
}

function wireEvents() {
  elements.catalogFilter.addEventListener("change", () => {
    state.filters.catalog = elements.catalogFilter.value;
    render();
  });
  elements.statusFilter.addEventListener("change", () => {
    state.filters.status = elements.statusFilter.value;
    render();
  });
  elements.familyFilter.addEventListener("change", () => {
    state.filters.family = elements.familyFilter.value;
    render();
  });
  elements.searchFilter.addEventListener("input", () => {
    state.filters.query = elements.searchFilter.value.trim().toLowerCase();
    render();
  });
  elements.likelyFilter.addEventListener("change", () => {
    state.filters.likelyOnly = elements.likelyFilter.checked;
    render();
  });
  elements.refreshButton.addEventListener("click", loadAudit);
  elements.applyButton.addEventListener("click", applyReviewedChanges);
}

function populateFilters() {
  if (!state.dataset) {
    return;
  }

  const catalogs = [...new Set(state.dataset.rows.map((row) => row.catalogLabel))].sort();
  elements.catalogFilter.innerHTML =
    '<option value="">All catalogs</option>' +
    catalogs.map((catalog) => `<option value="${escapeHtml(catalog)}">${escapeHtml(catalog)}</option>`).join("");

  elements.familyFilter.innerHTML =
    '<option value="">All families</option>' +
    state.dataset.families
      .map((family) => `<option value="${escapeHtml(family)}">${escapeHtml(family)}</option>`)
      .join("");

  elements.familyOptions.innerHTML = state.dataset.families
    .map((family) => `<option value="${escapeHtml(family)}"></option>`)
    .join("");
}

function render() {
  if (!state.dataset) {
    return;
  }

  renderStats();

  const visibleRows = filterRows(state.dataset.rows);
  const grouped = new Map();
  for (const row of visibleRows) {
    const family = row.review.reviewedFamily || row.colorFamily;
    const list = grouped.get(family) || [];
    list.push(row);
    grouped.set(family, list);
  }

  const entries = [...grouped.entries()].sort((left, right) => left[0].localeCompare(right[0]));
  if (entries.length === 0) {
    elements.groupList.innerHTML = '<div class="empty">No rows match the current filters.</div>';
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const [family, rows] of entries) {
    const section = document.createElement("section");
    section.className = "family-group";
    section.innerHTML = `
      <div class="family-header">
        <div>
          <h2>${escapeHtml(family)}</h2>
          <p>${rows.length} rows in view</p>
        </div>
      </div>
      <div class="card-grid"></div>
    `;

    const grid = section.querySelector(".card-grid");
    rows.forEach((row) => grid.appendChild(renderCard(row)));
    fragment.appendChild(section);
  }

  elements.groupList.innerHTML = "";
  elements.groupList.appendChild(fragment);
}

function renderStats() {
  const rows = state.dataset.rows;
  const totals = {
    total: rows.length,
    likelyIncorrect: rows.filter((row) => row.likelyIncorrect).length,
    reviewed: rows.filter((row) => row.review.status !== "unreviewed").length,
    changed: rows.filter((row) => row.review.status === "changed").length,
    needsResearch: rows.filter((row) => row.review.status === "needs-research").length
  };
  const stats = [
    ["Total rows", totals.total],
    ["Likely wrong", totals.likelyIncorrect],
    ["Reviewed", totals.reviewed],
    ["Changed", totals.changed],
    ["Needs research", totals.needsResearch]
  ];

  elements.statline.innerHTML = stats
    .map(
      ([label, value]) => `
        <div class="stat">
          <strong>${value}</strong>
          <span>${escapeHtml(label)}</span>
        </div>
      `
    )
    .join("");
}

function renderCard(row) {
  const node = elements.cardTemplate.content.firstElementChild.cloneNode(true);
  const swatch = node.querySelector(".swatch");
  const code = node.querySelector(".code");
  const name = node.querySelector(".name");
  const meta = node.querySelector(".meta");
  const chips = node.querySelector(".chips");
  const reasons = node.querySelector(".reasons");
  const statusSelect = node.querySelector(".status-select");
  const familyInput = node.querySelector(".family-input");
  const notesInput = node.querySelector(".notes-input");
  const confirmButton = node.querySelector(".confirm-button");
  const researchButton = node.querySelector(".research-button");

  if (row.likelyIncorrect) {
    node.classList.add("likely");
  }

  swatch.style.background = row.hexRgb;
  code.textContent = row.colorCode;
  name.textContent = row.colorName;
  meta.textContent = `${row.catalogLabel}  •  current ${row.colorFamily}  •  ${row.hexRgb}`;
  reasons.textContent = row.reasons.join(" ") || "No automatic concerns on this row.";

  const chipMarkup = [
    row.likelyIncorrect ? '<span class="chip warn">Likely wrong</span>' : "",
    `<span class="chip">Suggested ${escapeHtml(row.suggestedFamily)}</span>`,
    ...row.sharedCodeFamilies.map((family) => `<span class="chip warn">Other catalog: ${escapeHtml(family)}</span>`)
  ]
    .filter(Boolean)
    .join("");
  chips.innerHTML = chipMarkup;

  statusSelect.value = row.review.status;
  familyInput.value = row.review.reviewedFamily;
  notesInput.value = row.review.notes;

  statusSelect.addEventListener("change", () => saveRow(row, statusSelect.value, familyInput.value, notesInput.value));
  familyInput.addEventListener("change", () => {
    if (familyInput.value && statusSelect.value === "unreviewed") {
      statusSelect.value = "changed";
    }
    saveRow(row, statusSelect.value, familyInput.value, notesInput.value);
  });
  notesInput.addEventListener("change", () => saveRow(row, statusSelect.value, familyInput.value, notesInput.value));

  confirmButton.addEventListener("click", () => {
    statusSelect.value = "confirmed";
    familyInput.value = row.colorFamily;
    saveRow(row, "confirmed", row.colorFamily, notesInput.value);
  });

  researchButton.addEventListener("click", () => {
    statusSelect.value = "needs-research";
    if (!familyInput.value) {
      familyInput.value = row.colorFamily;
    }
    saveRow(row, "needs-research", familyInput.value, notesInput.value);
  });

  return node;
}

function filterRows(rows) {
  return rows.filter((row) => {
    const activeFamily = row.review.reviewedFamily || row.colorFamily;
    const blob = `${row.colorCode} ${row.colorName} ${row.catalogLabel} ${row.review.notes}`.toLowerCase();

    if (state.filters.catalog && row.catalogLabel !== state.filters.catalog) {
      return false;
    }
    if (state.filters.status && row.review.status !== state.filters.status) {
      return false;
    }
    if (state.filters.family && activeFamily !== state.filters.family) {
      return false;
    }
    if (state.filters.query && !blob.includes(state.filters.query)) {
      return false;
    }
    if (state.filters.likelyOnly && !row.likelyIncorrect) {
      return false;
    }
    return true;
  });
}

async function saveRow(row, status, reviewedFamily, notes) {
  await fetch("/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: row.key,
      status,
      reviewedFamily,
      notes
    })
  });

  row.review.status = status;
  row.review.reviewedFamily = reviewedFamily.trim();
  row.review.notes = notes.trim();
  render();
}

async function applyReviewedChanges() {
  const confirmed = window.confirm(
    "Apply reviewed family changes back into data/reference CSVs and regenerate fixtures?"
  );
  if (!confirmed) {
    return;
  }

  setBusy(true);
  try {
    const response = await fetch("/api/apply", { method: "POST" });
    const payload = await response.json();
    const count = payload.result.updatedRows.length;
    window.alert(`Applied ${count} reviewed family changes. Reloading audit data.`);
    await loadAudit();
  } catch (error) {
    window.alert(`Apply failed: ${error.message || error}`);
  } finally {
    setBusy(false);
  }
}

function renderError(error) {
  elements.groupList.innerHTML = `<div class="empty">Unable to load audit data: ${escapeHtml(
    String(error.message || error)
  )}</div>`;
}

function setBusy(busy) {
  elements.refreshButton.disabled = busy;
  elements.applyButton.disabled = busy;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
