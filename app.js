// Данные рисков
let risks = [];
let nextId = 1;
let filteredRisks = [];
let editingCell = null;
let draggedElement = null;

// Функция для сохранения данных в LocalStorage
function saveDataToLocalStorage() {
    localStorage.setItem('risksData', JSON.stringify(risks));
}

// Функция для загрузки данных из LocalStorage
function loadDataFromLocalStorage() {
    const data = localStorage.getItem('risksData');
    if (data) {
        risks = JSON.parse(data);
        nextId = Math.max(...risks.map(risk => risk.id)) + 1 || 1;
    } else {
        risks = [];
        nextId = 1;
    }
}

// Инициализация
function init() {
    loadDataFromLocalStorage(); // Загружаем данные при инициализации
    updateFilterOptions();
    renderTable();
    updateRiskCount();
    attachEventListeners();
}

// Привязка обработчиков событий
function attachEventListeners() {
    document.getElementById('addRiskBtn').addEventListener('click', openModal);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('csvFileInput').click();
    });
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('csvFileInput').addEventListener('change', importFromCSV);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('riskForm').addEventListener('submit', saveRisk);
    document.getElementById('modalOverlay').addEventListener('click', closeModalOnOverlay);
    document.getElementById('modalContent').addEventListener('click', (e) => e.stopPropagation());
    document.getElementById('searchScenario').addEventListener('input', applyFilters);
    document.getElementById('filterTeam').addEventListener('change', applyFilters);
    document.getElementById('filterCriticality').addEventListener('change', applyFilters);
}

// Открыть/закрыть модальное окно
function openModal() {
    document.getElementById('modalOverlay').classList.add('visible');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('visible');
    document.getElementById('riskForm').reset();
}

function closeModalOnOverlay(event) {
    if (event.target === event.currentTarget) {
        closeModal();
    }
}

// Обновить опции в фильтрах
function updateFilterOptions() {
    const teams = new Set();

    risks.forEach(risk => {
        if (risk.teams) {
            risk.teams.split(',').forEach(team => teams.add(team.trim()));
        }
    });

    const teamSelect = document.getElementById('filterTeam');
    const currentTeam = teamSelect.value;

    teamSelect.innerHTML = '<option value="">Все команды</option>';
    Array.from(teams).sort().forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamSelect.appendChild(option);
    });

    teamSelect.value = currentTeam;
}

// Применить фильтры
function applyFilters() {
    const searchTerm = document.getElementById('searchScenario').value.toLowerCase();
    const teamFilter = document.getElementById('filterTeam').value;
    const criticalityFilter = document.getElementById('filterCriticality').value;

    filteredRisks = risks.filter(risk => {
        const matchesSearch = risk.scenario.toLowerCase().includes(searchTerm);
        const matchesTeam = !teamFilter || (risk.teams && risk.teams.includes(teamFilter));
        const matchesCriticality = !criticalityFilter || risk.criticality === criticalityFilter;

        return matchesSearch && matchesTeam && matchesCriticality;
    });

    renderTable();
}

// Группировка рисков по сценариям
function groupRisksByScenario(risks) {
    const grouped = {};
    const order = [];

    risks.forEach(risk => {
        if (!grouped[risk.scenario]) {
            grouped[risk.scenario] = [];
            order.push(risk.scenario);
        }
        grouped[risk.scenario].push(risk);
    });

    return { grouped, order };
}

// Отрисовать таблицу
function renderTable() {
    const tbody = document.getElementById('riskTableBody');
    const emptyState = document.getElementById('emptyState');

    if (filteredRisks.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    const { grouped, order } = groupRisksByScenario(filteredRisks);
    tbody.innerHTML = '';

    order.forEach(scenario => {
        const scenarioRisks = grouped[scenario];

        // Строка сценария
        const scenarioRow = document.createElement('tr');
        scenarioRow.className = 'scenario-row';
        scenarioRow.dataset.type = 'scenario';
        scenarioRow.dataset.scenario = scenario;

        const scenarioCell = document.createElement('td');
        scenarioCell.colSpan = 6;
        scenarioCell.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="drag-handle" draggable="true">⋮⋮</span>
                    <div class="editable scenario-editable">${escapeHtml(scenario)}</div>
                </div>
                <div class="scenario-actions">
                    <button class="btn-delete delete-scenario-btn">��Для реализации сохранения и загрузки данных в JSON-файл можно использовать LocalStorage, так как работа с файловой системой напрямую через браузер невозможна из-за ограничений безопасности. Ниже представлен модифицированный код, который включает функции для сохранения и загрузки данных в LocalStorage в формате JSON.

```javascript
// Данные рисков
let risks = [];
let nextId = 1;
let filteredRisks = [];
let editingCell = null;
let draggedElement = null;

// Функция для сохранения данных в LocalStorage
function saveDataToLocalStorage() {
    localStorage.setItem('risksData', JSON.stringify(risks));
}

// Функция для загрузки данных из LocalStorage
function loadDataFromLocalStorage() {
    const data = localStorage.getItem('risksData');
    if (data) {
        risks = JSON.parse(data);
        nextId = Math.max(...risks.map(risk => risk.id)) + 1 || 1;
    } else {
        risks = [];
        nextId = 1;
    }
}

// Инициализация
function init() {
    loadDataFromLocalStorage(); // Загружаем данные при инициализации
    updateFilterOptions();
    renderTable();
    updateRiskCount();
    attachEventListeners();
}

// Привязка обработчиков событий
function attachEventListeners() {
    document.getElementById('addRiskBtn').addEventListener('click', openModal);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('csvFileInput').click();
    });
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('csvFileInput').addEventListener('change', importFromCSV);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('riskForm').addEventListener('submit', saveRisk);
    document.getElementById('modalOverlay').addEventListener('click', closeModalOnOverlay);
    document.getElementById('modalContent').addEventListener('click', (e) => e.stopPropagation());
    document.getElementById('searchScenario').addEventListener('input', applyFilters);
    document.getElementById('filterTeam').addEventListener('change', applyFilters);
    document.getElementById('filterCriticality').addEventListener('change', applyFilters);
}

// Открыть/закрыть модальное окно
function openModal() {
    document.getElementById('modalOverlay').classList.add('visible');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('visible');
    document.getElementById('riskForm').reset();
}

function closeModalOnOverlay(event) {
    if (event.target === event.currentTarget) {
        closeModal();
    }
}

// Обновить опции в фильтрах
function updateFilterOptions() {
    const teams = new Set();

    risks.forEach(risk => {
        if (risk.teams) {
            risk.teams.split(',').forEach(team => teams.add(team.trim()));
        }
    });

    const teamSelect = document.getElementById('filterTeam');
    const currentTeam = teamSelect.value;

    teamSelect.innerHTML = '<option value="">Все команды</option>';
    Array.from(teams).sort().forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamSelect.appendChild(option);
    });

    teamSelect.value = currentTeam;
}

// Применить фильтры
function applyFilters() {
    const searchTerm = document.getElementById('searchScenario').value.toLowerCase();
    const teamFilter = document.getElementById('filterTeam').value;
    const criticalityFilter = document.getElementById('filterCriticality').value;

    filteredRisks = risks.filter(risk => {
        const matchesSearch = risk.scenario.toLowerCase().includes(searchTerm);
        const matchesTeam = !teamFilter || (risk.teams && risk.teams.includes(teamFilter));
        const matchesCriticality = !criticalityFilter || risk.criticality === criticalityFilter;

        return matchesSearch && matchesTeam && matchesCriticality;
    });

    renderTable();
}

// Группировка рисков по сценариям
function groupRisksByScenario(risks) {
    const grouped = {};
    const order = [];

    risks.forEach(risk => {
        if (!grouped[risk.scenario]) {
            grouped[risk.scenario] = [];
            order.push(risk.scenario);
        }
        grouped[risk.scenario].push(risk);
    });

    return { grouped, order };
}

// Отрисовать таблицу
function renderTable() {
    const tbody = document.getElementById('riskTableBody');
    const emptyState = document.getElementById('emptyState');

    if (filteredRisks.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    const { grouped, order } = groupRisksByScenario(filteredRisks);
    tbody.innerHTML = '';

    order.forEach(scenario => {
        const scenarioRisks = grouped[scenario];

        // Строка сценария
        const scenarioRow = document.createElement('tr');
        scenarioRow.className = 'scenario-row';
        scenarioRow.dataset.type = 'scenario';
        scenarioRow.dataset.scenario = scenario;

        const scenarioCell = document.createElement('td');
        scenarioCell.colSpan = 6;
        scenarioCell.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="drag-handle" draggable="true">⋮⋮</span>
                    <div class="editable scenario-editable">${escapeHtml(scenario)}</div>
                </div>
                <div class="scenario-actions">
                    <button class="btn-delete delete-scenario-btn">🗑️ Удалить сценарий</button>
                </div>
            </div>
        `;

        scenarioRow.appendChild(scenarioCell);
        tbody.appendChild(scenarioRow);

        // Привязываем события к строке сценария
        const editableDiv = scenarioCell.querySelector('.scenario-editable');
        editableDiv.addEventListener('click', () => editScenario(editableDiv, scenario));

        const deleteBtn = scenarioCell.querySelector('.delete-scenario-btn');
        deleteBtn.addEventListener('click', () => deleteScenario(scenario));

        // Строки шагов
        scenarioRisks.forEach((risk) => {
            const stepRow = document.createElement('tr');
            stepRow.className = 'step-row';
            stepRow.dataset.type = 'step';
            stepRow.dataset.riskId = risk.id;
            stepRow.dataset.scenario = scenario;
            stepRow.draggable = true;

            stepRow.innerHTML = `
                <td><span class="drag-handle">⋮⋮</span></td>
                <td><div class="editable step-editable">${risk.step || ''}</div></td>
                <td><div class="editable teams-editable">${risk.teams || ''}</div></td>
                <td style="text-align: center;">
                    <span class="severity-badge severity-${risk.criticality ? risk.criticality.toLowerCase() : 'низкая'} criticality-badge">
                        ${risk.criticality === 'Высокая' ? '🔴' : risk.criticality === 'Средняя' ? '🟠' : '🟢'} ${risk.criticality || 'Не указана'}
                    </span>
                </td>
                <td><div class="editable mainrisk-editable">${risk.mainRisk || ''}</div></td>
                <td style="text-align: right;">
                    <button class="btn-delete delete-risk-btn">🗑️ Удалить шаг</button>
                </td>
            `;

            tbody.appendChild(stepRow);

            // Привязываем события к строкам шагов
            const stepEditable = stepRow.querySelector('.step-editable');
            stepEditable.addEventListener('click', () => editStep(stepEditable, risk.id, 'step'));

            const teamsEditable = stepRow.querySelector('.teams-editable');
            teamsEditable.addEventListener('click', () => editStep(teamsEditable, risk.id, 'teams'));

            const mainriskEditable = stepRow.querySelector('.mainrisk-editable');
            mainriskEditable.addEventListener('click', () => editStep(mainriskEditable, risk.id, 'mainRisk'));

            const deleteStepBtn = stepRow.querySelector('.delete-risk-btn');
            deleteStepBtn.addEventListener('click', () => deleteRisk(risk.id));
        });
    });
}

// Сохранение риска после редактирования
function saveRisk(event) {
    event.preventDefault();
    const form = document.getElementById('riskForm');
    const scenario = form.elements.scenario.value;
    const step = form.elements.step.value;
    const teams = form.elements.teams.value;
    const mainRisk = form.elements.mainRisk.value;
    const probability = parseInt(form.elements.probability.value, 10);
    const impact = parseInt(form.elements.impact.value, 10);
    const criticality = getCriticality(probability, impact);

    const newRisk = {
        id: nextId++,
        scenario,
        step,
        teams,
        mainRisk,
        probability,
        impact,
        criticality
    };

    risks.push(newRisk);
    saveDataToLocalStorage(); // Сохраняем данные после добавления нового риска
    closeModal();
    applyFilters();
}

// Редактирование сценария
function editScenario(editableDiv, scenario) {
    if (editingCell) return;
    editingCell = editableDiv;
    const originalText = editableDiv.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.style.width = `${editableDiv.offsetWidth}px`;
    input.style.padding = '0';
    input.style.border = 'none';
    input.style.background = 'transparent';
    input.style.color = editableDiv.style.color;
    input.style.fontFamily = editableDiv.style.fontFamily;
    input.style.fontSize = editableDiv.style.fontSize;
    editableDiv.parentNode.replaceChild(input, editableDiv);

    input.addEventListener('blur', () => {
        const newText = input.value.trim();
        if (newText) {
            updateScenario(scenario, newText);
        } else {
            editableDiv.textContent = originalText;
        }
        editingCell = null;
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            editableDiv.textContent = originalText;
            editingCell = null;
        }
    });
}

// Обновление сценария в данных
function updateScenario(oldScenario, newScenario) {
    risks.forEach(risk => {
        if (risk.scenario === oldScenario) {
            risk.scenario = newScenario;
        }
    });
    saveDataToLocalStorage(); // Сохраняем данные после обновления сценария
    applyFilters();
}

// Редактирование шага
function editStep(editableDiv, riskId, field) {
    if (editingCell) return;
    editingCell = editableDiv;
    const originalText = editableDiv.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;
    input.style.width = `${editableDiv.offsetWidth}px`;
    input.style.padding = '0';
    input.style.border = 'none';
    input.style.background = 'transparent';
    input.style.color = editableDiv.style.color;
    input.style.fontFamily = editableDiv.style.fontFamily;
    input.style.fontSize = editableDiv.style.fontSize;
    editableDiv.parentNode.replaceChild(input, editableDiv);

    input.addEventListener('blur', () => {
        const newText = input.value.trim();
        if (newText) {
            updateRiskField(riskId, field, newText);
        } else {
            editableDiv.textContent = originalText;
        }
        editingCell = null;
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            editableDiv.textContent = originalText;
            editingCell = null;
        }
    });
}

// Обновление поля риска в данных
function updateRiskField(riskId, field, value) {
    const risk = risks.find(r => r.id === riskId);
    if (risk) {
        risk[field] = value;
        saveDataToLocalStorage(); // Сохраняем данные после обновления поля
        applyFilters();
    }
}

// Удаление сценария
function deleteScenario(scenario) {
    risks = risks.filter(risk => risk.scenario !== scenario);
    saveDataToLocalStorage(); // Сохраняем данные после удаления сценария
    applyFilters();
}

// Удаление риска
function deleteRisk(riskId) {
    risks = risks.filter(risk => risk.id !== riskId);
    saveDataToLocalStorage(); // Сохраняем данные после удаления риска
    applyFilters();
}

// Определение критичности по вероятности и влиянию
function getCriticality(probability, impact) {
    const severity = probability * impact;
    if (severity >= 9) {
        return 'Высокая';
    } else if (severity >= 5) {
        return 'Средняя';
    } else {
        return 'Низкая';
    }
}

// Экранирование HTML-символов
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Экспорт в CSV
function exportToCSV() {
    const csvData = ['Сценарий,Шаг,Команды,Основной риск,Вероятность,Влияние,Критичность'].concat(
        risks.map(risk => `${risk.scenario},${risk.step},${risk.teams},${risk.mainRisk},${risk.probability},${risk.impact},${risk.criticality}`)
    ).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'risks.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// Импорт из CSV
function importFromCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const lines = text.split('\n').slice(1); // Пропускаем заголовок
        lines.forEach(line => {
            const [scenario, step, teams, mainRisk, probability, impact, criticality] = line.split(',');
            risks.push({
                id: nextId++,
                scenario,
                step,
                teams,
                mainRisk,
                probability: parseInt(probability, 10),
                impact: parseInt(impact, 10),
                criticality
            });
        });
        saveDataToLocalStorage(); // Сохраняем данные после импорта
        applyFilters();
    };
    reader.readAsText(file);
}

// Запуск инициализации при загрузке страницы
window.addEventListener('load', init);
