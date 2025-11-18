// ============================================
// State Management
// ============================================
let scenarios = [];
let editingIndex = -1;
let stepCounter = 0;

// ============================================
// Initialization
// ============================================
window.onload = function() {
    loadFromLocalStorage();
    renderTable();
    updateTeamFilter();
    
    // Закрытие dropdown при клике вне его
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            // Нет dropdown в новом дизайне
        }
        
        // Закрываем кастомные dropdown для критичности
        if (!e.target.closest('.criticality-dropdown')) {
            document.querySelectorAll('.criticality-dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
};

// ============================================
// LocalStorage Functions
// ============================================
function saveToLocalStorage() {
    try {
        localStorage.setItem('riskMatrix', JSON.stringify(scenarios));
        console.log('💾 Данные сохранены в LocalStorage');
    } catch (e) {
        console.error('❌ Ошибка сохранения в LocalStorage:', e);
    }
}

function loadFromLocalStorage() {
    const data = localStorage.getItem('riskMatrix');
    if (data) {
        try {
            scenarios = JSON.parse(data);
            console.log('📦 Данные загружены из LocalStorage:', scenarios.length, 'сценариев');
        } catch (e) {
            console.error('❌ Ошибка загрузки из LocalStorage:', e);
            scenarios = getDefaultScenarios();
        }
    } else {
        scenarios = getDefaultScenarios();
        saveToLocalStorage();
    }
}

function getDefaultScenarios() {
    return [
        {
            id: 1,
            name: "Покупка нативной подписки с использованием платёжного виджета",
            steps: [
                {
                    id: 1,
                    name: "Запрос оффера",
                    teams: "Команда привлечения",
                    criticality: "Низкая",
                    risk: "Недоступность страницы при высокой нагрузке",
                    r: "",
                    a: ""
                },
                {
                    id: 2,
                    name: "Выдача пользователю оффера",
                    teams: "Команда тарифной сетки",
                    criticality: "Высокая",
                    risk: "Утечка данных через уязвимости XSS, проблемы с валидацией",
                    r: "",
                    a: ""
                },
                {
                    id: 3,
                    name: "Получение текстов оффера",
                    teams: "Команда привлечения",
                    criticality: "Высокая",
                    risk: "Утечка данных через уязвимости XSS, проблемы с валидацией",
                    r: "",
                    a: ""
                }
            ]
        },
        {
            id: 2,
            name: "Авторизация пользователя",
            steps: [
                {
                    id: 1,
                    name: "Переход на страницу входа",
                    teams: "Frontend",
                    criticality: "Низкая",
                    risk: "Недоступность страницы при высокой нагрузке",
                    r: "",
                    a: ""
                },
                {
                    id: 2,
                    name: "Ввод учетных данных",
                    teams: "Frontend, Backend",
                    criticality: "Высокая",
                    risk: "Утечка данных через уязвимости XSS, проблемы с валидацией",
                    r: "",
                    a: ""
                },
                {
                    id: 3,
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
            id: 3,
            name: "Оформление заказа",
            steps: [
                {
                    id: 1,
                    name: "Добавление товара в корзину",
                    teams: "Frontend",
                    criticality: "Средняя",
                    risk: "Потеря данных корзины при обновлении страницы",
                    r: "",
                    a: ""
                },
                {
                    id: 2,
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
}

function generateId() {
    if (scenarios.length === 0) return 1;
    return Math.max(...scenarios.map(s => s.id || 0)) + 1;
}

// ============================================
// Modal Functions
// ============================================
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

// ============================================
// Step Management
// ============================================
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

// ============================================
// Save Scenario (Create or Update)
// ============================================
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
            id: index + 1,
            name: stepName,
            teams: item.querySelector('.step-teams').value.trim(),
            criticality: item.querySelector('.step-criticality').value,
            risk: item.querySelector('.step-risk').value.trim(),
            r: item.querySelector('.step-r').value.trim(),
            a: item.querySelector('.step-a').value.trim()
        });
    });

    if (hasError) return;

    const scenarioData = {
        name: scenarioName,
        steps: steps
    };

    if (editingIndex >= 0) {
        scenarios[editingIndex] = {
            ...scenarios[editingIndex],
            ...scenarioData
        };
    } else {
        scenarioData.id = generateId();
        scenarios.push(scenarioData);
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

// ============================================
// Render Table
// ============================================
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
            step.teams && step.teams.toLowerCase().includes(teamFilter.toLowerCase())
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
            const stepMatchesTeam = !teamFilter || (step.teams && step.teams.toLowerCase().includes(teamFilter.toLowerCase()));
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

// ============================================
// Inline Editing Functions
// ============================================
function editScenarioName(scenarioIndex, cell) {
    const scenario = scenarios[scenarioIndex];
    const currentValue = scenario.name;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.onblur = function() {
        const newValue = this.value.trim();
        if (newValue && newValue !== currentValue) {
            scenario.name = newValue;
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
    const scenario = scenarios[scenarioIndex];
    const step = scenario.steps[stepIndex];
    const currentValue = step[field];
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue || '';
    input.onblur = function() {
        const newValue = this.value.trim();
        step[field] = newValue;
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
    const scenario = scenarios[scenarioIndex];
    const step = scenario.steps[stepIndex];
    const currentValue = step[field];
    const textarea = document.createElement('textarea');
    textarea.value = currentValue || '';
    textarea.onblur = function() {
        const newValue = this.value.trim();
        step[field] = newValue;
        saveToLocalStorage();
        renderTable();
    };
    cell.innerHTML = '';
    cell.appendChild(textarea);
    textarea.focus();
}

function editCriticality(scenarioIndex, stepIndex, cell) {
    const scenario = scenarios[scenarioIndex];
    const step = scenario.steps[stepIndex];
    const currentValue = step.criticality;
    
    cell.classList.add('editing');
    
    // Создаём кастомный dropdown
    const container = document.createElement('div');
    container.className = 'criticality-dropdown';
    
    const button = document.createElement('button');
    button.className = 'criticality-dropdown-btn';
    button.type = 'button';
    button.innerHTML = `
        <span>${currentValue}</span>
        <span style="color: #6ba5a3;">▼</span>
    `;
    
    const dropdown = document.createElement('div');
    dropdown.className = 'criticality-dropdown-menu';
    
    const options = ['Низкая', 'Средняя', 'Высокая', 'Критическая'];
    options.forEach(option => {
        const item = document.createElement('div');
        item.className = 'criticality-dropdown-item';
        if (option === currentValue) {
            item.classList.add('selected');
        }
        item.textContent = option;
        item.onclick = function() {
            step.criticality = option;
            saveToLocalStorage();
            cell.classList.remove('editing');
            renderTable();
        };
        dropdown.appendChild(item);
    });
    
    button.onclick = function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    };
    
    // Закрытие при клике вне dropdown
    const closeDropdown = function(e) {
        if (!container.contains(e.target)) {
            cell.classList.remove('editing');
            renderTable();
            document.removeEventListener('click', closeDropdown);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeDropdown);
    }, 0);
    
    container.appendChild(button);
    container.appendChild(dropdown);
    
    cell.innerHTML = '';
    cell.appendChild(container);
    
    // Открываем dropdown автоматически
    setTimeout(() => {
        dropdown.classList.add('show');
    }, 0);
}

// ============================================
// Delete Functions
// ============================================
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

// ============================================
// Filter Functions
// ============================================
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

// ============================================
// Export/Import Functions
// ============================================
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
}

function exportToCSV() {
    if (scenarios.length === 0) {
        alert('Нет данных для экспорта');
        return;
    }

    let csv = '\uFEFF';
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

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `risk-matrix-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importFromCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            const lines = text.split('\n');
            
            if (lines[0].charCodeAt(0) === 0xFEFF) {
                lines[0] = lines[0].substring(1);
            }
            
            const header = lines[0].toLowerCase();
            if (!header.includes('сценарий') || !header.includes('шаг')) {
                alert('Неверный формат CSV файла.');
                return;
            }
            
            const importedScenarios = [];
            let currentScenario = null;
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const values = parseCSVLine(line);
                if (values.length < 7) continue;
                
                const [scenarioName, stepName, teams, criticality, risk, r, a] = values;
                
                if (scenarioName && scenarioName.trim()) {
                    if (currentScenario) {
                        importedScenarios.push(currentScenario);
                    }
                    currentScenario = {
                        id: generateId() + importedScenarios.length,
                        name: scenarioName.trim(),
                        steps: []
                    };
                }
                
                if (currentScenario && stepName && stepName.trim()) {
                    currentScenario.steps.push({
                        id: currentScenario.steps.length + 1,
                        name: stepName.trim(),
                        teams: teams.trim(),
                        criticality: criticality.trim() || 'Низкая',
                        risk: risk.trim(),
                        r: r.trim(),
                        a: a.trim()
                    });
                }
            }
            
            if (currentScenario && currentScenario.steps.length > 0) {
                importedScenarios.push(currentScenario);
            }
            
            if (importedScenarios.length === 0) {
                alert('Не удалось импортировать данные.');
                return;
            }
            
            const replace = confirm(
                `Найдено сценариев: ${importedScenarios.length}\n\n` +
                'Нажмите "ОК" чтобы ЗАМЕНИТЬ текущие данные\n' +
                'Нажмите "Отмена" чтобы ДОБАВИТЬ к текущим данным'
            );
            
            if (replace) {
                scenarios = importedScenarios;
            } else {
                scenarios = scenarios.concat(importedScenarios);
            }
            
            saveToLocalStorage();
            renderTable();
            updateTeamFilter();
            alert(`Успешно импортировано ${importedScenarios.length} сценариев!`);
            
        } catch (error) {
            alert('Ошибка при импорте CSV: ' + error.message);
            console.error(error);
        }
    };
    
    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

function loadFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                const replace = confirm(
                    `Найдено сценариев: ${data.length}\n\n` +
                    'Нажмите "ОК" чтобы ЗАМЕНИТЬ текущие данные\n' +
                    'Нажмите "Отмена" чтобы ДОБАВИТЬ к текущим данным'
                );
                
                data.forEach((scenario, index) => {
                    if (!scenario.id) {
                        scenario.id = generateId() + index;
                    }
                });
                
                if (replace) {
                    scenarios = data;
                } else {
                    scenarios = scenarios.concat(data);
                }
                
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

// ============================================
// Event Listeners
// ============================================
document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});
