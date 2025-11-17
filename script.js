/* ============================================================================
   GLOBAL STATE
============================================================================ */
let risks = [];
let pendingDeleteId = null;

/* ============================================================================
   GITHUB TOKEN (Safe)
============================================================================ */

// при загрузке читаем токен из localStorage
let userToken = localStorage.getItem("github_token");

// если токена нет — показываем только чтение
function requireToken() {
    if (!userToken) {
        alert("Для редактирования нужен GitHub Token");
        return false;
    }
    return true;
}

/* ============================================================================
   GITHUB API CONFIG
============================================================================ */

const GITHUB_CONFIG = {
    owner: "pkogtev",
    repo: "pkogtev.github.io",
    path: "data/risks.json",
};

// API URL (для записи)
const GITHUB_API_URL =
    `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;

// RAW URL (для чтения без токена)
const RAW_URL =
    `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/main/${GITHUB_CONFIG.path}`;


/* ============================================================================
   LOAD JSON FROM GITHUB (READ ONLY)
============================================================================ */

async function loadRisks() {
    try {
        const response = await fetch(RAW_URL);

        if (!response.ok) throw new Error("Ошибка загрузки JSON из GitHub RAW");

        risks = await response.json();
        renderTable();
        fillFilters();
    } catch (e) {
        console.error("Ошибка загрузки данных:", e);
    }
}

loadRisks();

/* ============================================================================
   SAVE TO GITHUB (EDIT MODE)
============================================================================ */

async function saveToGitHub() {
    if (!requireToken()) return;

    const sha = await getCurrentSHA();
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(risks, null, 2))));

    await fetch(GITHUB_API_URL, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userToken}`,
        },
        body: JSON.stringify({
            message: "Update risks.json",
            content,
            sha
        })
    });
}

async function getCurrentSHA() {
    const res = await fetch(GITHUB_API_URL, {
        headers: {
            "Authorization": `Bearer ${userToken}`
        }
    });

    if (!res.ok) throw new Error("Не удалось получить SHA");

    const data = await res.json();
    return data.sha;
}

/* ============================================================================
   TABLE RENDER
============================================================================ */

function renderTable(filtered = null) {
    const list = filtered || risks;
    const body = document.getElementById("risksTableBody");

    body.innerHTML = "";

    list.forEach(risk => {
        const severity = risk.probability * risk.impact;

        let sevClass =
            severity <= 5 ? "low" :
            severity <= 10 ? "medium" :
            severity <= 15 ? "high" :
            "critical";

        const row = document.createElement("tr");

        row.innerHTML = `
            <td><input type="checkbox" class="row-check" data-id="${risk.id}"></td>
            <td class="editable" onclick="editField(${risk.id}, 'step')">${risk.step}</td>
            <td class="editable" onclick="editField(${risk.id}, 'teams')">${risk.teams}</td>
            <td class="editable" onclick="editField(${risk.id}, 'mainRisk')">${risk.mainRisk}</td>
            <td class="editable" onclick="editField(${risk.id}, 'r')">${risk.r}</td>
            <td class="editable" onclick="editField(${risk.id}, 'a')">${risk.a}</td>
            <td class="editable" onclick="editNumberField(${risk.id}, 'probability')">${risk.probability}</td>
            <td class="editable" onclick="editNumberField(${risk.id}, 'impact')">${risk.impact}</td>
            <td><span class="severity-badge severity-${sevClass}">${severity}</span></td>
            <td><button class="btn-delete" onclick="askDelete(${risk.id})">🗑</button></td>
        `;

        body.appendChild(row);
    });
}

/* ============================================================================
   INLINE EDITING
============================================================================ */

function editField(id, field) {
    if (!requireToken()) return;

    const risk = risks.find(r => r.id === id);
    const td = event.target;

    const input = document.createElement("input");
    input.value = risk[field];
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
    if (!requireToken()) return;

    const risk = risks.find(r => r.id === id);
    const td = event.target;

    const input = document.createElement("input");
    input.type = "number";
    input.min = 1;
    input.max = 5;
    input.value = risk[field];
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
   MODAL WINDOW
============================================================================ */

function openModal() {
    document.getElementById("modalOverlay").classList.add("active");
    document.getElementById("riskForm").reset();
    document.getElementById("stepsContainer").innerHTML = "";
    addStep();
}

function closeModal() {
    document.getElementById("modalOverlay").classList.remove("active");
}

function closeModalOnOverlay(e) {
    if (e.target.id === "modalOverlay") {
        closeModal();
    }
}

/* ============================================================================
   ADDING STEP + RISK BLOCKS
============================================================================ */

function addStep() {
    const container = document.getElementById("stepsContainer");

    const block = document.createElement("div");
    block.className = "step-item";
    block.style.marginBottom = "20px";

    block.innerHTML = `
        <div class="form-group">
            <label>Шаг сценария</label>
            <input type="text" class="step-name" required placeholder="Например: Ввод логина">
        </div>

        <div class="risk-item" style="padding-left: 10px; border-left: 2px solid #ccc; margin-bottom: 15px;">
            <div class="form-group">
                <label>Команды</label>
                <input type="text" class="risk-teams" required placeholder="Backend, Frontend">
            </div>
            <div class="form-group">
                <label>Основной риск</label>
                <input type="text" class="risk-main" required placeholder="Ошибка отображения">
            </div>
            <div class="form-group">
                <label>R</label>
                <input type="text" class="risk-r" required placeholder="R1">
            </div>
            <div class="form-group">
                <label>A</label>
                <input type="text" class="risk-a" required placeholder="A1">
            </div>
            <div class="form-group">
                <label>Вероятность (1–5)</label>
                <input type="number" class="risk-probability" min="1" max="5" value="3" required>
            </div>
            <div class="form-group">
                <label>Влияние (1–5)</label>
                <input type="number" class="risk-impact" min="1" max="5" value="3" required>
            </div>
        </div>
    `;

    container.appendChild(block);
}

/* ============================================================================
   SAVE NEW RISK
============================================================================ */

function addRisk(e) {
    e.preventDefault();

    if (!requireToken()) return;

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
                impact
            });
        });
    });

    saveToGitHub();
    renderTable();
    closeModal();
}

/* ============================================================================
   DELETE
============================================================================ */

function askDelete(id) {
    if (!requireToken()) return;

    if (!confirm("Удалить риск?")) return;

    deleteRisk(id);
}

function deleteRisk(id) {
    risks = risks.filter(r => r.id !== id);
    saveToGitHub();
    renderTable();
}

/* ============================================================================
   FILTERS
============================================================================ */

function fillFilters() {
    const teamSet = new Set();
    const typeSet = new Set();

    risks.forEach(r => {
        r.teams.split(",").map(t => t.trim()).forEach(t => teamSet.add(t));
        typeSet.add(r.mainRisk);
    });

    const teamSelect = document.getElementById("filterTeam");
    const typeSelect = document.getElementById("filterType");

    teamSelect.innerHTML = `<option value="">Все</option>`;
    typeSelect.innerHTML = `<option value="">Все</option>`;

    [...teamSet].forEach(t => {
        teamSelect.innerHTML += `<option value="${t}">${t}</option>`;
    });

    [...typeSet].forEach(t => {
        typeSelect.innerHTML += `<option value="${t}">${t}</option>`;
    });
}

function applyFilters() {
    let filtered = [...risks];

    const scenario = document.getElementById("searchScenario").value.toLowerCase();
    const team = document.getElementById("filterTeam").value;
    const type = document.getElementById("filterType").value;

    if (scenario) {
        filtered = filtered.filter(r => r.scenario.toLowerCase().includes(scenario));
    }

    if (team) {
        filtered = filtered.filter(r => r.teams.includes(team));
    }

    if (type) {
        filtered = filtered.filter(r => r.mainRisk === type);
    }

    renderTable(filtered);
}

/* ============================================================================
   IMPORT / EXPORT
============================================================================ */

function saveToJSON() {
    const blob = new Blob([JSON.stringify(risks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "risks.json";
    a.click();
}

document.getElementById("loadJSONBtn").onclick = () =>
    document.getElementById("fileInput").click();

document.getElementById("fileInput").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        risks = JSON.parse(reader.result);
        renderTable();
    };
    reader.readAsText(file);
});

/* ============================================================================
   SYNC
============================================================================ */

function syncWithGitHub() {
    loadRisks();
}

/* ============================================================================
   ENTER TOKEN MANUALLY
============================================================================ */

function enterToken() {
    const token = prompt("Введите GitHub Token:");

    if (token && token.trim().length > 10) {
        userToken = token.trim();
        localStorage.setItem("github_token", userToken);
        alert("Токен сохранён! Теперь можно редактировать.");
    } else {
        alert("Некорректный токен");
    }
}
