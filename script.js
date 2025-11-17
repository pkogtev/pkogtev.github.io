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
    const teams = [...new Set(risks.flatMap(r => (]()
