// app.js — чистый Vanilla JS
(() => {
  // --- Настройки / колонки ---
  let columns = [
    'Сценарий',
    'Шаг пользователя',
    'Участвующие команды',
    'Критичность',
    'Основной риск'
  ];

  // --- Пример начальных рисков (3 примера) ---
  let risks = [
    // each item: {scenario, step, teams, type, probability, impact, severity, main}
    {scenario:'Регистрация пользователя', step:'Ввод email и пароля', teams:['Frontend','Auth'], type:'Validation', probability:3, impact:4, main:'Ошибка валидации позволяет SQLi', severity:3*4},
    {scenario:'Регистрация пользователя', step:'Подтверждение email', teams:['Backend','Email'], type:'Process', probability:2, impact:3, main:'Письмо не отправляется', severity:2*3},
    {scenario:'Платёжный поток', step:'Подтверждение карты', teams:['Payments','Backend'], type:'External', probability:4, impact:5, main:'Провайдер возвращает ошибку', severity:4*5}
  ];

  // persist keys
  const STORAGE_KEY = 'matrix_risks_v1';

  // try load from localStorage
  function loadLocal(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        if(parsed.columns) columns = parsed.columns;
        if(Array.isArray(parsed.risks)) risks = parsed.risks;
      }
    }catch(e){console.warn('local load',e)}
  }
  loadLocal();

  // --- DOM refs ---
  const tableHead = document.getElementById('tableHead');
  const tableBody = document.getElementById('tableBody');
  const searchInput = document.getElementById('searchInput');
  const teamFilter = document.getElementById('teamFilter');
  const typeFilter = document.getElementById('typeFilter');
  const addRiskBtn = document.getElementById('addRiskBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const closeModal = document.getElementById('closeModal');
  const addStepBtn = document.getElementById('addStep');
  const stepsContainer = document.getElementById('stepsContainer');
  const scenarioNameInput = document.getElementById('scenarioName');
  const saveScenarioBtn = document.getElementById('saveScenario');
  const cancelScenarioBtn = document.getElementById('cancelScenario');
  const stepCountLabel = document.getElementById('stepCount');
  const exportBtn = document.getElementById('exportBtn');
  const fileInput = document.getElementById('fileInput');
  const importBtn = document.getElementById('importBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const columnsLabel = document.getElementById('columnsLabel');

  // init UI
  columnsLabel.textContent = columns.join(', ');

  // helper: unique teams/types from risks
  function uniqueValues(field){
    const s = new Set();
    risks.forEach(r=>{
      if(field==='teams'){
        (r.teams||[]).forEach(t=>s.add(t));
      }else{
        if(r[field]) s.add(r[field]);
      }
    });
    return Array.from(s).sort();
  }

  function populateFilters(){
    // teams
    const teams = uniqueValues('teams');
    teamFilter.innerHTML = '<option value="">Все команды</option>' + teams.map(t=>`<option value="${t}">${t}</option>`).join('');
    // types
    const types = uniqueValues('type');
    typeFilter.innerHTML = '<option value="">Все типы</option>' + types.map(t=>`<option value="${t}">${t}</option>`).join('');
  }

  function saveLocal(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify({columns,risks}));
    }catch(e){console.warn('save',e)}
  }

  // render table head based on columns
  function renderHead(){
    tableHead.innerHTML = '';
    const tr = document.createElement('tr');
    columns.forEach(c=>{
      const th = document.createElement('th');
      th.textContent = c;
      tr.appendChild(th);
    });
    // extra hidden columns for editable fields
    const th = document.createElement('th');
    th.textContent = 'Вероятность'; tr.appendChild(th);
    const th2 = document.createElement('th'); th2.textContent = 'Влияние'; tr.appendChild(th2);
    tableHead.appendChild(tr);
  }

  // render rows grouped by scenario
  function renderTable(){
    renderHead();
    populateFilters();
    tableBody.innerHTML = '';

    const q = searchInput.value.trim().toLowerCase();
    const teamSel = teamFilter.value;
    const typeSel = typeFilter.value;

    // group by scenario
    const groups = {};
    risks.forEach((r,i)=>{
      // apply filters
      if(q && !(r.scenario||'').toLowerCase().includes(q)) return;
      if(teamSel && !((r.teams||[]).includes(teamSel))) return;
      if(typeSel && r.type !== typeSel) return;

      if(!groups[r.scenario]) groups[r.scenario]=[];
      groups[r.scenario].push({...r, _idx:i});
    });

    Object.keys(groups).forEach(scenario => {
      const items = groups[scenario];
      // scenario header row
      const trS = document.createElement('tr'); trS.className='scenario-row';
      const tdS = document.createElement('td'); tdS.colSpan = columns.length+2; // span
      tdS.innerHTML = `<strong style="font-size:15px">${scenario}</strong>  <span class="small" style="margin-left:8px;color:var(--muted)">${items.length} шаг(а/ов)</span>`;
      trS.appendChild(tdS);
      tableBody.appendChild(trS);

      // steps rows
      items.forEach(it=>{
        const tr = document.createElement('tr'); tr.className='step-row';
        // columns mapping: Сценарий, Шаг пользователя, Участвующие команды, Критичность, Основной риск
        const tdScenario = document.createElement('td'); tdScenario.textContent = it.scenario; tdScenario.contentEditable = true;
        tdScenario.addEventListener('blur',()=>{ updateField(it._idx,'scenario',tdScenario.textContent.trim()); });

        const tdStep = document.createElement('td'); tdStep.textContent = it.step; tdStep.contentEditable=true;
        tdStep.addEventListener('blur',()=>{ updateField(it._idx,'step',tdStep.textContent.trim()); });

        const tdTeams = document.createElement('td'); tdTeams.textContent = (it.teams||[]).join(', '); tdTeams.contentEditable=true;
        tdTeams.addEventListener('blur',()=>{ const arr = tdTeams.textContent.split(',').map(s=>s.trim()).filter(Boolean); updateField(it._idx,'teams',arr); });

        const tdSeverity = document.createElement('td'); tdSeverity.className='severity'; tdSeverity.textContent = it.severity;

        const tdMain = document.createElement('td'); tdMain.textContent = it.main || it.type || ''; tdMain.contentEditable=true;
        tdMain.addEventListener('blur',()=>{ updateField(it._idx,'main',tdMain.textContent.trim()); });

        tr.appendChild(tdScenario);tr.appendChild(tdStep);tr.appendChild(tdTeams);tr.appendChild(tdSeverity);tr.appendChild(tdMain);

        // probability and impact columns (editable numeric)
        const tdProb = document.createElement('td'); tdProb.contentEditable=true; tdProb.textContent = it.probability||1;
        tdProb.addEventListener('blur',()=>{ const n = clampInt(tdProb.textContent,1,5); updateField(it._idx,'probability',n); tdProb.textContent = n; });

        const tdImp = document.createElement('td'); tdImp.contentEditable=true; tdImp.textContent = it.impact||1;
        tdImp.addEventListener('blur',()=>{ const n = clampInt(tdImp.textContent,1,5); updateField(it._idx,'impact',n); tdImp.textContent = n; });

        tr.appendChild(tdProb); tr.appendChild(tdImp);

        tableBody.appendChild(tr);
      });
    });
  }

  function clampInt(v,min,max){
    const n = parseInt(v,10);
    if(isNaN(n)) return min;
    return Math.max(min,Math.min(max,n));
  }

  function updateField(idx,field,value){
    const r = risks[idx];
    if(!r) return;
    r[field]=value;
    // if probability or impact changed, recalc severity
    if(field==='probability' || field==='impact'){
      r.severity = (r.probability||1) * (r.impact||1);
    }
    saveLocal();
    renderTable();
  }

  // modal logic: add up to 10 steps, each step can contain multiple risks
  function openModal(){
    modalBackdrop.style.display='flex';
    setTimeout(()=> modalBackdrop.querySelector('.modal').classList.add('show'),10);
    refreshSteps();
  }
  function closeModalFn(){
    modalBackdrop.querySelector('.modal').classList.remove('show');
    setTimeout(()=> modalBackdrop.style.display='none',200);
    scenarioNameInput.value=''; stepsContainer.innerHTML=''; stepCountLabel.textContent='0';
  }

  function refreshSteps(){
    const count = stepsContainer.children.length;
    stepCountLabel.textContent = count;
  }

  function createStepBlock(stepIdx, stepData){
    const div = document.createElement('div'); div.className='step';
    const head = document.createElement('div'); head.className='step-head';
    const left = document.createElement('div'); left.innerHTML = `<input class="step-title" placeholder="Название шага" style="padding:8px;border-radius:8px;border:1px solid #e6e9ef;width:280px" value="${stepData?.title||''}" />`;
    const right = document.createElement('div');
    const removeBtn = document.createElement('button'); removeBtn.className='small-btn'; removeBtn.textContent='Удалить шаг';
    removeBtn.addEventListener('click',()=>{ div.remove(); refreshSteps(); });
    right.appendChild(removeBtn);
    head.appendChild(left); head.appendChild(right);

    const risksWrap = document.createElement('div'); risksWrap.style.marginTop='8px';
    // initial risk inside step
    const addRiskBtn = document.createElement('button'); addRiskBtn.className='small-btn'; addRiskBtn.textContent='+ Добавить риск в шаг';
    addRiskBtn.addEventListener('click',()=>{ risksWrap.appendChild(createRiskRow()); });

    div.appendChild(head);
    div.appendChild(risksWrap);
    div.appendChild(addRiskBtn);

    // if stepData.risks provided, populate
    if(stepData && Array.isArray(stepData.risks)){
      stepData.risks.forEach(r=> risksWrap.appendChild(createRiskRow(r)));
    } else {
      risksWrap.appendChild(createRiskRow());
    }

    return div;
  }

  function createRiskRow(data){
    const row = document.createElement('div'); row.style.display='flex'; row.style.gap='8px'; row.style.marginTop='6px'; row.style.alignItems='center';
    row.innerHTML = `
      <input class="r-type" placeholder="Тип риска" style="padding:6px;border-radius:6px;border:1px solid #e6e9ef" value="${data?.type||''}" />
      <input class="r-teams" placeholder="Команды (через запятую)" style="padding:6px;border-radius:6px;border:1px solid #e6e9ef;min-width:160px" value="${(data?.teams||[]).join(', ')||''}" />
      <input class="r-prob" type="number" min="1" max="5" placeholder="Вероятн." style="width:60px;padding:6px;border-radius:6px;border:1px solid #e6e9ef" value="${data?.probability||1}" />
      <input class="r-imp" type="number" min="1" max="5" placeholder="Влияние" style="width:60px;padding:6px;border-radius:6px;border:1px solid #e6e9ef" value="${data?.impact||1}" />
      <input class="r-main" placeholder="Основной риск" style="padding:6px;border-radius:6px;border:1px solid #e6e9ef;min-width:140px" value="${data?.main||''}" />
      <button class="small-btn remove-risk">Удалить</button>
    `;
    row.querySelector('.remove-risk').addEventListener('click',()=>row.remove());
    return row;
  }

  // handlers
  addRiskBtn.addEventListener('click',openModal);
  closeModal.addEventListener('click',closeModalFn);
  cancelScenarioBtn.addEventListener('click',closeModalFn);

  addStepBtn.addEventListener('click',()=>{
    if(stepsContainer.children.length>=10) return alert('Максимум 10 шагов');
    stepsContainer.appendChild(createStepBlock(stepsContainer.children.length));
    refreshSteps();
  });

  saveScenarioBtn.addEventListener('click',()=>{
    const title = scenarioNameInput.value.trim();
    if(!title) return alert('Введите название сценария');
    // iterate steps
    const stepBlocks = Array.from(stepsContainer.children);
    if(stepBlocks.length===0) return alert('Добавьте хотя бы один шаг');
    stepBlocks.forEach(sb=>{
      const stepTitle = sb.querySelector('.step-title').value.trim() || 'Шаг';
      const riskRows = Array.from(sb.querySelectorAll('div > .r-type, div > .r-prob'));
      // better: find each risk row container
      const rr = Array.from(sb.querySelectorAll(':scope > div'))[0];
      const riskContainers = Array.from(sb.querySelectorAll('div')).filter(d=>d.style && d.style.display==='flex');
      riskContainers.forEach(rc=>{
        const type = rc.querySelector('.r-type')?.value.trim() || '';
        const teams = rc.querySelector('.r-teams')?.value.split(',').map(s=>s.trim()).filter(Boolean) || [];
        const prob = clampInt(rc.querySelector('.r-prob')?.value || '1',1,5);
        const imp = clampInt(rc.querySelector('.r-imp')?.value || '1',1,5);
        const main = rc.querySelector('.r-main')?.value.trim() || '';
        // push to risks
        risks.push({scenario:title, step:stepTitle, teams, type, probability:prob, impact:imp, severity:prob*imp, main});
      });
    });
    saveLocal(); renderTable(); closeModalFn();
  });

  // File import/export
  exportBtn.addEventListener('click',()=>{
    // quick export (download)
    const payload = {columns,risks};
    const blob = new Blob([JSON.stringify(payload, null, 2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='risks.json'; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });

  downloadBtn.addEventListener('click',()=>exportBtn.click());

  fileInput.addEventListener('change', (e)=>{
    const f = e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try{
        const parsed = JSON.parse(ev.target.result);
        if(parsed.columns) columns = parsed.columns;
        if(parsed.risks) risks = parsed.risks;
        saveLocal(); renderTable(); columnsLabel.textContent = columns.join(', ');
        alert('Импорт успешно выполнен');
      }catch(err){alert('Ошибка чтения файла: '+err.message)}
    };
    reader.readAsText(f);
    fileInput.value='';
  });

  importBtn.addEventListener('click',()=>fileInput.click());

  // clear
  clearBtn.addEventListener('click',()=>{
    if(!confirm('Очистить все риски и локально сохранённые данные?')) return;
    risks=[]; saveLocal(); renderTable();
  });

  // inline editing handlers: handled per-cell on blur (in renderTable)

  // initial render
  renderTable();

  // filters change
  [searchInput, teamFilter, typeFilter].forEach(el=>el.addEventListener('input',renderTable));

})();
