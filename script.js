/* ============================================================================
    ГЛОБАЛЬНЫЕ ДАННЫЕ
============================================================================ */

let risks = [];
let pendingDeleteId = null;

/* ============================================================================
    GITHUB STORAGE (READ = public RAW, WRITE = API + token)
============================================================================ */

const RAW_JSON_URL =
  "https://raw.githubusercontent.com/pkogtev/pkogtev.github.io/main/data/risks.json";

const GITHUB_API_URL =
  "https://api.github.com/repos/pkogtev/pkogtev.github.io/contents/data/risks.json";

let token = localStorage.getItem("github_token") || null;

/* --------------------------------------------------------------------------
    Токен: проверка + запрос
--------------------------------------------------------------------------- */

async function validateToken(token) {
    try {
        const res = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.ok;
    } catch {
        return false;
    }
}

async function requireToken() {
    if (!token) {
        token = prompt("Введите GitHub токен (github_pat_...)");

        if (!token) {
            alert("Требуется токен для редактирования данных.");
            return false;
        }
    }

    const ok = await validateToken(token);
    if (!ok) {
        alert("Неверный токен. Проверьте правильность или создайте новый.");
        token = null;
        localStorage.removeItem("github_token");
        return false;
    }

    localStorage.setItem("github_token", token);
    return true;
}

/* ============================================================================
    ЗАГРУЗКА ДАННЫХ (без токена)
============================================================================ */

async function loadRisks() {
    try {
        const response = await fetch(RAW_JSON_URL);

        if (!response.ok) throw new Error("Ошибка загрузки данных");

        risks = await response.json();

        renderTable();
        fillFilters();
    } catch (e) {
        console.error("Ошибка чтения JSON:", e);
    }
}
loadRisks();


/* ============================================================================
    СОХРАНЕНИЕ (только при наличии токена)
============================================================================ */

async function saveToGitHub() {
    if (!(await requireToken())) return;

    try {
        // получаем SHA
        const shaRes = await fetch(GITHUB_API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const shaJson = await shaRes.json();
        const sha = shaJson.sha;

        // кодируем JSON
        const content = btoa(
            unescape(
                encodeURIComponent(JSON.stringify(risks, null, 2))
            )
        );

        const res = await fetch(GITHUB_API_URL, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                message: "Update risks.json",
                content,
                sha
            })
        });

        if (!res.ok) {
            alert("Ошибка сохранения данных (проверьте токен)");
            return;
        }

        alert("Изменения сохранены!");

    } catch (e) {
        console.error("Ошибка сохранения:", e);
        alert("Ошибка сохранения файла.");
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
        const severity = risk.probability * risk.impact;

        let sevClass =
            severity <= 5 ? "low" :
            severity <= 10 ? "medium" :
            severity <= 15 ? "high" : "critical";

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

            <td>
                <button class="btn-delete" onclick="askDelete(${risk.id})">
                    🗑
                </button>
            </td>
        `;

        body.appendChild(row);
    });
}


/* ============================================================================
    INLINE РЕДАКТИРОВАНИЕ (только с токеном)
============================================================================ */

async function editField(id, field) {
    if (!(await requireToken())) return;

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

async function editNumberField(id, field) {
    if (!(await requireToken())) return;

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
    ДОБАВЛЕНИЕ РИСКА (только при токене)
============================================================================ */

async function addRisk(e) {
    if (!(await requireToken())) return;

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

async function confirmDelete() {
    if (pendingDeleteId !== null) {
        await deleteRisk(pendingDeleteId);
    }
    closeConfirm();
}

async function deleteRisk(id) {
    if (!(await requireToken())) return;

    risks = risks.filter(r => r.id !== id);
    saveToGitHub();
    renderTable();
}

