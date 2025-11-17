// Данные рисков
let risks = [];
let nextId = 1;
let filteredRisks = [];

// Ключ для LocalStorage
const STORAGE_KEY = 'risks_matrix_data';

// Инициализация
function init() {
    loadFromLocalStorage();
    updateFilterOptions();
    renderTable();
    setSyncStatus('synced', '✓ Синхронизировано');
}

// Сохранение в LocalStorage (имитация JSON базы)
function saveToLocalStorage() {
    try {
        const data = {
            risks: risks,
            nextId: nextId,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSyncStatus('synced', '✓ Синхронизировано');
        return true;
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        setSyncStatus('error', '✗ Ошибка сохранения');
        return false;
    }
}

// Загрузка из LocalStorage
function loadFromLocalStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            risks = parsed.risks || [];
            nextId = parsed.nextId || 1;
        } else {
            // Стартовые данные
            risks = [
                {
                    id: 1,
                    scenario: "Авторизация пользователя",
                    step: "Проверка JWT токена на бэкенде",
                    teams: "Backend, Security",
                    type: "Безопасность",
                    probability: 4,
                    impact: 5,
                    severity: 20
                },
                {
                    id: 2,
                    scenario: "Загрузка больших файлов",
                    step: "Валидация размера и типа файла на клиенте",
                    teams: "Frontend, Backend",
                    type: "Технический",
                    probability: 3,
                    impact: 3,
                    severity: 9
                },
                {
                    id: 3,
                    scenario: "Интеграция с внешним API",
                    step: "Обработка таймаутов и ошибок соединения",
                    teams: "Backend, DevOps",
                    type: "Интеграция",
                    probability: 4,
                    impact: 4,
                    severity: 16
                }
            ];
            nextId = 4;
            saveToLocalStorage();
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        setSyncStatus('error', '✗ Ошибка загрузки');
    }
}

// Установить статус синхронизации
function setSyncStatus(status, text) {
    const statusEl = document.getElementById('syncStatus');
    statusEl.textContent = text;
    statusEl.className = 'sync-status ' + status;
}

// Открыть/закрыть боковую панель
function openSidebar() {
    document.getElementById('sidebar').classList.add('visible');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('visible');
    document.getElementById('riskForm').reset();
}

// Обновить опции в фильтрах
function updateFilterOptions() {
    const teams = new Set();
    const types = new Set();

    risks.forEach(risk => {
        risk.teams.split(',').forEach(team => teams.add(team.trim()));
        types.add(risk.type);
    });

    const teamSelect = document.getElementById('filterTeam');
    const typeSelect = document.getElementById('filterType');

    const currentTeam = teamSelect.value;
    const currentType = typeSelect.value;

    teamSelect.innerHTML = '<option value="">Все команды</option>';
    Array.from(teams).sort().forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamSelect.appendChild(option);
    });

    typeSelect.innerHTML = '<option value="">Все типы</option>';
    Array.from(types).sort().forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    });

    teamSelect.value = currentTeam;
    typeSelect.value = currentType;
}

// Применить фильтры
function applyFilters() {
    const searchTerm = document.getElementById('searchScenario').value.toLowerCase();
    const teamFilter = document.getElementById('filterTeam').value;
    const typeFilter = document.getElementById('filterType').value;

    filteredRisks = risks.filter(risk => {
        const matchesSearch = risk.scenario.toLowerCase().includes(searchTerm);
        const matchesTeam = !teamFilter || risk.teams.includes(teamFilter);
        const matchesType = !typeFilter || risk.type === typeFilter;

        return matchesSearch && matchesTeam && matchesType;
    });

    renderTable();
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

    tbody.innerHTML = filteredRisks.map(risk => `
        <tr>
            <td><strong>${risk.scenario}</strong></td>
            <td>${risk.step}</td>
            <td>${risk.teams}</td>
            <td>${risk.type}</td>
            <td style="text-align: center;">${risk.probability}</td>
            <td style="text-align: center;">${risk.impact}</td>
            <td style="text-align: center;">
                <span class="severity-badge ${getSeverityClass(risk.severity)}">
                    ${risk.severity}
                </span>
            </td>
            <td style="text-align: right;">
                <button class="btn-delete" onclick="deleteRisk(${risk.id})">🗑️ Удалить</button>
            </td>
        </tr>
    `).join('');
}

// Получить класс критичности
function getSeverityClass(severity) {
    if (severity <= 6) return 'severity-low';
    if (severity <= 12) return 'severity-medium';
    return 'severity-high';
}

// Сохранить риск
function saveRisk(event) {
    event.preventDefault();

    const newRisk = {
        id: nextId++,
        scenario: document.getElementById('scenario').value,
        step: document.getElementById('step').value,
        teams: document.getElementById('teams').value,
        type: document.getElementById('type').value,
        probability: parseInt(document.getElementById('probability').value),
        impact: parseInt(document.getElementById('impact').value),
        severity: 0
    };

    newRisk.severity = newRisk.probability * newRisk.impact;

    risks.push(newRisk);
    saveToLocalStorage();
    updateFilterOptions();
    applyFilters();
    closeSidebar();
}

// Удалить риск
function deleteRisk(id) {
    if (confirm('Вы уверены, что хотите удалить этот риск?')) {
        risks = risks.filter(risk => risk.id !== id);
        saveToLocalStorage();
        applyFilters();
    }
}

// Экспорт в JSON
function exportToJSON() {
    const data = {
        risks: risks,
        nextId: nextId,
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `risks_matrix_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Импорт из JSON
function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('Импорт заменит все текущие данные. Продолжить?')) {
                risks = data.risks || [];
                nextId = data.nextId || 1;
                saveToLocalStorage();
                updateFilterOptions();
                applyFilters();
                alert('Данные успешно импортированы!');
            }
        } catch (error) {
            alert('Ошибка при чтении файла. Проверьте формат JSON.');
            console.error(error);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// Запуск при загрузке
init();
applyFilters();
