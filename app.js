// Данные рисков
let risks = [];
let nextId = 1;
let filteredRisks = [];
let editingCell = null;
let draggedElement = null;

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
            const stepRow = document.createElement('tr');
            stepRow.className = 'step-row';
            stepRow.dataset.type = 'step';
            stepRow.dataset.riskId = risk.id;
            stepRow.dataset.scenario = scenario;
            stepRow.draggable = true;
            
            stepRow.innerHTML = `
                <td><span class="drag-handle">⋮⋮</span></td>
                <td><div class="editable step-editable">${risk.step || ''}</div></td>
                <td><div class="editable teams-editable">${risk.teams || ''}</div></td>
                <td style="text-align: center;">
                    <span class="severity-badge severity-${risk.criticality ? risk.criticality.toLowerCase() : 'низкая'} criticality-badge">
                        ${risk.criticality === 'Высокая' ? '🔴' : risk.criticality === 'Средняя' ? '🟠' : '🟢'} ${risk.criticality || 'Не указана'}
                    </span>
                </td>
                <td><div class="editable mainrisk-editable">${risk.mainRisk || ''}</div></td>
                <td style="text-align: right;">
                    <button class="btn-delete delete-risk-btn">🗑️</button>
                </td>
            `;
            
            tbody.appendChild(stepRow);
            
            // Привязываем события
            const stepEditable = stepRow.querySelector('.step-editable');
            stepEditable.addEventListener('click', () => editCell(stepEditable, risk.id, 'step'));
            
            const teamsEditable = stepRow.querySelector('.teams-editable');
            teamsEditable.addEventListener('click', () => editCell(teamsEditable, risk.id, 'teams'));
            
            const mainRiskEditable = stepRow.querySelector('.mainrisk-editable');
            mainRiskEditable.addEventListener('click', () => editCell(mainRiskEditable, risk.id, 'mainRisk'));
            
            const criticalityBadge = stepRow.querySelector('.criticality-badge');
            criticalityBadge.addEventListener('click', () => editCriticality(risk.id));
            
            const deleteRiskBtn = stepRow.querySelector('.delete-risk-btn');
            deleteRiskBtn.addEventListener('click', () => deleteRisk(risk.id));
        });
    });
    
    // Добавляем обработчики drag and drop
    addDragAndDropHandlers();
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Добавить обработчики drag and drop
function addDragAndDropHandlers() {
    const rows = document.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const dragHandle = row.querySelector('.drag-handle');
        
        if (dragHandle) {
            dragHandle.addEventListener('dragstart', handleDragStart);
            row.addEventListener('dragover', handleDragOver);
            row.addEventListener('drop', handleDrop);
            row.addEventListener('dragend', handleDragEnd);
        }
    });
}

function handleDragStart(e) {
    draggedElement = e.target.closest('tr');
    draggedElement.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    const targetRow = e.target.closest('tr');
    if (!targetRow || targetRow === draggedElement) return;
    
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    
    targetRow.classList.add('drag-over');
    e.dataTransfer.dropEffect = 'move';
    
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    const targetRow = e.target.closest('tr');
    if (!targetRow || targetRow === draggedElement) return;
    
    const draggedType = draggedElement.dataset.type;
    const targetType = targetRow.dataset.type;
    const draggedScenario = draggedElement.dataset.scenario;
    const targetScenario = targetRow.dataset.scenario;
    
    if (draggedType === 'step' && targetType === 'step') {
        const draggedId = parseInt(draggedElement.dataset.riskId);
        const targetId = parseInt(targetRow.dataset.riskId);
        
        const draggedIndex = risks.findIndex(r => r.id === draggedId);
        const targetIndex = risks.findIndex(r => r.id === targetId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            const temp = risks[draggedIndex];
            risks.splice(draggedIndex, 1);
            risks.splice(targetIndex, 0, temp);
            
            applyFilters();
        }
    } else if (draggedType === 'scenario' && targetType === 'scenario') {
        const draggedRisks = risks.filter(r => r.scenario === draggedScenario);
        
        if (draggedRisks.length > 0) {
            const draggedFirstIndex = risks.findIndex(r => r.scenario === draggedScenario);
            const targetFirstIndex = risks.findIndex(r => r.scenario === targetScenario);
            
            const newRisks = [];
            let insertedDragged = false;
            
            risks.forEach(risk => {
                if (risk.scenario === draggedScenario) {
                    return;
                }
                
                if (risk.scenario === targetScenario && !insertedDragged) {
                    if (draggedFirstIndex < targetFirstIndex) {
                        newRisks.push(risk);
                        draggedRisks.forEach(r => newRisks.push(r));
                    } else {
                        draggedRisks.forEach(r => newRisks.push(r));
                        newRisks.push(risk);
                    }
                    insertedDragged = true;
                } else {
                    newRisks.push(risk);
                }
            });
            
            risks = newRisks;
            applyFilters();
        }
    }
    
    return false;
}

function handleDragEnd(e) {
    draggedElement.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    draggedElement = null;
}

// Редактирование сценария
function editScenario(cell, oldScenario) {
    if (editingCell) return;

    editingCell = cell;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = oldScenario;
    
    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
    input.select();

    function saveEdit() {
        const newScenario = input.value.trim();

        if (!newScenario) {
            alert('Название сценария не может быть пустым');
            input.focus();
            return;
        }

        risks.forEach(risk => {
            if (risk.scenario === oldScenario) {
                risk.scenario = newScenario;
            }
        });

        editingCell = null;
        updateFilterOptions();
        applyFilters();
    }

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            editingCell = null;
            applyFilters();
        }
    });
}

// Редактирование ячейки
function editCell(cell, riskId, field) {
    if (editingCell) return;

    editingCell = cell;
    const risk = risks.find(r => r.id === riskId);
    const currentValue = risk[field] || '';

    let input;
    if (field === 'step' || field === 'mainRisk') {
        input = document.createElement('textarea');
    } else {
        input = document.createElement('input');
        input.type = 'text';
    }

    input.value = currentValue;
    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();

    if (field !== 'step' && field !== 'mainRisk') {
        input.select();
    }

    function saveEdit() {
        let newValue = input.value.trim();

        if (!newValue && field !== 'mainRisk') {
            alert('Значение не может быть пустым');
            input.focus();
            return;
        }

        risk[field] = newValue;

        editingCell = null;
        updateFilterOptions();
        applyFilters();
    }

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            editingCell = null;
            applyFilters();
        }
    });
}

// Редактирование критичности
function editCriticality(riskId) {
    const risk = risks.find(r => r.id === riskId);
    const options = ['Высокая', 'Средняя', 'Низкая'];
    const currentIndex = options.indexOf(risk.criticality);
    const nextIndex = (currentIndex + 1) % options.length;
    
    risk.criticality = options[nextIndex];
    applyFilters();
}

// Сохранить риск
function saveRisk(event) {
    event.preventDefault();

    const newRisk = {
        id: nextId++,
        scenario: document.getElementById('scenario').value,
        step: document.getElementById('step').value,
        teams: document.getElementById('teams').value,
        criticality: document.getElementById('criticality').value,
        mainRisk: document.getElementById('mainRisk').value
    };

    risks.push(newRisk);
    updateFilterOptions();
    applyFilters();
    updateRiskCount();
    closeModal();
}

// Удалить риск
function deleteRisk(id) {
    if (confirm('Вы уверены, что хотите удалить этот риск?')) {
        risks = risks.filter(risk => risk.id !== id);
        updateFilterOptions();
        applyFilters();
        updateRiskCount();
    }
}

// Удалить сценарий
function deleteScenario(scenario) {
    const count = risks.filter(r => r.scenario === scenario).length;
    if (confirm(`Вы уверены, что хотите удалить сценарий "${scenario}" и все его шаги (${count})?`)) {
        risks = risks.filter(risk => risk.scenario !== scenario);
        updateFilterOptions();
        applyFilters();
        updateRiskCount();
    }
}

// Обновить счётчик рисков
function updateRiskCount() {
    document.getElementById('riskCount').textContent = risks.length;
}

// Импорт из CSV
function importFromCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n');
        
        const newRisks = [];
        let currentScenario = '';
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = parseCSVLine(line);
            
            if (values.length >= 5) {
                if (values[0] && values[0].trim()) {
                    currentScenario = values[0].trim();
                }

                if (currentScenario && values[1] && values[1].trim()) {
                    const risk = {
                        id: nextId++,
                        scenario: currentScenario,
                        step: values[1].trim(),
                        teams: values[2] ? values[2].trim() : '',
                        criticality: extractCriticality(values[3]),
                        mainRisk: values[4] ? values[4].trim() : ''
                    };

                    newRisks.push(risk);
                }
            }
        }

        risks = risks.concat(newRisks);
        updateFilterOptions();
        applyFilters();
        updateRiskCount();
        
        alert(`Успешно импортировано ${newRisks.length} рисков`);
    };

    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
}

// Парсинг строки CSV
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
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

// Извлечение критичности
function extractCriticality(text) {
    if (!text) return 'Низкая';
    
    const lower = text.toLowerCase();
    if (lower.includes('высокая') || lower.includes('🔴')) return 'Высокая';
    if (lower.includes('средняя') || lower.includes('🟠')) return 'Средняя';
    return 'Низкая';
}

// Экспорт в CSV
function exportToCSV() {
    if (risks.length === 0) {
        alert('Нет данных для экспорта');
        return;
    }

    let csv = 'Сценарий,Шаг пользователя,Участвующие команды,Критичность,Основной риск\n';

    const { grouped, order } = groupRisksByScenario(risks);
    
    order.forEach(scenario => {
        const scenarioRisks = grouped[scenario];
        
        scenarioRisks.forEach((risk, index) => {
            const row = [
                index === 0 ? `"${risk.scenario}"` : '""',
                `"${risk.step || ''}"`,
                `"${risk.teams || ''}"`,
                `"${risk.criticality || ''}"`,
                `"${risk.mainRisk || ''}"`
            ].join(',');
            
            csv += row + '\n';
        });
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'matrica_riskov_' + new Date().toISOString().split('T')[0] + '.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', init);
