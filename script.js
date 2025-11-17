/* ============================================================================
    ГЛОБАЛЬНЫЕ ДАННЫЕ
============================================================================ */

let risks = [];
let pendingDeleteId = null;

/* ============================================================================
    GITHUB API CONFIG
============================================================================ */

// При первом запуске введите токен
const token = localStorage.getItem('github_token') || prompt('Введите GitHub Token:');
if (token) {
    localStorage.setItem('github_token', token);
    GITHUB_CONFIG.token = token;
}

const GITHUB_CONFIG = {
    owner: "pkogtev",
    repo: "pkogtev.github.io",
    path: "data/risks.json",
    token: "YOUR_GITHUB_TOKEN_HERE" // <-- ВСТАВЬ ТОКЕН
};

const token = localStorage.getItem('github_token') || prompt('Введите GitHub Token:');
if (token) {
    localStorage.setItem('github_token', token);
    GITHUB_CONFIG.token = token;
}

const GITHUB_API_URL =
    `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;


/* ============================================================================
    ЗАГРУЗКА ДАННЫХ ИЗ GITHUB (исправлено!)
============================================================================ */

async function loadRisks() {
    try {
        const response = await fetch(GITHUB_API_URL, {
            headers: {
                "Authorization": `Bearer ${GITHUB_CONFIG.token}`,
                "Accept": "application/vnd.github+json"
            }
        });

        if (!response.ok) {
            console.error("Ошибка загрузки файла:", response.status);
            return;
        }

        const data = await response.json();

        if (!data || !data.content) {
            console.warn("Файл пустой или повреждён.");
            risks = [];
            renderTable();
            return;
        }

        // GitHub content → base64 → json
        const decoded = decodeURIComponent(escape(atob(data.content)));
        risks = JSON.parse(decoded);

        renderTable();
        fillFilters();

    } catch (e) {
        console.error("Ошибка loadRisks():", e);
    }
}

loadRisks();


/* ============================================================================
    СОХРАНЕНИЕ НА GITHUB
============================================================================ */

async function getCurrentSHA() {
    const response = await fetch(GITHUB_API_URL, {
        headers: { "Authorization": `Bearer ${GITHUB_CONFIG.token}` }
    });

    if (!response.ok) {
        throw new Error("Не удалось получить SHA");
    }

    const data = await response.json();
    return data.sha;
}

async function saveToGitHub() {
    try {
        const sha = await getCurrentSHA();
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(risks, null, 2))));

        await fetch(GITHUB_API_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GITHUB_CONFIG.token}`
            },
            body: JSON.stringify({
                message: "Update risks.json",
                content,
                sha
            })
        });

    } catch (e) {
        console.error("Ошибка сохранения на GitHub:", e);
    }
}


/* ============================================================================
    РЕНДЕР ТАБЛИЦЫ
============================================================================ */

function renderTable(filtered = null) {
    const list = filtered || risks;
    const body = document.getElementById("risksTableBody");
    body.innerHTML = "";

    list.forEach(risk => {
        const severity = (risk.probability || 0) * (risk.impact || 0);

        let sevClass =
            severity <= 5 ? "low" :
            severity <= 10 ? "medium" :
            severity <= 15 ? "high" : "critical";

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td><input type="checkbox" class="row-check" data-id="${risk.id}"></td>

            <td class="editable" onclick="editField(${risk.id}, 'step')">${risk.step || ""}</td>
            <td class="editable" onclick="editField(${risk.id}, 'teams')">${risk.teams || ""}</td>
            <td class="editable" onclick="editField(${risk.id}, 'mainRisk')">${risk.mainRisk || ""}</td>
            <td class="editable" onclick="editField(${risk.id}, 'r')">${risk.r || ""}</td>
            <td class="editable" onclick="editField(${risk.id}, 'a')">${risk.a || ""}</td>

            <td class="editable" onclick="editNumberField(${risk.id}, 'probability')">${risk.probability || 0}</td>
            <td class="editable" onclick="editNumberField(${risk.id}, 'impact')">${risk.impact || 0}</td>

            <td><span class="severity-badge severity-${sevClass}">${severity}</span></td>

            <td>
                <button class="btn-delete" onclick="askDelete(${risk.id})">
                    <img class="delete-icon" 
                        src="data:image/svg+xml;utf8,
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor'>
                            <path d='M5.5 5.5a.5.5 0 0 1 .5.5v6
                            a.5.5 0 0 1-1 0V6a.5.5 0 
                            0 1 .5-.5zm3 0a.5.5 0 0 1 
                            .5.5v6a.5.5 0 1-1 0V6a.5.5 0 
                            0 1 .5-.5zm-6-2A1.5 1.5 0 0 1 4 2h8
                            a1.5 1.5 0 0 1 1.5 1.5V4h-11V3.5z'/>
                        </svg>">
                </button>
            </td>
        `;

        body.appendChild(tr);
    });

    // если подключён дашборд → обновляем графики
    if (typeof renderCharts === "function") {
        renderCharts();
    }
}


/* ============================================================================
    INLINE EDIT
============================================================================ */

function editField(id, field) {
    const risk = risks.find(r => r.id === id);
    const td = event.target;

    const input = document.createElement("input");
    input.value = risk[field] || "";
    input.className = "editable-input";

    td.replaceWith(input);
    input.focus();

    input.addEventListener("blur", () => {
        risk[field] = input.value.trim();
        saveToGitHub();
        renderTable();
    });
}

function editNumberField(id, field) {
    const risk = risks.find(r => r.id === id);
    const td = event.target;

    const input = document.createElement("input");
    input.type = "number";
    input.min = 1;
    input.max = 5;
    input.value = risk[field] || 0;
    input.className = "editable-input number-input";

    td.replaceWith(input);
    input.focus();

    input.addEventListener("blur", () => {
        risk[field] = Number(input.value);
        saveToGitHub();
        renderTable();
    });
}


/* ============================================================================
    МОДАЛКА — ДОБАВЛЕНИЕ
============================================================================ */

function openModal() {
    document.getElementById("modalOverlay").classList.add("active");
    document.getElementById("stepsContainer").innerHTML = "";
    document.getElementById("scenarioName").value = "";
}

function closeModal() {
    document.getElementById("modalOverlay").classList.remove("active");
}

function closeModalOnOverlay(e) {
    if (e.target.id === "modalOverlay") closeModal();
}

function addStep() {
    const container = document.getElementById("stepsContainer");

    const id = Date.now() + Math.random();

    const div = document.createElement("div");
    div.className = "step-item";
    div.dataset.stepId = id;

    div.innerHTML = `
        <div class="step-header">
            <strong>Шаг</strong>
            <button class="btn-delete" onclick="this.parentElement.parentElement.remove()">
                Удалить шаг
            </button>
        </div>

        <div class="form-group">
            <label>Название шага *</label>
            <input type="text" class="step-name" required>
        </div>

        <h4 style="margin-top:15px;">Риски</h4>
        <div class="risks-list"></div>

        <button class="btn btn-secondary" style="margin-top:10px;" onclick="addRiskItem(this)">
            + Добавить риск
        </button>
    `;

    container.appendChild(div);
}

function addRiskItem(btn) {
    const list = btn.previousElementSibling;

    const div = document.createElement("div");
    div.className = "risk-item";

    div.innerHTML = `
        <div class="risk-item-header">
            <strong>Риск</strong>
            <button class="btn-delete" onclick="this.parentElement.parentElement.remove()">Удалить</button>
        </div>

        <div class="form-group">
            <label>Команды *</label>
            <input type="text" class="risk-teams" required>
        </div>

        <div class="form-group">
            <label>Основной риск *</label>
            <input type="text" class="risk-main" required>
        </div>

        <div class="form-row-3">
            <div class="form-group">
                <label>R *</label>
                <input type="text" class="risk-r" required>
            </div>

            <div class="form-group">
                <label>A *</label>
                <input type="text" class="risk-a" required>
            </div>

            <div class="form-group">
                <label>Влияние (1–5) *</label>
                <input type="number" class="risk-impact" min="1" max="5" required>
            </div>
        </div>

        <div class="form-group">
            <label>Вероятность (1–5) *</label>
            <input type="number" class="risk-probability" min="1" max="5" required>
        </div>
    `;

    list.appendChild(div);
}


/* ============================================================================
    СОХРАНЕНИЕ НОВЫХ РИСКОВ
============================================================================ */

function addRisk(e) {
    e.preventDefault();

    const scenarioName = document.getElementById("scenarioName").value.trim();
    const steps = document.querySelectorAll(".step-item");

    steps.forEach(step => {
        const stepName = step.querySelector(".step-name").value.trim();

        step.querySelectorAll(".risk-item").forEach(item => {
            const teams = item.querySelector(".risk-teams").value.trim();
            const mainRisk = item.querySelector(".risk-main").value.trim();
            const r = item.querySelector(".risk-r").value.trim();
            const a = item.querySelector(".risk-a").value.trim();
            const probability = Number(item.querySelector(".risk-probability").value);
            const impact = Number(item.querySelector(".risk-impact").value);

            risks.push({
                id: Date.now() + Math.random(),
                scenario: scenarioName,
                step: stepName,
                teams,
                mainRisk,
                r,
                a,
                probability,
                impact,
                severity: probability * impact
            });
        });
    });

    saveToGitHub();
    renderTable();
    closeModal();
}


/* ============================================================================
    ФИЛЬТРЫ
============================================================================ */

function fillFilters() {
    const teamSet = new Set();
    const typeSet = new Set();

    risks.forEach(r => {
        (r.teams || "").split(",").map(x => x.trim()).forEach(t => teamSet.add(t));
        typeSet.add(r.mainRisk);
    });

    const teamSelect = document.getElementById("filterTeam");
    const typeSelect = document.getElementById("filterType");

    if (!teamSelect || !typeSelect) return;

    teamSelect.innerHTML = `<option value="">Все</option>`;
    typeSelect.innerHTML = `<option value="">Все</option>`;

    [...teamSet].forEach(t => {
        if (t) teamSelect.innerHTML += `<option value="${t}">${t}</option>`;
    });

    [...typeSet].forEach(t => {
        if (t) typeSelect.innerHTML += `<option value="${t}">${t}</option>`;
    });
}

function applyFilters() {
    let filtered = [...risks];

    const scenario = (document.getElementById("searchScenario")?.value || "").toLowerCase();
    const team = document.getElementById("filterTeam")?.value;
    const type = document.getElementById("filterType")?.value;

    if (scenario) {
        filtered = filtered.filter(r =>
            (r.scenario || "").toLowerCase().includes(scenario)
        );
    }

    if (team) {
        filtered = filtered.filter(r =>
            (r.teams || "").includes(team)
        );
    }

    if (type) {
        filtered = filtered.filter(r =>
            r.mainRisk === type
        );
    }

    renderTable(filtered);
}


/* ============================================================================
    УДАЛЕНИЕ
============================================================================ */

function askDelete(id) {
    pendingDeleteId = id;
    document.getElementById("confirmPopup").classList.add("active");
}

function closeConfirm() {
    pendingDeleteId = null;
    document.getElementById("confirmPopup").classList.remove("active");
}

function confirmDelete() {
    if (pendingDeleteId !== null) {
        deleteRisk(pendingDeleteId);
    }
    closeConfirm();
}

function deleteRisk(id) {
    risks = risks.filter(r => r.id !== id);
    saveToGitHub();
    renderTable();
}


/* ============================================================================
    МАССОВОЕ УДАЛЕНИЕ
============================================================================ */

function deleteSelected() {
    const selected = document.querySelectorAll(".row-check:checked");

    if (selected.length === 0) {
        alert("Не выбрано ни одного риска");
        return;
    }

    if (!confirm(`Удалить выбранные (${selected.length}) риски?`)) return;

    const ids = [...selected].map(x => Number(x.dataset.id));

    risks = risks.filter(r => !ids.includes(r.id));
    saveToGitHub();
    renderTable();
}

function toggleSelectAll(source) {
    document
        .querySelectorAll(".row-check")
        .forEach(cb => (cb.checked = source.checked));
}


/* ============================================================================
    ИМПОРТ / ЭКСПОРТ JSON (исправлено!)
============================================================================ */

// проверка для избежания ошибок
const loadBtn = document.getElementById("loadJSONBtn");
const fileInput = document.getElementById("fileInput");

if (loadBtn && fileInput) {
    loadBtn.onclick = () => fileInput.click();

    fileInput.addEventListener("change", function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            risks = JSON.parse(reader.result);
            renderTable();
        };
        reader.readAsText(file);
    });
}

function saveToJSON() {
    const blob = new Blob([JSON.stringify(risks, null, 2)], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "risks.json";
    a.click();
}


/* ============================================================================
    СИНХРОНИЗАЦИЯ
============================================================================ */

function syncWithGitHub() {
    loadRisks();
}
