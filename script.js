let risks = [];
let stepCounter = 0;
let riskCounter = 0;

// GitHub настройки
const GITHUB_CONFIG = {
    owner: 'pkogtev',  // Ваш GitHub username
    repo: 'pkogtev.github.io',    // Название репозитория
    branch: 'main',          // Ветка (main или master)
    path: 'data/risks.json', // Путь к файлу данных
    token: ''  // GitHub Personal Access Token (оставьте пустым для публичного чтения)
};

// URL для GitHub API
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;

// Для простоты используем raw.githubusercontent.com для чтения
const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.path}`;

async function loadRisksFromGitHub() {
    try {
        // Пробуем загрузить из GitHub
        const response = await fetch(RAW_URL + '?t=' + Date.now()); // добавляем timestamp для обхода кеша
        
        if (response.ok) {
            risks = await response.json();
            console.log('Данные загружены из GitHub:', risks.length, 'рисков');
        } else {
            throw new Error('Файл не найден');
        }
    } catch (error) {
        console.warn('Не удалось загрузить из GitHub, используем начальные данные:', error);
        
        // Начальные данные
        risks = [
            {
                id: 1,
                scenario: "Авторизация пользователя",
                step: "Ввод логина и пароля",
                teams: "Backend, Frontend",
                type: "Технический",
                probability: 3,
                impact: 4,
                severity: 12
            },
            {
                id: 2,
                scenario: "Оплата заказа",
                step: "Интеграция с платёжной системой",
                teams: "Backend, Payment",
                type: "Бизнес",
                probability: 4,
                impact: 5,
                severity: 20
            },
            {
                id: 3,
                scenario: "Оплата заказа",
                step: "Обработка ошибок оплаты",
                teams: "Backend, Frontend",
                type: "Бизнес",
                probability: 3,
                impact: 5,
                severity: 15
            },
            {
                id: 4,
                scenario: "Загрузка файла",
                step: "Валидация формата файла",
                teams: "Backend, QA",
                type: "Безопасность",
                probability: 2,
                impact: 3,
                severity: 6
            }
        ];
        
        // Сохраняем в localStorage
        saveToLocalStorage();
    }
}

function saveToLocalStorage() {
    localStorage.setItem('risks', JSON.stringify(risks));
    console.log('Данные сохранены в localStorage');
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('risks');
    if (saved) {
        risks = JSON.parse(saved);
        console.log('Данные загружены из localStorage');
        return true;
    }
    return false;
}

async function saveRisksToGitHub() {
    if (!GITHUB_CONFIG.token) {
        console.warn('GitHub token не настроен, сохранение только в localStorage');
        saveToLocalStorage();
        alert('💾 Данные сохранены локально.\n\nДля сохранения в GitHub:\n1. Создайте Personal Access Token\n2. Добавьте его в GITHUB_CONFIG.token');
        return;
    }

    try {
        // Получаем текущий SHA файла (нужен для обновления)
        const getResponse = await fetch(GITHUB_API_URL, {
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        let sha = null;
        if (getResponse.ok) {
            const data = await getResponse.json();
            sha = data.sha;
        }

        // Конвертируем данные в base64
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(risks, null, 2))));

        // Создаем или обновляем файл
        const updateResponse = await fetch(GITHUB_API_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Update risks data - ${new Date().toISOString()}`,
                content: content,
                sha: sha,
                branch: GITHUB_CONFIG.branch
            })
        });

        if (updateResponse.ok) {
            console.log('✅ Данные успешно сохранены в GitHub');
            saveToLocalStorage(); // Дублируем в localStorage
        } else {
            throw new Error('Ошибка сохранения в GitHub');
        }
    } catch (error) {
        console.error('Ошибка сохранения в GitHub:', error);
        saveToLocalStorage(); // Сохраняем хотя бы локально
        alert('⚠️ Не удалось сохранить в GitHub, данные сохранены локально');
    }
}

function renderTable() {
    const tbody = document.getElementById('risksTableBody');
    const filteredRisks = getFilteredRisks();

    if (filteredRisks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <p style="font-size: 18px; margin-bottom: 10px;">Нет данных для отображения</p>
                    <p>Добавьте риски или измените фильтры</p>
                </td>
            </tr>
        `;
        return;
    }

    // Группируем риски по сценариям
    const groupedRisks = {};
    filteredRisks.forEach(risk => {
        if (!groupedRisks[risk.scenario]) {
            groupedRisks[risk.scenario] = [];
        }
        groupedRisks[risk.scenario].push(risk);
    });

    // Формируем HTML
    let html = '';
    for (const [scenario, scenarioRisks] of Object.entries(groupedRisks)) {
        html += `
            <tr class="scenario-header">
                <td colspan="7">
                    <span class="editable-scenario" data-scenario="${scenario}">${scenario}</span>
                </td>
            </tr>
        `;
        
        scenarioRisks.forEach(risk => {
            html += `
                <tr>
                    <td><span class="editable" data-id="${risk.id}" data-field="step">${risk.step}</span></td>
                    <td><span class="editable" data-id="${risk.id}" data-field="teams">${risk.teams}</span></td>
                    <td><span class="editable" data-id="${risk.id}" data-field="type">${risk.type}</span></td>
                    <td><span class="editable number-input" data-id="${risk.id}" data-field="probability">${risk.probability}</span></td>
                    <td><span class="editable number-input" data-id="${risk.id}" data-field="impact">${risk.impact}</span></td>
                    <td><span class="severity-badge ${getSeverityClass(risk.severity)}">${risk.severity}</span></td>
                    <td>
                        <button class="btn-danger" onclick="deleteRisk(${risk.id})">Удалить</button>
                    </td>
                </tr>
            `;
        });
    }

    tbody.innerHTML = html;
    attachEditListeners();
    attachScenarioEditListeners();
    updateFilters();
}

function attachScenarioEditListeners() {
    document.querySelectorAll('.editable-scenario').forEach(el => {
        el.addEventListener('click', function() {
            const oldScenario = this.dataset.scenario;
            const currentValue = this.textContent;

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'editable-input';
            input.value = currentValue;
            input.style.fontSize = '16px';
            input.style.fontWeight = '600';

            this.replaceWith(input);
            input.focus();

            const saveEdit = async () => {
                const newScenario = input.value.trim();
                if (newScenario && newScenario !== oldScenario) {
                    risks.forEach(risk => {
                        if (risk.scenario === oldScenario) {
                            risk.scenario = newScenario;
                        }
                    });
                    await saveRisksToGitHub();
                }
                renderTable();
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveEdit();
                }
            });
        });
    });
}

function attachEditListeners() {
    document.querySelectorAll('.editable').forEach(el => {
        el.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            const field = this.dataset.field;
            const currentValue = this.textContent;

            const input = document.createElement('input');
            input.type = ['probability', 'impact'].includes(field) ? 'number' : 'text';
            input.className = 'editable-input';
            input.value = currentValue;

            if (input.type === 'number') {
                input.min = 1;
                input.max = 5;
            }

            this.replaceWith(input);
            input.focus();

            const saveEdit = async () => {
                const newValue = input.value;
                const risk = risks.find(r => r.id === id);
                
                if (risk) {
                    if (input.type === 'number') {
                        risk[field] = parseInt(newValue);
                        risk.severity = risk.probability * risk.impact;
                    } else {
                        risk[field] = newValue;
                    }
                    await saveRisksToGitHub();
                    renderTable();
                }
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveEdit();
                }
            });
        });
    });
}

function getSeverityClass(severity) {
    if (severity <= 5) return 'severity-low';
    if (severity <= 12) return 'severity-medium';
    if (severity <= 20) return 'severity-high';
    return 'severity-critical';
}

function getFilteredRisks() {
    const searchTerm = document.getElementById('searchScenario').value.toLowerCase();
    const teamFilter = document.getElementById('filterTeam').value;
    const typeFilter = document.getElementById('filterType').value;

    return risks.filter(risk => {
        const matchSearch = risk.scenario.toLowerCase().includes(searchTerm);
        const matchTeam = !teamFilter || risk.teams.includes(teamFilter);
        const matchType = !typeFilter || risk.type === typeFilter;
        return matchSearch && matchTeam && matchType;
    });
}

function updateFilters() {
    const teams = [...new Set(risks.flatMap(r => r.teams.split(',').map(t => t.trim())))];
    const types = [...new Set(risks.map(r => r.type))];

    const teamSelect = document.getElementById('filterTeam');
    const typeSelect = document.getElementById('filterType');

    const currentTeam = teamSelect.value;
    const currentType = typeSelect.value;

    teamSelect.innerHTML = '<option value="">Все команды</option>' +
        teams.map(team => `<option value="${team}" ${team === currentTeam ? 'selected' : ''}>${team}</option>`).join('');

    typeSelect.innerHTML = '<option value="">Все типы</option>' +
        types.map(type => `<option value="${type}" ${type === currentType ? 'selected' : ''}>${type}</option>`).join('');
}

function applyFilters() {
    renderTable();
}

function openModal() {
    document.getElementById('modalOverlay').classList.add('active');
    document.getElementById('stepsContainer').innerHTML = '';
    stepCounter = 0;
    riskCounter = 0;
    addStep();
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('riskForm').reset();
}

function closeModalOnOverlay(event) {
    if (event.target === event.currentTarget) {
        closeModal();
    }
}

function addStep() {
    if (stepCounter >= 10) {
        alert('Максимум 10 шагов');
        return;
    }

    stepCounter++;
    const stepsContainer = document.getElementById('stepsContainer');
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step-item';
    stepDiv.id = `step-${stepCounter}`;
    stepDiv.innerHTML = `
        <div class="step-header">
            <h4>Шаг ${stepCounter}</h4>
            <button type="button" class="btn-danger" onclick="removeStep(${stepCounter})">Удалить шаг</button>
        </div>
        <div class="form-group">
            <label>Название шага *</label>
            <input type="text" class="step-name" required placeholder="Например: Проверка прав доступа">
        </div>
        <div class="risks-container" id="risks-${stepCounter}">
            <label style="display: block; margin-bottom: 10px; font-weight: 500;">Риски</label>
        </div>
        <button type="button" class="btn-secondary" onclick="addRiskToStep(${stepCounter})">+ Добавить риск</button>
    `;
    stepsContainer.appendChild(stepDiv);
    addRiskToStep(stepCounter);
}

function removeStep(stepId) {
    const stepElement = document.getElementById(`step-${stepId}`);
    if (stepElement) {
        stepElement.remove();
    }
}

function addRiskToStep(stepId) {
    riskCounter++;
    const risksContainer = document.getElementById(`risks-${stepId}`);
    const riskDiv = document.createElement('div');
    riskDiv.className = 'risk-item';
    riskDiv.id = `risk-${riskCounter}`;
    riskDiv.innerHTML = `
        <div class="risk-item-header">
            <strong>Риск ${riskCounter}</strong>
            <button type="button" class="action-btn" onclick="removeRisk(${riskCounter})">❌</button>
        </div>
        <div class="form-group">
            <label>Команды *</label>
            <input type="text" class="risk-teams" required placeholder="Например: Backend, Frontend">
        </div>
        <div class="form-group">
            <label>Тип риска *</label>
            <input type="text" class="risk-type" required placeholder="Например: Технический">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Вероятность (1-5) *</label>
                <input type="number" class="risk-probability" min="1" max="5" required>
            </div>
            <div class="form-group">
                <label>Влияние (1-5) *</label>
                <input type="number" class="risk-impact" min="1" max="5" required>
            </div>
        </div>
    `;
    risksContainer.appendChild(riskDiv);
}

function removeRisk(riskId) {
    const riskElement = document.getElementById(`risk-${riskId}`);
    if (riskElement) {
        riskElement.remove();
    }
}

async function addRisk(event) {
    event.preventDefault();
    
    const scenarioName = document.getElementById('scenarioName').value;
    const steps = document.querySelectorAll('.step-item');

    steps.forEach(stepElement => {
        const stepName = stepElement.querySelector('.step-name').value;
        const riskItems = stepElement.querySelectorAll('.risk-item');

        riskItems.forEach(riskItem => {
            const teams = riskItem.querySelector('.risk-teams').value;
            const type = riskItem.querySelector('.risk-type').value;
            const probability = parseInt(riskItem.querySelector('.risk-probability').value);
            const impact = parseInt(riskItem.querySelector('.risk-impact').value);
            const severity = probability * impact;

            const newRisk = {
                id: Date.now() + Math.random(),
                scenario: scenarioName,
                step: stepName,
                teams: teams,
                type: type,
                probability: probability,
                impact: impact,
                severity: severity
            };

            risks.push(newRisk);
        });
    });

    await saveRisksToGitHub();
    renderTable();
    closeModal();
    document.getElementById('riskForm').reset();
}

async function deleteRisk(id) {
    if (confirm('Вы уверены, что хотите удалить этот риск?')) {
        risks = risks.filter(r => r.id !== id);
        await saveRisksToGitHub();
        renderTable();
    }
}

function downloadJSON() {
    const dataStr = JSON.stringify(risks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `risks_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function loadFromJSON() {
    const input = document.getElementById('fileInput');
    input.click();
}

async function syncWithGitHub() {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '🔄 Синхронизация...';
    
    await loadRisksFromGitHub();
    renderTable();
    
    btn.disabled = false;
    btn.textContent = '🔄 Синхронизировать';
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Сначала пробуем загрузить из localStorage (быстро)
    const hasLocal = loadFromLocalStorage();
    if (hasLocal) {
        renderTable();
    }
    
    // Затем пробуем обновить из GitHub (медленнее)
    await loadRisksFromGitHub();
    renderTable();

    // Обработчик для загрузки JSON файла
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const loadedRisks = JSON.parse(event.target.result);
                    if (Array.isArray(loadedRisks)) {
                        risks = loadedRisks;
                        await saveRisksToGitHub();
                        renderTable();
                        alert('Данные успешно загружены!');
                    } else {
                        alert('Неверный формат файла');
                    }
                } catch (error) {
                    alert('Ошибка загрузки файла: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
        fileInput.value = '';
    });

    // Обработчик кнопки загрузки JSON
    document.getElementById('loadJSONBtn').addEventListener('click', loadFromJSON);
});
