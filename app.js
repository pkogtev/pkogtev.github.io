let scenarios = [];
let editingIndex = -1;
let stepCounter = 0;

// Загрузка данных при старте
window.onload = function() {
    loadFromLocalStorage();
    renderTable();
    updateTeamFilter();
    
    // Закрытие dropdown при клике вне его
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            document.getElementById('exportDropdown').classList.remove('show');
        }
    });
};

function toggleExportDropdown() {
    event.stopPropagation();
    document.getElementById('exportDropdown').classList.toggle('show');
}

function openModal(index = -1) {
    editingIndex = index;
    const modal = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    
    if (index >= 0) {
        modalTitle.textContent = 'Редактировать сценарий';
        loadScenarioData(scenarios[index]);
    } else {
        modalTitle.textContent = 'Добавить сценарий';
        document.getElementById('scenarioName').value = '';
        document.getElementById('stepsContainer').innerHTML = '';
        stepCounter = 0;
        addStep();
    }
    
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function addStep() {
    if (document.querySelectorAll('.step-item').length >= 10) {
        alert('Максимум 10 шагов на сценарий');
        return;
    }

    stepCounter++;
    const stepsContainer = document.getElementById('stepsContainer');
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step-item';
    stepDiv.innerHTML = `
        <div class="step-header">
            <span class="step-number">Шаг ${stepCounter}</span>
            <button class="btn-remove" onclick="removeStep(this)">🗑️ Удалить</button>
        </div>
        <div class="form-group">
            <label>Шаг пользователя *</label>
            <input type="text" class="step-name" placeholder="Например: Ввод email и пароля">
        </div>
        <div class="form-group">
            <label>Участвующие команды</label>
            <input type="text" class="step-teams" placeholder="Например: Frontend, Backend">
        </div>
        <div class="form-group">
            <label>Критичность</label>
            <select class="step-criticality">
                <option value="Низкая">Низкая</option>
                <option value="Средняя">Средняя</option>
                <option value="Высокая">Высокая</option>
                <option value="Критическая">Критическая</option>
            </select>
        </div>
        <div class="form-group">
            <label>Основной риск</label>
            <textarea class="step-risk" placeholder="Опишите основные риски данного шага"></textarea>
        </div>
        <div class="form-group">
            <label>R (Ответственный)</label>
            <input type="text" class="step-r" placeholder="Ответственный за риск">
        </div>
        <div class="form-group">
            <label>A (Утверждающий)</label>
            <input type="text" class="step-a" placeholder="Утверждающий">
        </div>
    `;
    stepsContainer.appendChild(stepDiv);
}

function removeStep(btn) {
    btn.closest('.step-item').remove();
    renumberSteps();
}

function renumberSteps() {
    const steps = document.querySelectorAll('.step-item');
    steps.forEach((step, index) => {
        step.querySelector('.step-number').textContent = `Шаг ${index + 1}`;
    });
    stepCounter = steps.length;
}

function saveScenario() {
    const scenarioName = document.getElementById('scenarioName').value.trim();
    if (!scenarioName) {
        alert('Введите название сценария');
        return;
    }

    const stepItems = document.querySelectorAll('.step-item');
    if (stepItems.length === 0) {
        alert('Добавьте хотя бы один шаг');
        return;
    }

    const steps = [];
    let hasError = false;

    stepItems.forEach((item, index) => {
        const stepName = item.querySelector('.step-name').value.trim();
        if (!stepName) {
            alert(`Заполните название для шага ${index + 1}`);
            hasError = true;
            return;
        }

        steps.push({
            name: stepName,
            teams: item.querySelector('.step-teams').value.trim(),
            criticality: item.querySelector('.step-criticality').value,
            risk: item.querySelector('.step-risk').value.trim(),
            r: item.querySelector('.step-r').value.trim(),
            a: item.querySelector('.step-a').value.trim()
        });
    });

    if (hasError) return;

    const scenario = {
        name: scenarioName,
        steps: steps
    };

    if (editingIndex >= 0) {
        scenarios[editingIndex] = scenario;
    } else {
        scenarios.push(scenario);
    }

    saveToLocalStorage();
    renderTable();
    updateTeamFilter();
    closeModal();
}

function loadScenarioData(scenario) {
    document.getElementById('scenarioName').value = scenario.name;
    document.getElementById('stepsContainer').innerHTML = '';
    stepCounter = 0;

    scenario.steps.forEach(step => {
        stepCounter++;
        const stepsContainer = document.getElementById('stepsContainer');
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step-item';
        stepDiv.innerHTML = `
            <div class="step-header">
                <span class="step-number">Шаг ${stepCounter}</span>
                <button class="btn-remove" onclick="removeStep(this)">🗑️ Удалить</button>
            </div>
            <div class="form-group">
                <label>Шаг пользователя *</label>
                <input type="text" class="step-name" value="${step.name}" placeholder="Например: Ввод email и пароля">
            </div>
            <div class="form-group">
                <label>Участвующие команды</label>
                <input type="text" class="step-teams" value="${step.teams || ''}" placeholder="Например: Frontend, Backend">
            </div>
            <div class="form-group">
                <label>Критичность</label>
                <select class="step-criticality">
                    <option value="Низкая" ${step.criticality === 'Низкая' ? 'selected' : ''}>Низкая</option>
                    <option value="Средняя" ${step.criticality === 'Средняя' ? 'selected' : ''}>Средняя</option>
                    <option value="Высокая" ${step.criticality === 'Высокая' ? 'selected' : ''}>Высокая</option>
                    <option value="Критическая" ${step.criticality === 'Критическая' ? 'selected' : ''}>Критическая</option>
                </select>
            </div>
            <div class="form-group">
                <label>Основной риск</label>
                <textarea class="step-risk" placeholder="Опишите основные риски данного шага">${step.risk || ''}</textarea>
            </div>
            <div class="form-group">
                <label>R (Ответственный)</label>
                <input type="text" class="step-r" value="${step.r || ''}" placeholder="Ответственный за риск">
            </div>
            <div class="form-group">
                <label>A (Утверждающий)</label>
                <input type="text" class="step-a" value="${step.a || ''}" placeholder="Утверждающий">
            </div>
        `;
        stepsContainer.appendChild(stepDiv);
    });
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const teamFilter = document.getElementById('teamFilter').value;

    if (scenarios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <p>Нет данных. Добавьте первый сценарий.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';

    scenarios.forEach((scenario, scenarioIndex) => {
        const matchesSearch = scenario.name.toLowerCase().includes(searchTerm);
        const matchesTeam = !teamFilter || scenario.steps.some(step => 
            step.teams.toLowerCase().includes(teamFilter.toLowerCase())
        );

        if (!matchesSearch && searchTerm) return;

        const scenarioRow = document.createElement('tr');
        scenarioRow.className = 'scenario-row';
        scenarioRow.innerHTML = `
            <td colspan="6" class="editable" onclick="editScenarioName(${scenarioIndex}, this)">
                ${scenario.name}
            </td>
            <td class="actions-cell">
                <button class="btn btn-edit" onclick="openModal(${scenarioIndex})">✏️</button>
                <button class="btn btn-danger" onclick="deleteScenario(${scenarioIndex})">🗑️</button>
            </td>
        `;
        tbody.appendChild(scenarioRow);

        scenario.steps.forEach((step, stepIndex) => {
            const stepMatchesTeam = !teamFilter || step.teams.toLowerCase().includes(teamFilter.toLowerCase());
            if (!stepMatchesTeam) return;

            const stepRow = document.createElement('tr');
            stepRow.className = 'step-row';
            stepRow.innerHTML = `
                <td class="editable" onclick="editField(${scenarioIndex}, ${stepIndex}, 'name', this)">
                    ${step.name}
                </td>
                <td class="editable" onclick="editField(${scenarioIndex}, ${stepIndex}, 'teams', this)">
                    ${step.teams || '-'}
                </td>
                <td class="editable" onclick="editCriticality(${scenarioIndex}, ${stepIndex}, this)">
                    <span class="criticality criticality-${getCriticalityClass(step.criticality)}">
                        ${step.criticality}
                    </span>
                </td>
                <td class="editable" onclick="editFieldTextarea(${scenarioIndex}, ${stepIndex}, 'risk', this)">
                    ${step.risk || '-'}
                </td>
                <td class="editable" onclick="editField(${scenarioIndex}, ${stepIndex}, 'r', this)">
                    ${step.r || '-'}
                </td>
                <td class="editable" onclick="editField(${scenarioIndex}, ${stepIndex}, 'a', this)">
                    ${step.a || '-'}
                </td>
                <td class="actions-cell">
                    <button class="btn btn-danger" onclick="deleteStep(${scenarioIndex}, ${stepIndex})">🗑️</button>
                </td>
            `;
            tbody.appendChild(stepRow);
        });
    });
}

function getCriticalityClass(criticality) {
    const map = {
        'Низкая': 'low',
        'Средняя': 'medium',
        'Высокая': 'high',
        'Критическая': 'critical'
    };
    return map[criticality] || 'low';
}

function editScenarioName(scenarioIndex, cell) {
    const currentValue = scenarios[scenarioIndex].name;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.onblur = function() {
        const newValue = this.value.trim();
        if (newValue && newValue !== currentValue) {
            scenarios[scenarioIndex].name = newValue;
            saveToLocalStorage();
        }
        renderTable();
    };
    input.onkeypress = function(e) {
        if (e.key === 'Enter') {
            this.blur();
        }
    };
    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
}

function editField(scenarioIndex, stepIndex, field, cell) {
    const currentValue = scenarios[scenarioIndex].steps[stepIndex][field];
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue || '';
    input.onblur = function() {
        const newValue = this.value.trim();
        scenarios[scenarioIndex].steps[stepIndex][field] = newValue;
        saveToLocalStorage();
        renderTable();
    };
    input.onkeypress = function(e) {
        if (e.key === 'Enter') {
            this.blur();
        }
    };
    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
}

function editFieldTextarea(scenarioIndex, stepIndex, field, cell) {
    const currentValue = scenarios[scenarioIndex].steps[stepIndex][field];
    const textarea = document.createElement('textarea');
    textarea.value = currentValue || '';
    textarea.onblur = function() {
        const newValue = this.value.trim();
        scenarios[scenarioIndex].steps[stepIndex][field] = newValue;
        saveToLocalStorage();
        renderTable();
    };
    cell.innerHTML = '';
    cell.appendChild(textarea);
    textarea.focus();
}

function editCriticality(scenarioIndex, stepIndex, cell) {
    const currentValue = scenarios[scenarioIndex].steps[stepIndex].criticality;
    const select = document.createElement('select');
    select.innerHTML = `
        <option value="Низкая" ${currentValue === 'Низкая' ? 'selected' : ''}>Низкая</option>
        <option value="Средняя" ${currentValue === 'Средняя' ? 'selected' : ''}>Средняя</option>
        <option value="Высокая" ${currentValue === 'Высокая' ? 'selected' : ''}>Высокая</option>
        <option value="Критическая" ${currentValue === 'Критическая' ? 'selected' : ''}>Критическая</option>
    `;
    select.onchange = function() {
        scenarios[scenarioIndex].steps[stepIndex].criticality = this.value;
        saveToLocalStorage();
        renderTable();
    };
    select.onblur = function() {
        renderTable();
    };
    cell.innerHTML = '';
    cell.appendChild(select);
    select.focus();
}

function deleteScenario(scenarioIndex) {
    if (confirm('Вы уверены, что хотите удалить этот сценарий со всеми шагами?')) {
        scenarios.splice(scenarioIndex, 1);
        saveToLocalStorage();
        renderTable();
        updateTeamFilter();
    }
}

function deleteStep(scenarioIndex, stepIndex) {
    if (confirm('Вы уверены, что хотите удалить этот шаг?')) {
        scenarios[scenarioIndex].steps.splice(stepIndex, 1);
        if (scenarios[scenarioIndex].steps.length === 0) {
            scenarios.splice(scenarioIndex, 1);
        }
        saveToLocalStorage();
        renderTable();
        updateTeamFilter();
    }
}

function applyFilters() {
    renderTable();
}

function updateTeamFilter() {
    const teamFilter = document.getElementById('teamFilter');
    const currentValue = teamFilter.value;
    const teams = new Set();

    scenarios.forEach(scenario => {
        scenario.steps.forEach(step => {
            if (step.teams) {
                step.teams.split(',').forEach(team => {
                    teams.add(team.trim());
                });
            }
        });
    });

    teamFilter.innerHTML = '<option value="">Все команды</option>';
    Array.from(teams).sort().forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        if (team === currentValue) {
            option.selected = true;
        }
        teamFilter.appendChild(option);
    });
}

function saveToLocalStorage() {
    localStorage.setItem('riskMatrix', JSON.stringify(scenarios));
}

function loadFromLocalStorage() {
    const data = localStorage.getItem('riskMatrix');
    if (data) {
        try {
            scenarios = JSON.parse(data);
        } catch (e) {
            console.error('Ошибка загрузки данных:', e);
            scenarios = [];
        }
    }
}

function saveToFile() {
    const dataStr = JSON.stringify(scenarios, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `risk-matrix-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    document.getElementById('exportDropdown').classList.remove('show');
}

function exportToCSV() {
    if (scenarios.length === 0) {
        alert('Нет данных для экспорта');
        return;
    }

    // Формируем CSV
    let csv = '\uFEFF'; // BOM для корректного отображения кириллицы в Excel
    csv += 'Сценарий,Шаг пользователя,Участвующие команды,Критичность,Основной риск,R (Ответственный),A (Утверждающий)\n';

    scenarios.forEach(scenario => {
        scenario.steps.forEach((step, index) => {
            const scenarioName = index === 0 ? `"${scenario.name.replace(/"/g, '""')}"` : '""';
            const stepName = `"${step.name.replace(/"/g, '""')}"`;
            const teams = `"${(step.teams || '').replace(/"/g, '""')}"`;
            const criticality = `"${step.criticality}"`;
            const risk = `"${(step.risk || '').replace(/"/g, '""')}"`;
            const r = `"${(step.r || '').replace(/"/g, '""')}"`;
            const a = `"${(step.a || '').replace(/"/g, '""')}"`;
            
            csv += `${scenarioName},${stepName},${teams},${criticality},${risk},${r},${a}\n`;
        });
    });

    // Создаем и скачиваем файл
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `risk-matrix-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    document.getElementById('exportDropdown').classList.remove('show');
}

function loadFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                scenarios = data;
                saveToLocalStorage();
                renderTable();
                updateTeamFilter();
                alert('Данные успешно загружены!');
            } else {
                alert('Неверный формат файла');
            }
        } catch (error) {
            alert('Ошибка при чтении файла: ' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// Закрытие модального окна при клике вне его
document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Пример данных для старта
if (scenarios.length === 0) {
    scenarios = [
        {
            name: "Авторизация пользователя",
            steps: [
                {
                    name: "Переход на страницу входа",
                    teams: "Frontend",
                    criticality: "Низкая",
                    risk: "Недоступность страницы при высокой нагрузке",
                    r: "",
                    a: ""
                },
                {
                    name: "Ввод учетных данных",
                    teams: "Frontend, Backend",
                    criticality: "Высокая",
                    risk: "Утечка данных через уязвимости XSS, проблемы с валидацией",
                    r: "",
                    a: ""
                },
                {
                    name: "Проверка прав доступа",
                    teams: "Backend, Security",
                    criticality: "Критическая",
                    risk: "Несанкционированный доступ к данным",
                    r: "",
                    a: ""
                }
            ]
        },
        {
            name: "Оформление заказа",
            steps: [
                {
                    name: "Добавление товара в корзину",
                    teams: "Frontend",
                    criticality: "Средняя",
                    risk: "Потеря данных корзины при обновлении страницы",
                    r: "",
                    a: ""
                },
                {
                    name: "Оплата заказа",
                    teams: "Backend, Payment",
                    criticality: "Критическая",
                    risk: "Ошибки в процессинге платежей, дублирование транзакций",
                    r: "",
                    a: ""
                }
            ]
        }
    ];
    saveToLocalStorage();
}
