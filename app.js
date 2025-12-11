// ============================================
// КОНФИГУРАЦИЯ
// Путь к JSON-файлу с данными матрицы рисков
// ============================================
const CONFIG = {
    dataSourceUrl: './risks-matrix-data.json', // Путь к JSON-файлу на S3 (в той же директории)
    localStorageKey: 'riskMatrix', // Ключ для сохранения в LocalStorage
    retryAttempts: 3, // Количество попыток загрузки при ошибке
    retryDelay: 1000 // Задержка между попытками (мс)
};

// ============================================
// STATE MANAGEMENT
// Глобальные переменные состояния приложения
// ============================================
let scenarios = []; // Массив всех сценариев рисков
let editingIndex = -1; // Индекс редактируемого сценария (-1 = режим создания)
let stepCounter = 0; // Счетчик шагов в модальном окне
let isDataLoadedFromExternal = false; // Флаг успешной загрузки из внешнего JSON

// ============================================
// INITIALIZATION
// Инициализация приложения при загрузке страницы
// ============================================
window.onload = async function() {
    console.log('🚀 Инициализация приложения...');
    
    // Показываем индикатор загрузки
    showLoading(true);
    
    try {
        // Пытаемся загрузить данные из внешнего JSON
        await loadDataFromExternalSource();
        
        // Если данных нет (пустой массив), пытаемся загрузить из LocalStorage
        if (scenarios.length === 0) {
            console.log('📦 Внешний источник пуст, загружаем из LocalStorage...');
            loadFromLocalStorage();
        }
        
        // Рендерим таблицу и обновляем фильтры
        renderTable();
        updateFilters();
        
        // Скрываем индикатор загрузки
        showLoading(false);
        
        console.log('✅ Приложение успешно инициализировано');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        
        // При ошибке загружаем из LocalStorage как fallback
        loadFromLocalStorage();
        renderTable();
        updateFilters();
        showLoading(false);
    }
    
    // Закрытие dropdown при клике вне его
    document.addEventListener('click', function(e) {
        // Закрываем кастомные dropdown для критичности
        if (!e.target.closest('.criticality-dropdown')) {
            document.querySelectorAll('.criticality-dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
};

// ============================================
// LOADING INDICATOR
// Управление индикатором загрузки
// ============================================
function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (show) {
        loadingOverlay.classList.add('active');
    } else {
        loadingOverlay.classList.remove('active');
    }
}

// ============================================
// ERROR HANDLING
// Отображение сообщений об ошибках
// ============================================
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.classList.add('show');
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        errorElement.classList.remove('show');
    }, 5000);
}

function hideError() {
    const errorElement = document.getElementById('errorMessage');
    errorElement.classList.remove('show');
}

// ============================================
// EXTERNAL DATA SOURCE
// Загрузка данных из внешнего JSON-файла
// ============================================
async function loadDataFromExternalSource() {
    console.log(`📡 Загрузка данных из: ${CONFIG.dataSourceUrl}`);
    
    let attempt = 0;
    
    // Повторяем попытки загрузки при ошибке
    while (attempt < CONFIG.retryAttempts) {
        try {
            const response = await fetch(CONFIG.dataSourceUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache' // Отключаем кэш для актуальности данных
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Валидация структуры данных
            if (!data || !data.scenarios || !Array.isArray(data.scenarios)) {
                throw new Error('Неверная структура JSON-файла. Ожидается объект с полем "scenarios"');
            }
            
            // Загружаем сценарии
            scenarios = data.scenarios;
            isDataLoadedFromExternal = true;
            
            console.log(`✅ Данные успешно загружены: ${scenarios.length} сценариев`);
            console.log(`📅 Версия данных: ${data.version || 'не указана'}`);
            console.log(`🕐 Последнее обновление: ${data.lastUpdated || 'не указано'}`);
            
            // Сохраняем в LocalStorage как резервную копию
            saveToLocalStorage();
            
            hideError();
            return;
            
        } catch (error) {
            attempt++;
            console.warn(`⚠️ Попытка ${attempt}/${CONFIG.retryAttempts} не удалась:`, error.message);
            
            if (attempt < CONFIG.retryAttempts) {
                // Ждем перед следующей попыткой
                await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
            } else {
                // Все попытки исчерпаны
                const errorMessage = `Не удалось загрузить данные из ${CONFIG.dataSourceUrl}. Используются локальные данные.`;
                console.error('❌', errorMessage);
                showError(errorMessage);
                throw error;
            }
        }
    }
}

// ============================================
// LOCALSTORAGE FUNCTIONS
// Работа с локальным хранилищем браузера
// ============================================
function saveToLocalStorage() {
    try {
        // Сохраняем только массив сценариев (без метаданных)
        localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(scenarios));
        console.log('💾 Данные сохранены в LocalStorage');
    } catch (e) {
        console.error('❌ Ошибка сохранения в LocalStorage:', e);
        showError('Не удалось сохранить данные локально');
    }
}

function loadFromLocalStorage() {
    const data = localStorage.getItem(CONFIG.localStorageKey);
    if (data) {
        try {
            scenarios = JSON.parse(data);
            console.log('📦 Данные загружены из LocalStorage:', scenarios.length, 'сценариев');
        } catch (e) {
            console.error('❌ Ошибка загрузки из LocalStorage:', e);
            scenarios = [];
            showError('Ошибка чтения локальных данных');
        }
    } else {
        console.log('ℹ️ LocalStorage пуст');
        scenarios = [];
    }
}

// ============================================
// ID GENERATION
// Генерация уникального ID для новых сценариев
// ============================================
function generateId() {
    if (scenarios.length === 0) return 1;
    return Math.max(...scenarios.map(s => s.id || 0)) + 1;
}

// ============================================
// MODAL FUNCTIONS
// Управление модальным окном добавления/редактирования
// ============================================
function openModal(index = -1) {
    editingIndex = index;
    const modal = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    
    if (index >= 0) {
        // Режим редактирования существующего сценария
        modalTitle.textContent = 'Редактировать сценарий';
        loadScenarioData(scenarios[index]);
    } else {
        // Режим создания нового сценария
        modalTitle.textContent = 'Добавить сценарий';
        document.getElementById('scenarioName').value = '';
        document.getElementById('stepsContainer').innerHTML = '';
        stepCounter = 0;
        addStep(); // Добавляем первый шаг по умолчанию
    }
    
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

// ============================================
// STEP MANAGEMENT
// Управление шагами в модальном окне
// ============================================
function addStep() {
    // Ограничение: максимум 10 шагов на сценарий
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
    // Перенумеровываем все шаги после удаления
    const steps = document.querySelectorAll('.step-item');
    steps.forEach((step, index) => {
        step.querySelector('.step-number').textContent = `Шаг ${index + 1}`;
    });
    stepCounter = steps.length;
}

// ============================================
// SAVE SCENARIO (CREATE OR UPDATE)
// Сохранение сценария (создание нового или обновление существующего)
// ============================================
function saveScenario() {
    const scenarioName = document.getElementById('scenarioName').value.trim();
    
    // Валидация: название сценария обязательно
    if (!scenarioName) {
        alert('Введите название сценария');
        return;
    }

    const stepItems = document.querySelectorAll('.step-item');
    
    // Валидация: хотя бы один шаг обязателен
    if (stepItems.length === 0) {
        alert('Добавьте хотя бы один шаг');
        return;
    }

    const steps = [];
    let hasError = false;

    // Собираем данные всех шагов
    stepItems.forEach((item, index) => {
        const stepName = item.querySelector('.step-name').value.trim();
        
        // Валидация: название шага обязательно
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
        // Обновляем существующий сценарий
        scenarios[editingIndex] = {
            ...scenarios[editingIndex],
            ...scenarioData
        };
    } else {
        // Создаем новый сценарий
        scenarioData.id = generateId();
        scenarios.push(scenarioData);
    }
    
    // Сохраняем в LocalStorage (т.к. внешний JSON read-only)
    saveToLocalStorage();
    renderTable();
    updateFilters();
    closeModal();
}

function loadScenarioData(scenario) {
    // Загружаем данные сценария в форму редактирования
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
// RENDER TABLE
// Отрисовка таблицы со сценариями и шагами
// ============================================
function renderTable() {
    const tbody = document.getElementById('tableBody');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const teamFilter = document.getElementById('teamFilter').value.toLowerCase();
    const criticalityFilter = document.getElementById('criticalityFilter').value;

    // Если нет данных, показываем empty state
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
    let visibleScenariosCount = 0; // Счетчик видимых сценариев

    // Отрисовываем каждый сценарий с его шагами
    scenarios.forEach((scenario, scenarioIndex) => {
        // Применяем фильтр поиска по названию сценария
        const matchesSearch = scenario.name.toLowerCase().includes(searchTerm);
        
        // Также ищем в названиях шагов и рисках
        const matchesSearchInSteps = scenario.steps.some(step => 
            step.name.toLowerCase().includes(searchTerm) ||
            (step.risk && step.risk.toLowerCase().includes(searchTerm)) ||
            (step.teams && step.teams.toLowerCase().includes(searchTerm))
        );
        
        // Если не найдено ни в названии сценария, ни в шагах - пропускаем
        if (searchTerm && !matchesSearch && !matchesSearchInSteps) {
            return;
        }

        // Фильтруем шаги по всем параметрам
        const visibleSteps = scenario.steps.filter(step => {
            // Фильтр по командам
            if (teamFilter && (!step.teams || !step.teams.toLowerCase().includes(teamFilter))) {
                return false;
            }
            
            // Фильтр по критичности
            if (criticalityFilter && step.criticality !== criticalityFilter) {
                return false;
            }
            
            return true;
        });

        // Показываем сценарий только если есть видимые шаги после фильтрации
        if (visibleSteps.length === 0 && (teamFilter || criticalityFilter)) {
            return;
        }

        // Увеличиваем счетчик видимых сценариев
        visibleScenariosCount++;

        // Строка сценария (заголовок)
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

        // Строки шагов сценария
        visibleSteps.forEach((step) => {
            // Находим оригинальный индекс шага в массиве
            const originalStepIndex = scenario.steps.indexOf(step);
            
            const stepRow = document.createElement('tr');
            stepRow.className = 'step-row';
            stepRow.innerHTML = `
                <td class="editable" onclick="editField(${scenarioIndex}, ${originalStepIndex}, 'name', this)">
                    ${step.name}
                </td>
                <td class="editable" onclick="editField(${scenarioIndex}, ${originalStepIndex}, 'teams', this)">
                    ${step.teams || '-'}
                </td>
                <td class="editable" onclick="editCriticality(${scenarioIndex}, ${originalStepIndex}, this)">
                    <span class="criticality criticality-${getCriticalityClass(step.criticality)}">
                        ${step.criticality}
                    </span>
                </td>
                <td class="editable" onclick="editFieldTextarea(${scenarioIndex}, ${originalStepIndex}, 'risk', this)">
                    ${step.risk || '-'}
                </td>
                <td class="editable" onclick="editField(${scenarioIndex}, ${originalStepIndex}, 'r', this)">
                    ${step.r || '-'}
                </td>
                <td class="editable" onclick="editField(${scenarioIndex}, ${originalStepIndex}, 'a', this)">
                    ${step.a || '-'}
                </td>
                <td class="actions-cell">
                    <button class="btn btn-danger" onclick="deleteStep(${scenarioIndex}, ${originalStepIndex})">🗑️</button>
                </td>
            `;
            tbody.appendChild(stepRow);
        });
    });

    // Показываем сообщение если ничего не найдено
    if (visibleScenariosCount === 0) {
        const activeFilters = [];
        if (searchTerm) activeFilters.push(`"${searchTerm}"`);
        if (teamFilter) activeFilters.push(`команда: ${teamFilter}`);
        if (criticalityFilter) activeFilters.push(`критичность: ${criticalityFilter}`);
        
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <p>Ничего не найдено${activeFilters.length > 0 ? ' по фильтрам: ' + activeFilters.join(', ') : ''}</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

function getCriticalityClass(criticality) {
    // Маппинг критичности на CSS-классы
    const map = {
        'Низкая': 'low',
        'Средняя': 'medium',
        'Высокая': 'high',
        'Критическая': 'critical'
    };
    return map[criticality] || 'low';
}

// ============================================
// INLINE EDITING FUNCTIONS
// Функции для inline-редактирования ячеек таблицы
// ============================================
function editScenarioName(scenarioIndex, cell) {
    const scenario = scenarios[scenarioIndex];
    const currentValue = scenario.name;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    
    // Сохраняем при потере фокуса
    input.onblur = function() {
        const newValue = this.value.trim();
        if (newValue && newValue !== currentValue) {
            scenario.name = newValue;
            saveToLocalStorage();
        }
        renderTable();
    };
    
    // Сохраняем при нажатии Enter
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
        updateFilters();
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
    
    // Создаём кастомный dropdown для выбора критичности
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
// DELETE FUNCTIONS
// Удаление сценариев и шагов
// ============================================
function deleteScenario(scenarioIndex) {
    if (confirm('Вы уверены, что хотите удалить этот сценарий со всеми шагами?')) {
        scenarios.splice(scenarioIndex, 1);
        saveToLocalStorage();
        renderTable();
        updateFilters();
    }
}

function deleteStep(scenarioIndex, stepIndex) {
    if (confirm('Вы уверены, что хотите удалить этот шаг?')) {
        scenarios[scenarioIndex].steps.splice(stepIndex, 1);
        
        // Если все шаги удалены, удаляем и сценарий
        if (scenarios[scenarioIndex].steps.length === 0) {
            scenarios.splice(scenarioIndex, 1);
        }
        
        saveToLocalStorage();
        renderTable();
        updateFilters();
    }
}

// ============================================
// FILTER FUNCTIONS
// Фильтрация и поиск
// ============================================
function applyFilters() {
    renderTable();
}

function updateFilters() {
    // Обновляем все фильтры на основе текущих данных
    updateTeamFilter();
}

function updateTeamFilter() {
    // Обновляем список команд в фильтре (убираем дубли)
    const teamFilter = document.getElementById('teamFilter');
    const currentValue = teamFilter.value;
    const teams = new Set();

    scenarios.forEach(scenario => {
        scenario.steps.forEach(step => {
            if (step.teams) {
                // Разделяем команды по запятой и добавляем в Set (автоматически убирает дубли)
                step.teams.split(',').forEach(team => {
                    const trimmedTeam = team.trim();
                    if (trimmedTeam) {
                        teams.add(trimmedTeam);
                    }
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
// EXPORT/IMPORT FUNCTIONS
// Экспорт и импорт данных
// ============================================
function saveToFile() {
    // Экспорт в формате совместимом с внешним JSON
    const exportData = {
        version: "1.0",
        lastUpdated: new Date().toISOString(),
        scenarios: scenarios
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
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

    // Формируем CSV с BOM для корректного отображения кириллицы в Excel
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
            
            // Удаляем BOM если есть
            if (lines[0].charCodeAt(0) === 0xFEFF) {
                lines[0] = lines[0].substring(1);
            }
            
            // Проверяем заголовок
            const header = lines[0].toLowerCase();
            if (!header.includes('сценарий') || !header.includes('шаг')) {
                alert('Неверный формат CSV файла.');
                return;
            }
            
            const importedScenarios = [];
            let currentScenario = null;
            
            // Парсим строки CSV
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const values = parseCSVLine(line);
                if (values.length < 7) continue;
                
                const [scenarioName, stepName, teams, criticality, risk, r, a] = values;
                
                // Новый сценарий
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
                
                // Добавляем шаг к текущему сценарию
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
            
            // Спрашиваем пользователя: заменить или добавить
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
            updateFilters();
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
    // Парсинг CSV-строки с учетом экранирования кавычек
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
            
            // Поддерживаем оба формата: с оберткой и без
            let importedScenarios;
            if (data.scenarios && Array.isArray(data.scenarios)) {
                // Новый формат с метаданными
                importedScenarios = data.scenarios;
                console.log(`📥 Импорт JSON версии ${data.version || 'не указана'}`);
            } else if (Array.isArray(data)) {
                // Старый формат: прямой массив
                importedScenarios = data;
            } else {
                alert('Неверный формат файла');
                return;
            }
            
            // Генерируем ID для сценариев без него
            importedScenarios.forEach((scenario, index) => {
                if (!scenario.id) {
                    scenario.id = generateId() + index;
                }
            });
            
            // Спрашиваем: заменить или добавить
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
            updateFilters();
            alert('Данные успешно загружены!');
            
        } catch (error) {
            alert('Ошибка при чтении файла: ' + error.message);
            console.error(error);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ============================================
// EVENT LISTENERS
// Обработчики событий
// ============================================
document.getElementById('modalOverlay').addEventListener('click', function(e) {
    // Закрытие модального окна при клике на overlay
    if (e.target === this) {
        closeModal();
    }
});
