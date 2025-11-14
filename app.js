// Данные рисков
let risks = [];
let nextId = 1;
let filteredRisks = [];
let editingCell = null;
let draggedElement = null;

// Функция для обновления количества рисков
function updateRiskCount() {
    const riskCountElement = document.getElementById('riskCount');
    riskCountElement.textContent = filteredRisks.length;
}

// Инициализация
function init() {
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
            // ... (продолжение кода для отрисовки строк шагов)
        });
    });
}

// Остальные функции...

// Запуск инициализации при загрузке документа
document.addEventListener('DOMContentLoaded', init);
