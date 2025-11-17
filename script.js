/* ============================================================================
    ГЛОБАЛЬНЫЕ ДАННЫЕ
============================================================================ */

let risks = [];
let editId = null;

/* ============================================================================
    ЗАГРУЗКА ДАННЫХ ИЗ ЛОКАЛЬНОГО JSON (без токена)
============================================================================ */

async function loadRisks() {
    try {
        const response = await fetch("data/risks.json?" + Date.now());

        if (!response.ok) throw new Error("Ошибка загрузки JSON");

        risks = await response.json();
        renderTable();
    } catch (e) {
        console.error("Ошибка загрузки:", e);
    }
}

loadRisks();

/* ============================================================================
    РЕНДЕР ТАБЛИЦЫ
============================================================================ */

function renderTable() {
    const body = document.getElementById("risksTableBody");
    body.innerHTML = "";

    risks.forEach(risk => {
        const severity = risk.probability * risk.impact;
        let sevClass =
            severity <= 5 ? "low" :
            severity <= 10 ? "medium" :
            severity <= 15 ? "high" : "critical";

        const row = document.createElement("tr");

        row.innerHTML = `
            <td><input type="checkbox" class="row-check" data-id="${risk.id}"></td>

            <td>${risk.step}</td>
            <td>${risk.teams}</td>
            <td>${risk.mainRisk}</td>
            <td>${risk.r}</td>
            <td>${risk.a}</td>
            <td>${risk.probability}</td>
            <td>${risk.impact}</td>

            <td>
                <span class="severity-badge severity-${sevClass}">${severity}</span>
            </td>

            <td>
                <button class="btn" onclick="openModal(${risk.id})">✏</button>
                <button class="btn-delete" onclick="deleteRisk(${risk.id})">🗑</button>
            </td>
        `;

        body.appendChild(row);
    });
}

/* ============================================================================
    МОДАЛКА
============================================================================ */

function openModal(id = null) {
    document.getElementById("modalOverlay").classList.add("active");

    editId = id;

    if (id) {
        const r = risks.find(x => x.id === id);
        document.getElementById("modalTitle").innerText = "Редактировать риск";

        document.getElementById("mStep").value = r.step;
        document.getElementById("mTeams").value = r.teams;
        document.getElementById("mMainRisk").value = r.mainRisk;
        document.getElementById("mR").value = r.r;
        document.getElementById("mA").value = r.a;
        document.getElementById("mProb").value = r.probability;
        document.getElementById("mImpact").value = r.impact;
    } else {
        document.getElementById("modalTitle").innerText = "Добавить риск";

        document.getElementById("mStep").value = "";
        document.getElementById("mTeams").value = "";
        document.getElementById("mMainRisk").value = "";
        document.getElementById("mR").value = "";
        document.getElementById("mA").value = "";
        document.getElementById("mProb").value = "";
        document.getElementById("mImpact").value = "";
    }
}

function closeModalOnOverlay(e) {
    if (e.target.id === "modalOverlay") {
        closeModal();
    }
}

function closeModal() {
    document.getElementById("modalOverlay").classList.remove("active");
}

/* ============================================================================
    СОХРАНЕНИЕ/ОБНОВЛЕНИЕ РИСКА
============================================================================ */

function saveRisk() {
    const step = mStep.value.trim();
    const teams = mTeams.value.trim();
    const mainRisk = mMainRisk.value.trim();
    const r = mR.value.trim();
    const a = mA.value.trim();
    const probability = Number(mProb.value);
    const impact = Number(mImpact.value);

    if (!step || !teams || !mainRisk) {
        alert("Заполните все поля!");
        return;
    }

    if (editId) {
        // UPDATE
        const risk = risks.find(x => x.id === editId);
        risk.step = step;
        risk.teams = teams;
        risk.mainRisk = mainRisk;
        risk.r = r;
        risk.a = a;
        risk.probability = probability;
        risk.impact = impact;
    } else {
        // CREATE
        risks.push({
            id: Date.now(),
            step,
            teams,
            mainRisk,
            r,
            a,
            probability,
            impact
        });
    }

    renderTable();
    saveToFile(); // локальное сохранение
    closeModal();
}

/* ============================================================================
    ИМПОРТ/ЭКСПОРТ JSON
============================================================================ */

function saveToJSON() {
    const blob = new Blob([JSON.stringify(risks, null, 2)], {
        type: "application/json"
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "risks.json";
    a.click();
}

document.getElementById("fileInput").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        risks = JSON.parse(reader.result);
        renderTable();
        saveToFile();
    };
    reader.readAsText(file);
});

/* ============================================================================
    ЛОКАЛЬНОЕ СОХРАНЕНИЕ risks.json
    (без GitHub — работает локально или на хостинге)
============================================================================ */

function saveToFile() {
    fetch("save.php", {
        method: "POST",
        body: JSON.stringify(risks)
    }).catch(() => {
        console.log("Нет save.php — данные сохраняются в памяти");
    });
}

/* ============================================================================
    УДАЛЕНИЕ
============================================================================ */

function deleteRisk(id) {
    if (!confirm("Удалить этот риск?")) return;

    risks = risks.filter(r => r.id !== id);
    renderTable();
    saveToFile();
}

/* ============================================================================
    МАССОВОЕ УДАЛЕНИЕ
============================================================================ */

function deleteSelected() {
    const selected = document.querySelectorAll(".row-check:checked");

    if (!selected.length) {
        alert("Не выбрано ни одного риска");
        return;
    }

    if (!confirm("Удалить выбранные?")) return;

    const ids = [...selected].map(x => Number(x.dataset.id));

    risks = risks.filter(r => !ids.includes(r.id));

    renderTable();
    saveToFile();
}

function toggleSelectAll(source) {
    document.querySelectorAll(".row-check").forEach(cb => {
        cb.checked = source.checked;
    });
}

/* ============================================================================
    СИНХРОНИЗАЦИЯ
    (просто перезагружаем файл)
============================================================================ */

document.getElementById("syncBtn").onclick = () => loadRisks();
