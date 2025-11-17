let risks = [];
let stepCounter = 0;
let riskCounter = 0;

// GitHub настройки
const GITHUB_CONFIG = {
    owner: 'pkogtev', // Ваш GitHub username
    repo: 'pkogtev.github.io', // Название репозитория
    branch: 'main', // Ветка (main или master)
    path: 'data/risks.json', // Путь к файлу данных
    token: '' // GitHub Personal Access Token (оставьте пустым для публичного чтения)
};

// При первом запуске введите токен
const token = localStorage.getItem('github_token') || prompt('Введите GitHub Token:');
if (token) {
    localStorage.setItem('github_token', token);
    GITHUB_CONFIG.token = token;
}

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
                mainRisk: "Неправильная валидация данных",
                r: "R1",
                a: "A1",
                probability: 3,
                severity: 12
            },
            {
                id: 2,
                scenario: "Оплата заказа",
                step: "Интеграция с платёжной системой",
                teams: "Backend, Payment",
                mainRisk: "Потеря транзакции при сбое",
                r: "R2",
                a: "A2",
                probability: 4,
                severity: 20
            },
            {
                id: 3,
                scenario: "Оплата заказа",
                step: "Обработка ошибок оплаты",
                teams: "Backend, Frontend",
                mainRisk: "Некорректное отображение ошибки",
                r: "R3",
                a: "A3",
                probability: 3,
                severity: 15
            },
            {
                id: 4,
                scenario: "Загрузка файла",
                step: "Валидация формата файла",
                teams: "Backend, QA",
                mainRisk: "Загрузка вредоносного файла",
                r: "R4",
                a: "A4",
                probability: 2,
                severity: 8
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

        // Создаём или обновляем файл
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
                <td colspan="8" class="empty-state">
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
                <td colspan="8">
                    <span class="editable-scenario" data-scenario="${scenario}">${scenario}</span>
                </td>
            </tr>
        `;

        scenarioRisks.forEach(risk => {
            html += `
                <tr>
                    <td><span class="editable" data-id="${risk.id}" data-field="step">${risk.step}</span></td>
                    <td><span class="editable" data-id="${risk.id}" data-field="teams">${risk.teams}</span></td>
                    <td><span class="editable" data-id="${risk.id}" data-field="mainRisk">${risk.mainRisk}</span></td>
                    <td><span class="editable" data-id="${risk.id}" data-field="r">${risk.r}</span></td>
                    <td><span class="editable" data-id="${risk.id}" data-field="a">${risk.a}</span></td>
                    <td><span class="editable number-input" data-id="${risk.id}" data-field="probability">${risk.probability}</span></td>
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

document.addEventListener('DOMContentLoaded', () => {
    loadRisksFromGitHub().then(() => {
        renderTable();
    }).catch(error => {
        console.error('Ошибка при инициализации:', error);
    });
});
