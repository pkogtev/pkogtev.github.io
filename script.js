// script.js (исправленная версия под старый формат данных)
// Поддерживает формат:
// {
//   id, scenario, step, teams, mainRisk, r, a, probability, impact, severity
// }

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

// При первом запуске просим токен (если его нет в localStorage)
const storedToken = localStorage.getItem('github_token') || '';
if (!storedToken) {
    // не показываем prompt автоматически если уже установлен токен в коде
    // но если в localStorage нет — спрашиваем один раз
    const tokenPrompt = prompt('Введите GitHub Personal Access Token (оставьте пустым для только чтения):') || '';
    if (tokenPrompt) {
        localStorage.setItem('github_token', tokenPrompt);
        GITHUB_CONFIG.token = tokenPrompt;
    } else if (storedToken) {
        GITHUB_CONFIG.token = storedToken;
    }
} else {
    GITHUB_CONFIG.token = storedToken;
}

// API URL
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
// raw URL kept only as fallback (но мы предпочитаем API)
const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.path}`;

function saveToLocalStorage() {
    try {
        localStorage.setItem('risks', JSON.stringify(risks));
        console.log('Данные сохранены в localStorage');
    } catch (e) {
        console.error('Ошибка сохранения в localStorage', e);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('risks');
        if (saved) {
            risks = JSON.parse(saved);
            console.log('Данные загружены из localStorage');
            return true;
        }
    } catch (e) {
        console.warn('Ошибка чтения localStorage', e);
    }
    return false;
}

async function loadRisksFromGitHub() {
    try {
        // используем GitHub API, Accept: raw — чтобы получить свежий контент и избежать CDN-кэша
        const headers = { 'Accept': 'application/vnd.github.v3.raw' };
        if (GITHUB_CONFIG.token) headers['Authorization'] = `Bearer ${GITHUB_CONFIG.token}`;

        const response = await fetch(GITHUB_API_URL + '?t=' + Date.now(), { headers });

        if (response.ok) {
            const text = await response.text();
            // Пытаемся распарсить как JSON
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                risks = parsed;
                console.log('Данные загружены из GitHub:', risks.length, 'рисков');
                saveToLocalStorage();
                return;
            } else {
                console.warn('Формат данных из GitHub не массив, используем локальные данные');
            }
        } else {
            console.warn('Не удалось загрузить из GitHub, статус:', response.status);
        }
    } catch (error) {
        console.warn('Ошибка при загрузке из GitHub:', error);
    }

    // fallback: если нет данных из GitHub и нет localStorage — используем demo-набор
    if (!loadFromLocalStorage()) {
        risks = [
            {
                id: Date.now() + Math.random(),
                scenario: "Авторизация пользователя",
                step: "Ввод логина и пароля",
                teams: "Backend, Frontend",
                mainRisk: "Неправильная валидация данных",
                r: "R1",
                a: "A1",
                probability: 3,
                impact: 4,
                severity: 12
            },
            {
                id: Date.now() + Math.random(),
                scenario: "Оплата заказа",
                step: "Интеграция с платёжной системой",
                teams: "Backend, Payment",
                mainRisk: "Потеря транзакции при сбое",
                r: "R2",
                a: "A2",
                probability: 4,
                impact: 5,
                severity: 20
            }
        ];
        saveToLocalStorage();
    }
}

async function getFileShaFromGitHub() {
    try {
        const headers = { 'Accept': 'application/vnd.github.v3+json' };
        if (GITHUB_CONFIG.token) headers['Authorization'] = `Bearer ${GITHUB_CONFIG.token}`;

        const resp = await fetch(GITHUB_API_URL, { headers });
        if (resp.ok) {
            const data = await resp.json();
            return data.sha || null;
        } else if (resp.status === 404) {
            return null; // файла нет - создадим
        } else {
            console.warn('Не удалось получить SHA файла, статус:', resp.status);
            return null;
        }
    } catch (e) {
        console.error('Ошибка получения SHA файла', e);
        return null;
    }
}

async function saveRisksToGitHub() {
    // Всегда сначала сохраняем в localStorage
    saveToLocalStorage();

    // Если токен не задан — сохраняем только локально и информируем
    if (!GITHUB_CONFIG.token) {
        console.warn('GitHub token не настроен — сохранение только в localStorage');
        return;
    }

    try {
        const sha = await getFileShaFromGitHub();

        // Подготавливаем контент
        const contentStr = JSON.stringify(risks, null, 2);
        // base64 encode (utf-8 safe)
        const contentBase64 = btoa(unescape(encodeURIComponent(contentStr)));

        const body = {
            message: `Update risks data - ${new Date().toISOString()}`,
            content: contentBase64,
            branch: GITHUB_CONFIG.branch
        };
        if (sha) body.sha = sha;

        const resp = await fetch(GITHUB_API_URL, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (resp.ok) {
            console.log('✅ Данные успешно сохранены в GitHub');
            // обновим localStorage на случай, если GitHub привёл файл к другому формату
            saveToLocalStorage();
        } else {
            const text = await resp.text();
            throw new Error(`GitHub save failed: ${resp.status} ${text}`);
        }
    } catch (error) {
        console.error('Ошибка сохранения в GitHub:', error);
        alert('⚠️ Не удалось сохранить в GitHub. Данные сохранены локально.');
    }
}

function ensureUniqueId() {
    let id;
    do {
        id = Date.now() + Math.random();
    } while (risks.some(r => r.id === id));
    return id;
}

/* ----------------- Rendering / Table ----------------- */
function getSeverityClass(severity) {
    if (severity === null || severity === undefined) return 'severity-medium';
    if (severity <= 5) return 'severity-low';
    if (severity <= 12) return 'severity-medium';
    if (severity <= 20) return 'severity-high';
    return 'severity-critical';
}

function getFilteredRisks() {
    const searchTerm = (document.getElementById('searchScenario')?.value || '').toLowerCase();
    const teamFilter = document.getElementById('filterTeam')?.value || '';
    const typeFilter = document.getElementById('filterType')?.value || '';

    return risks.filter(risk => {
        const matchSearch = (risk.scenario || '').toLowerCase().includes(searchTerm);
        const matchTeam = !teamFilter || (risk.teams || '').includes(teamFilter);
        // typeFilter in old format may be absent; skip if none
        const matchType = !typeFilter || (risk.type === typeFilter);
        return matchSearch && matchTeam && matchType;
    });
}

function updateFilters() {
    // teams: split by comma in each risk
    const teams = [...new Set(risks.flatMap(r => (r.teams || '').split(',').map(t => t.trim()).filter(Boolean)))];
    const types = [...new Set(risks.map(r => r.type).filter(Boolean))];

    const teamSelect = document.getElementById('filterTeam');
    const typeSelect = document.getElementById('filterType');

    if (!teamSelect || !typeSelect) return;

    const currentTeam = teamSelect.value;
    const currentType = typeSelect.value;

    teamSelect.innerHTML = '<option value="">Все команды</option>' +
        teams.map(team => `<option value="${team}" ${team === currentTeam ? 'selected' : ''}>${team}</option>`).join('');

    typeSelect.innerHTML = '<option value="">Все типы</option>' +
        types.map(type => `<option value="${type}" ${type === currentType ? 'selected' : ''}>${type}</option>`).join('');
}

function renderTable() {
    const tbody = document.getElementById('risksTableBody');
    if (!tbody) return;
    const filteredRisks = getFilteredRisks();

    if (filteredRisks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <p style="font-size: 18px; margin-bottom: 10px;">Нет данных для отображения</p>
                    <p>Добавьте риски или измените фильтры</p>
                </td>
            </tr>
        `;
        return;
    }

    // Группируем по сценарию
    const grouped = {};
    filteredRisks.forEach(r => {
        const sc = r.scenario || 'Без сценария';
        if (!grouped[sc]) grouped[sc] = [];
        grouped[sc].push(r);
    });

    let html = '';
    for (const [scenario, arr] of Object.entries(grouped)) {
        html += `
            <tr class="scenario-header">
                <td colspan="8">
                    <span class="editable-scenario" data-scenario="${escapeHtml(scenario)}">${escapeHtml(scenario)}</span>
                </td>
            </tr>
        `;
        arr.forEach(risk => {
            const prob = risk.probability ?? '';
            const impact = risk.impact ?? '';
            const severity = risk.severity ?? ( (Number.isFinite(prob) && Number.isFinite(impact)) ? prob * impact : '' );

            html += `
                <tr>
                    <td><span class="editable" data-id="${risk.id}" data-field="step">${escapeHtml(risk.step || '')}</span></td>
                    <td><span class="editable" data-id="${risk.id}" data-field="teams">${escapeHtml(risk.teams || '')}</span></td>
                    <td><span class="editable" data-id="${risk.id}" data-field="mainRisk">${escapeHtml(risk.mainRisk || '')}</span></td>
                    <td><span class="editable" data-id="${risk.id}" data-field="r">${escapeHtml(risk.r || '')}</span></td>
                    <td><span class="editable" data-id="${risk.id}" data-field="a">${escapeHtml(risk.a || '')}</span></td>
                    <td><span class="editable number-input" data-id="${risk.id}" data-field="probability">${escapeHtml(prob)}</span></td>
                    <td><span class="editable number-input" data-id="${risk.id}" data-field="impact">${escapeHtml(impact)}</span></td>
                    <td><span class="severity-badge ${getSeverityClass(severity)}">${escapeHtml(severity)}</span>
                        <button class="btn-danger" style="margin-left:10px;" onclick="deleteRisk(${risk.id})">Удалить</button>
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

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/* ---------- Inline editing ---------- */
function attachScenarioEditListeners() {
    document.querySelectorAll('.editable-scenario').forEach(el => {
        el.addEventListener('click', function() {
            const oldScenario = this.dataset.scenario || this.textContent;
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
                        if ((risk.scenario || '') === oldScenario) risk.scenario = newScenario;
                    });
                    await saveRisksToGitHub();
                }
                renderTable();
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') saveEdit();
            });
        });
    });
}

function attachEditListeners() {
    document.querySelectorAll('.editable').forEach(el => {
        el.addEventListener('click', function() {
            const id = this.dataset.id;
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
                const newValueRaw = input.value;
                const risk = risks.find(r => String(r.id) === String(id));
                if (!risk) {
                    renderTable();
                    return;
                }

                if (input.type === 'number') {
                    const v = parseInt(newValueRaw);
                    risk[field] = Number.isFinite(v) ? v : null;
                    // пересчитать severity, если возможно
                    const p = Number.isFinite(risk.probability) ? risk.probability : null;
                    const i = Number.isFinite(risk.impact) ? risk.impact : null;
                    risk.severity = (p !== null && i !== null) ? (p * i) : null;
                } else {
                    risk[field] = newValueRaw;
                }
                await saveRisksToGitHub();
                renderTable();
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') saveEdit();
            });
        });
    });
}

/* ---------- Modal / Add steps & risks ---------- */
function openModal() {
    document.getElementById('modalOverlay').classList.add('active');
    document.getElementById('stepsContainer').innerHTML = '';
    stepCounter = 0;
    riskCounter = 0;
    addStep();
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    const form = document.getElementById('riskForm');
    if (form) form.reset();
}

function closeModalOnOverlay(event) {
    if (event.target === event.currentTarget) closeModal();
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
    const el = document.getElementById(`step-${stepId}`);
    if (el) el.remove();
}

function addRiskToStep(stepId) {
    riskCounter++;
    const risksContainer = document.getElementById(`risks-${stepId}`);
    const riskIdLocal = riskCounter;
    const riskDiv = document.createElement('div');
    riskDiv.className = 'risk-item';
    riskDiv.id = `risk-${riskIdLocal}`;
    riskDiv.innerHTML = `
        <div class="risk-item-header">
            <strong>Риск ${riskIdLocal}</strong>
            <button type="button" class="action-btn" onclick="removeRiskFromModal(${riskIdLocal})">❌</button>
        </div>

        <div class="form-group">
            <label>Команды *</label>
            <input type="text" class="risk-teams" required placeholder="Например: Backend, Frontend">
        </div>

        <div class="form-group">
            <label>Основной риск *</label>
            <input type="text" class="risk-main" required placeholder="Опишите риск">
        </div>

        <div class="form-row-3">
            <div class="form-group">
                <label>R *</label>
                <input type="text" class="risk-r" required placeholder="Например: R1">
            </div>
            <div class="form-group">
                <label>A *</label>
                <input type="text" class="risk-a" required placeholder="Например: A1">
            </div>
            <div class="form-group">
                <label>Влияние (1-5) *</label>
                <input type="number" class="risk-impact" min="1" max="5" required>
            </div>
        </div>

        <div class="form-group">
            <label>Вероятность (1-5) *</label>
            <input type="number" class="risk-probability" min="1" max="5" required>
        </div>
    `;
    risksContainer.appendChild(riskDiv);
}

function removeRiskFromModal(riskIdLocal) {
    const el = document.getElementById(`risk-${riskIdLocal}`);
    if (el) el.remove();
}

/* ---------- Submit new risks from modal ---------- */
async function addRisk(event) {
    event.preventDefault();

    const scenarioName = document.getElementById('scenarioName')?.value || '';
    if (!scenarioName.trim()) {
        alert('Введите название сценария');
        return;
    }

    const steps = document.querySelectorAll('.step-item');
    steps.forEach(stepElement => {
        const stepName = stepElement.querySelector('.step-name')?.value || '';
        const riskItems = stepElement.querySelectorAll('.risk-item');

        riskItems.forEach(riskItem => {
            const teams = riskItem.querySelector('.risk-teams')?.value || '';
            const mainRisk = riskItem.querySelector('.risk-main')?.value || '';
            const r = riskItem.querySelector('.risk-r')?.value || '';
            const a = riskItem.querySelector('.risk-a')?.value || '';
            const probabilityRaw = riskItem.querySelector('.risk-probability')?.value;
            const impactRaw = riskItem.querySelector('.risk-impact')?.value;

            const probability = probabilityRaw ? parseInt(probabilityRaw) : null;
            const impact = impactRaw ? parseInt(impactRaw) : null;
            const severity = (Number.isFinite(probability) && Number.isFinite(impact)) ? probability * impact : null;

            const newRisk = {
                id: ensureUniqueId(),
                scenario: scenarioName,
                step: stepName,
                teams: teams,
                mainRisk: mainRisk,
                r: r,
                a: a,
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
}

/* ---------- Delete ---------- */
async function deleteRisk(id) {
    if (!confirm('Вы уверены, что хотите удалить этот риск?')) return;
    risks = risks.filter(r => String(r.id) !== String(id));
    await saveRisksToGitHub();
    renderTable();
}

/* ---------- Download / Upload JSON ---------- */
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

// alias (в HTML у тебя мог быть saveToJSON)
function saveToJSON() { downloadJSON(); }

function loadFromJSON() {
    const input = document.getElementById('fileInput');
    input.click();
}

/* ---------- Sync handler ---------- */
async function syncWithGitHub(event) {
    const btn = event?.target || document.querySelector('button[onclick*="syncWithGitHub"]') || null;
    if (btn) {
        btn.disabled = true;
        btn.textContent = '🔄 Синхронизация...';
    }

    await loadRisksFromGitHub();
    renderTable();

    if (btn) {
        btn.disabled = false;
        btn.textContent = '🔄 Синхронизировать';
    }
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', async () => {
    // Попробуем сначала загрузить из localStorage
    const hasLocal = loadFromLocalStorage();
    if (hasLocal) renderTable();

    // Затем пробуем загрузить из GitHub (обновить)
    await loadRisksFromGitHub();
    renderTable();

    // Обработчик для загрузки JSON файла
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const loaded = JSON.parse(event.target.result);
                        if (Array.isArray(loaded)) {
                            // простая проверка структуры — приводим всё к старому формату, где возможно
                            loaded.forEach(item => {
                                // если нет id — назначаем
                                if (!item.id) item.id = ensureUniqueId();
                                // гарантируем поля
                                if (!('probability' in item)) item.probability = null;
                                if (!('impact' in item)) item.impact = null;
                                if (!('severity' in item)) item.severity = (Number.isFinite(item.probability) && Number.isFinite(item.impact)) ? item.probability * item.impact : null;
                            });
                            risks = loaded;
                            await saveRisksToGitHub();
                            renderTable();
                            alert('Данные успешно загружены!');
                        } else {
                            alert('Неверный формат файла (ожидается массив)');
                        }
                    } catch (error) {
                        alert('Ошибка загрузки файла: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
            fileInput.value = '';
        });
    }

    // Кнопка "Загрузить JSON" (если есть)
    const loadBtn = document.getElementById('loadJSONBtn');
    if (loadBtn) loadBtn.addEventListener('click', loadFromJSON);
});
