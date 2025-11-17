<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Матрица рисков</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #F4F6F9;
            color: #2F3A4C;
        }

        header {
            background-color: #2F3A4C;
            color: white;
            padding: 24px 32px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        header h1 {
            font-size: 28px;
            font-weight: 600;
        }

        .container {
            display: flex;
            gap: 24px;
            padding: 32px;
            max-width: 1800px;
            margin: 0 auto;
        }

        .main-content {
            flex: 1;
            min-width: 0;
        }

        .card {
            background: #FFFFFF;
            border-radius: 10px;
            padding: 24px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            margin-bottom: 24px;
        }

        .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .btn-primary {
            background-color: #5CAEFF;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(92, 174, 255, 0.3);
        }

        .btn-primary:hover {
            background-color: #4A9EEE;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(92, 174, 255, 0.4);
        }

        .btn-success {
            background-color: #2ECC71;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            margin-top: 16px;
        }

        .btn-success:hover {
            background-color: #27AE60;
            transform: translateY(-1px);
        }

        .btn-secondary {
            background-color: #6B7280;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-left: 8px;
        }

        .btn-secondary:hover {
            background-color: #4B5563;
        }

        .filters {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
            flex-wrap: wrap;
        }

        .filter-group {
            flex: 1;
            min-width: 200px;
        }

        .filter-group label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #6B7280;
            margin-bottom: 8px;
        }

        .filter-group input,
        .filter-group select {
            width: 100%;
            padding: 10px 14px;
            border: 2px solid #E8EAED;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s ease;
        }

        .filter-group input:focus,
        .filter-group select:focus {
            outline: none;
            border-color: #5CAEFF;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        thead {
            background-color: #F4F6F9;
        }

        th {
            padding: 14px 16px;
            text-align: left;
            font-size: 13px;
            font-weight: 600;
            color: #6B7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        td {
            padding: 16px;
            border-bottom: 1px solid #F4F6F9;
            font-size: 14px;
        }

        tbody tr {
            transition: background-color 0.2s ease;
        }

        tbody tr:hover {
            background-color: #F9FAFB;
        }

        .severity-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
        }

        .severity-low {
            background-color: #D1FAE5;
            color: #065F46;
        }

        .severity-medium {
            background-color: #FEF3C7;
            color: #92400E;
        }

        .severity-high {
            background-color: #FEE2E2;
            color: #991B1B;
        }

        .sidebar {
            width: 360px;
            background: #FFFFFF;
            border-radius: 10px;
            padding: 24px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            position: sticky;
            top: 32px;
            height: fit-content;
            max-height: calc(100vh - 64px);
            overflow-y: auto;
            transform: translateX(400px);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar.visible {
            transform: translateX(0);
            opacity: 1;
        }

        .sidebar h2 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 24px;
            color: #2F3A4C;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #6B7280;
            margin-bottom: 8px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 10px 14px;
            border: 2px solid #E8EAED;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            transition: border-color 0.3s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #5CAEFF;
        }

        .form-group textarea {
            resize: vertical;
            min-height: 80px;
        }

        .empty-state {
            text-align: center;
            padding: 48px 24px;
            color: #6B7280;
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
        }

        .btn-delete {
            background-color: transparent;
            color: #EF4444;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn-delete:hover {
            background-color: #FEE2E2;
        }

        @media (max-width: 1200px) {
            .container {
                flex-direction: column;
            }

            .sidebar {
                width: 100%;
                position: fixed;
                top: 0;
                right: 0;
                height: 100vh;
                max-height: 100vh;
                border-radius: 0;
                z-index: 1000;
                transform: translateX(100%);
            }

            .sidebar.visible {
                transform: translateX(0);
            }
        }

        .sync-status {
            font-size: 12px;
            color: #6B7280;
            padding: 8px 12px;
            background-color: #F4F6F9;
            border-radius: 6px;
            display: inline-block;
        }

        .sync-status.synced {
            color: #2ECC71;
        }

        .sync-status.error {
            color: #EF4444;
        }
    </style>
</head>
<body>
    <header>
        <h1>📊 Матрица рисков</h1>
    </header>

    <div class="container">
        <div class="main-content">
            <div class="top-bar">
                <button class="btn-primary" onclick="openSidebar()">+ Добавить риск</button>
                <div>
                    <span class="sync-status" id="syncStatus">🔄 Синхронизация...</span>
                    <button class="btn-secondary" onclick="exportToJSON()">📥 Экспорт JSON</button>
                    <button class="btn-secondary" onclick="document.getElementById('importFile').click()">📤 Импорт JSON</button>
                    <input type="file" id="importFile" accept=".json" style="display: none;" onchange="importFromJSON(event)">
                </div>
            </div>

            <div class="card">
                <div class="filters">
                    <div class="filter-group">
                        <label>🔍 Поиск по сценарию</label>
                        <input type="text" id="searchScenario" placeholder="Введите название сценария..." oninput="applyFilters()">
                    </div>
                    <div class="filter-group">
                        <label>👥 Команда</label>
                        <select id="filterTeam" onchange="applyFilters()">
                            <option value="">Все команды</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>🏷️ Тип риска</label>
                        <select id="filterType" onchange="applyFilters()">
                            <option value="">Все типы</option>
                        </select>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Сценарий</th>
                            <th>Шаг</th>
                            <th>Команды</th>
                            <th>Тип риска</th>
                            <th style="text-align: center;">Вероятность</th>
                            <th style="text-align: center;">Влияние</th>
                            <th style="text-align: center;">Критичность</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody id="riskTableBody">
                    </tbody>
                </table>
                <div id="emptyState" class="empty-state" style="display: none;">
                    <div class="empty-state-icon">📋</div>
                    <p>Нет рисков для отображения</p>
                </div>
            </div>
        </div>

        <div class="sidebar" id="sidebar">
            <h2>Новый риск</h2>
            <form id="riskForm" onsubmit="saveRisk(event)">
                <div class="form-group">
                    <label>Сценарий *</label>
                    <input type="text" id="scenario" required placeholder="Например: Авторизация пользователя">
                </div>

                <div class="form-group">
                    <label>Шаг *</label>
                    <textarea id="step" required placeholder="Опишите конкретный шаг..."></textarea>
                </div>

                <div class="form-group">
                    <label>Команды *</label>
                    <input type="text" id="teams" required placeholder="Например: Backend, Frontend">
                </div>

                <div class="form-group">
                    <label>Тип риска *</label>
                    <input type="text" id="type" required placeholder="Например: Технический">
                </div>

                <div class="form-group">
                    <label>Вероятность (1-5) *</label>
                    <input type="number" id="probability" required min="1" max="5" placeholder="От 1 до 5">
                </div>

                <div class="form-group">
                    <label>Влияние (1-5) *</label>
                    <input type="number" id="impact" required min="1" max="5" placeholder="От 1 до 5">
                </div>

                <button type="submit" class="btn-success">✓ Сохранить риск</button>
            </form>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>
