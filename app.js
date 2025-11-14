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
                    <div class="editable scenario-editable">${scenario}</div>
                </div>
                <div class="scenario-actions">
                    <button class="btn-delete delete-scenario-btn">🗑</button>
                </div>
            </div>
        `;

        scenarioRow.appendChild(scenarioCell);
        tbody.appendChild(scenarioRow);

        // Строки рисков
        scenarioRisks.forEach(risk => {
            const riskRow = document.createElement('tr');
            riskRow.className = 'risk-row';
            riskRow.dataset.riskId = risk.id;

            Object.keys(risk).forEach(key => {
                const cell = document.createElement('td');
                cell.textContent = risk[key];
                riskRow.appendChild(cell);
            });

            tbody.appendChild(riskRow);
        });
    });
}

// Обновление количества рисков
function updateRiskCount() {
    const riskCountElement = document.getElementById('riskCount');
    riskCountElement.textContent = filteredRisks.length;
}

// Сохранение риска
function saveRisk(event) {
    event.preventDefault();
    const form = document.getElementById('riskForm');
    const newRisk = {
        id: nextId++,
        scenario: form.elements.scenario.value,
        step: form.elements.step.value,
        teams: form.elements.teams.value,
        type: form.elements.type.value,
        probability: parseInt(form.elements.probability.value, 10),
        impact: parseInt(form.elements.impact.value, 10)
    };

    risks.push(newRisk);
    saveDataToLocalStorage(); // Сохраняем данные после добавления риска
    closeModal();
    applyFilters();
}

// Запуск инициализации при загрузке страницы
window.addEventListener('load', init);
