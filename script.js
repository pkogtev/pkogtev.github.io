/* ========= script.js =========
 - Load data from data/risks.json (no token)
 - Render table with inline editing for all fields
 - Modal: create scenario (title) -> up to 10 steps -> each step can have many risks
 - Each risk becomes one flat record in risks[] with scenario & step fields
 - Edit existing risk inline or open modal to edit scenario/step/risk (edit single record)
 - Import / Export JSON
================================ */

let risks = [];           // flat array of risk records
let editingRiskId = null; // id when editing single risk via modal (optional)
const MAX_STEPS = 10;

document.addEventListener("DOMContentLoaded", () => {
  // buttons
  document.getElementById("btnAdd").addEventListener("click", () => openScenarioModal());
  document.getElementById("btnExport").addEventListener("click", saveToJSON);
  document.getElementById("btnImport").addEventListener("click", () => document.getElementById("fileInput").click());
  document.getElementById("fileInput").addEventListener("change", handleFileImport);

  // modal add-step button
  document.getElementById("addStepBtn").addEventListener("click", addStepToModal);

  // load initial data
  loadRisks();
});

/* ------------------ LOAD / SAVE ------------------ */

async function loadRisks(){
  try{
    const res = await fetch("data/risks.json?" + Date.now());
    if(!res.ok) throw new Error("Ошибка загрузки файла");
    const data = await res.json();
    // ensure each item has id
    risks = data.map((it, idx) => {
      if (it.id === undefined || it.id === null) it.id = Date.now() + idx;
      // normalize fields to strings/numbers
      return {
        id: it.id,
        scenario: it.scenario || it.Сценарий || it['Сценарий'] || (it.scenario || ""),
        step: it.step || it.stepUser || it['Шаг пользователя'] || it.step || "",
        teams: it.teams || it['Участвующие команды'] || it.teams || "",
        mainRisk: it.mainRisk || it['Основной риск'] || it.mainRisk || "",
        r: it.r || "",
        a: it.a || "",
        probability: (isFiniteNumber(it.probability) ? Number(it.probability) : ""),
        impact: (isFiniteNumber(it.impact) ? Number(it.impact) : ""),
        severityLabel: it.severity || it['Критичность'] || ""
      };
    });
    renderTable();
  }catch(e){
    console.error("Ошибка загрузки:", e);
    risks = [];
    renderTable();
  }
}

function isFiniteNumber(v){ return v !== "" && v !== null && v !== undefined && !Number.isNaN(Number(v)); }

function saveToJSON(){
  const blob = new Blob([JSON.stringify(risks, null, 2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "risks.json";
  a.click();
}

/* File import */
function handleFileImport(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result);
      if(Array.isArray(parsed)){
        risks = parsed.map((it, idx) => ({ id: it.id || Date.now()+idx, ...it }));
        renderTable();
      } else {
        alert("JSON должен быть массивом объектов");
      }
    }catch(err){
      alert("Не удалось прочитать JSON: " + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

/* ------------------ RENDER TABLE ------------------ */

function renderTable(){
  const tbody = document.getElementById("risksTableBody");
  if(!tbody) return console.error("risksTableBody not found");
  tbody.innerHTML = "";

  risks.forEach(risk => {
    const severity = (isFiniteNumber(risk.probability) && isFiniteNumber(risk.impact)) ? (Number(risk.probability) * Number(risk.impact)) : "";
    const sevClass = severity === "" ? "" : (severity <=5 ? "sev-low" : severity <=10 ? "sev-med" : severity <=15 ? "sev-high" : "sev-crit");

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><input type="checkbox" class="row-check" data-id="${risk.id}"></td>

      <td class="editable" data-field="scenario" data-id="${risk.id}">${escapeHtml(risk.scenario || "")}</td>
      <td class="editable" data-field="step" data-id="${risk.id}">${escapeHtml(risk.step || "")}</td>
      <td class="editable" data-field="teams" data-id="${risk.id}">${escapeHtml(risk.teams || "")}</td>
      <td class="editable" data-field="mainRisk" data-id="${risk.id}">${escapeHtml(risk.mainRisk || "")}</td>
      <td class="editable" data-field="r" data-id="${risk.id}">${escapeHtml(risk.r || "")}</td>
      <td class="editable" data-field="a" data-id="${risk.id}">${escapeHtml(risk.a || "")}</td>
      <td class="editable" data-field="probability" data-id="${risk.id}">${risk.probability !== "" ? risk.probability : ""}</td>
      <td class="editable" data-field="impact" data-id="${risk.id}">${risk.impact !== "" ? risk.impact : ""}</td>
      <td><span class="severity-badge ${sevClass}">${risk.severityLabel || severity}</span></td>
      <td>
        <div class="actions" role="group" aria-label="actions">
          <button class="action-btn" title="Редактировать" onclick="openEditRisk(${risk.id})">✏</button>
          <button class="action-btn" title="Удалить" onclick="deleteRisk(${risk.id})">🗑</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // attach inline editing listeners
  tbody.querySelectorAll(".editable").forEach(td=>{
    td.addEventListener("click", (e)=> beginInlineEdit(e, td));
  });
}

/* escape HTML to avoid accidental markup injection */
function escapeHtml(s){
  return (s===null || s===undefined) ? "" : String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

/* ------------------ INLINE EDIT ------------------ */

function beginInlineEdit(event, td){
  const id = td.dataset.id;
  const field = td.dataset.field;
  const risk = risks.find(r=> String(r.id) === String(id));
  if(!risk) return;
  // prevent multiple inputs
  if (td.querySelector("input") || td.querySelector("textarea")) return;

  const value = (risk[field] === null || risk[field] === undefined) ? "" : String(risk[field]);

  // number fields: probability/impact
  if(field === "probability" || field === "impact"){
    const input = document.createElement("input");
    input.type = "number"; input.min = 1; input.max = 5; input.value = value;
    input.className = "editable-input";
    td.innerHTML = ""; td.appendChild(input); input.focus();
    input.addEventListener("blur", ()=>{
      const v = input.value === "" ? "" : Number(input.value);
      risk[field] = v;
      updateSeverityLabel(risk);
      renderTable();
    });
    input.addEventListener("keydown",(ev)=>{ if(ev.key==="Enter") input.blur(); });
    return;
  }

  // multiline or text
  const input = document.createElement("input");
  input.type = "text";
  input.className = "editable-input";
  input.value = value;
  td.innerHTML = ""; td.appendChild(input); input.focus();
  input.addEventListener("blur", ()=>{
    risk[field] = input.value.trim();
    renderTable();
  });
  input.addEventListener("keydown",(ev)=>{ if(ev.key==="Enter") input.blur(); });
}

/* recompute severityLabel if needed */
function updateSeverityLabel(risk){
  if(isFiniteNumber(risk.probability) && isFiniteNumber(risk.impact)){
    const sev = Number(risk.probability) * Number(risk.impact);
    // keep severityLabel empty (we show numeric) unless user provided explicit label
    // if previously had a label like "🔴 Высокая" keep it separate
    // we don't overwrite severityLabel here.
  }
}

/* ------------------ MODAL: scenario -> steps -> risks ------------------ */

let modalMode = "create"; // or "editSingle"
let modalEditingRiskId = null;

function openScenarioModal(existingScenario = null){
  modalMode = "create"; modalEditingRiskId = null;
  document.getElementById("modalTitle").innerText = existingScenario ? "Редактировать сценарий" : "Добавить сценарий";
  document.getElementById("scenarioName").value = existingScenario ? existingScenario : "";
  const stepsContainer = document.getElementById("stepsContainer");
  stepsContainer.innerHTML = "";
  // add one empty step by default
  addStepToModal();
  showModal();
}

function openEditRisk(riskId){
  // open modal in editSingle mode: show scenario name and one step populated with this risk
  modalMode = "editSingle"; modalEditingRiskId = riskId;
  const risk = risks.find(r=> r.id === riskId);
  if(!risk) return alert("Запись не найдена");
  document.getElementById("modalTitle").innerText = "Редактировать риск";
  document.getElementById("scenarioName").value = risk.scenario || "";
  const stepsContainer = document.getElementById("stepsContainer");
  stepsContainer.innerHTML = "";

  // create one step with the risk prefilled
  const stepDiv = createStepElement();
  stepDiv.querySelector(".step-name").value = risk.step || "";
  // add one risk item
  const riskItem = createRiskItemElement();
  riskItem.querySelector(".risk-teams").value = risk.teams || "";
  riskItem.querySelector(".risk-main").value = risk.mainRisk || "";
  riskItem.querySelector(".risk-r").value = risk.r || "";
  riskItem.querySelector(".risk-a").value = risk.a || "";
  riskItem.querySelector(".risk-probability").value = risk.probability || "";
  riskItem.querySelector(".risk-impact").value = risk.impact || "";
  stepDiv.querySelector(".risks-list").appendChild(riskItem);

  stepsContainer.appendChild(stepDiv);
  showModal();
}

function showModal(){ document.getElementById("modalOverlay").classList.add("active"); }
function closeModal(){ document.getElementById("modalOverlay").classList.remove("active"); modalMode="create"; modalEditingRiskId=null; }

function closeModalOnOverlay(e){ if(e.target.id === "modalOverlay") closeModal(); }

function addStepToModal(){
  const container = document.getElementById("stepsContainer");
  const stepCount = container.querySelectorAll(".step-card").length;
  if(stepCount >= MAX_STEPS) return alert("Максимум " + MAX_STEPS + " шагов");
  const stepEl = createStepElement();
  container.appendChild(stepEl);
}

/* helper: create step element */
function createStepElement(){
  const wrapper = document.createElement("div");
  wrapper.className = "step-card";

  wrapper.innerHTML = `
    <div class="step-header">
      <strong>Шаг</strong>
      <div>
        <button type="button" class="small-btn" onclick="this.closest('.step-card').remove()">Удалить шаг</button>
      </div>
    </div>

    <div class="form-group">
      <label>Название шага</label>
      <input type="text" class="step-name" placeholder="Например: Ввод данных">
    </div>

    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong>Риски</strong>
        <button type="button" class="small-btn add-risk-btn">+ Добавить риск</button>
      </div>
      <div class="risks-list"></div>
    </div>
  `;

  // wire add-risk button
  const addBtn = wrapper.querySelector(".add-risk-btn");
  addBtn.addEventListener("click", () => {
    const list = wrapper.querySelector(".risks-list");
    const item = createRiskItemElement();
    list.appendChild(item);
  });

  // by default add one risk-item
  wrapper.querySelector(".risks-list").appendChild(createRiskItemElement());

  return wrapper;
}

/* helper: create risk item element */
function createRiskItemElement(){
  const div = document.createElement("div");
  div.className = "risk-item";
  div.style.marginBottom = "10px";
  div.innerHTML = `
    <div style="display:flex;gap:10px;align-items:flex-start">
      <div style="flex:1">
        <div class="form-group">
          <label>Участвующие команды</label>
          <input type="text" class="risk-teams" placeholder="Backend, Frontend">
        </div>
        <div class="form-group">
          <label>Основной риск</label>
          <input type="text" class="risk-main" placeholder="Описание риска">
        </div>
      </div>

      <div style="width:220px">
        <div class="form-group">
          <label>R</label>
          <input type="text" class="risk-r" placeholder="R">
        </div>
        <div class="form-group">
          <label>A</label>
          <input type="text" class="risk-a" placeholder="A">
        </div>
        <div class="form-row" style="display:flex;gap:8px">
          <div style="flex:1">
            <label>Вероятность</label>
            <input type="number" min="1" max="5" class="risk-probability" placeholder="1-5">
          </div>
          <div style="flex:1">
            <label>Влияние</label>
            <input type="number" min="1" max="5" class="risk-impact" placeholder="1-5">
          </div>
        </div>
      </div>
    </div>

    <div style="text-align:right;margin-top:8px">
      <button type="button" class="small-btn" onclick="this.closest('.risk-item').remove()">Удалить риск</button>
    </div>
    <hr style="border:none;border-top:1px dashed var(--line);margin:10px 0 0 0">
  `;
  return div;
}

/* ---------------- submit scenario (create many risk records) -------------- */

function submitScenario(e){
  e.preventDefault();
  const scenarioName = document.getElementById("scenarioName").value.trim();
  if(!scenarioName) return alert("Введите название сценария");

  const steps = Array.from(document.querySelectorAll(".step-card"));

  // collect newRecords
  const newRecords = [];

  steps.forEach(stepEl => {
    const stepName = stepEl.querySelector(".step-name").value.trim();
    const risksList = Array.from(stepEl.querySelectorAll(".risk-item"));

    risksList.forEach(rEl => {
      const teams = rEl.querySelector(".risk-teams").value.trim();
      const mainRisk = rEl.querySelector(".risk-main").value.trim();
      const r = rEl.querySelector(".risk-r").value.trim();
      const a = rEl.querySelector(".risk-a").value.trim();
      const probability = rEl.querySelector(".risk-probability").value;
      const impact = rEl.querySelector(".risk-impact").value;

      // skip empty
      if(!stepName && !teams && !mainRisk) return;

      newRecords.push({
        id: Date.now() + Math.floor(Math.random()*10000),
        scenario: scenarioName,
        step: stepName,
        teams,
        mainRisk,
        r,
        a,
        probability: probability === "" ? "" : Number(probability),
        impact: impact === "" ? "" : Number(impact),
        severityLabel: ""  // optional label (user can later edit)
      });
    });
  });

  if(modalMode === "create"){
    // append new records
    risks = risks.concat(newRecords);
  } else if(modalMode === "editSingle" && modalEditingRiskId){
    // replace single risk by first newRecords[0] (we used modal to edit one risk)
    if(newRecords.length === 0) {
      alert("Нельзя сохранить пустой риск");
      return;
    }
    const idx = risks.findIndex(r=> r.id === modalEditingRiskId);
    if(idx !== -1){
      // replace fields of existing record
      const nr = newRecords[0];
      risks[idx] = { ...risks[idx], ...nr, id: risks[idx].id };
    } else {
      // fallback append
      risks.push(newRecords[0]);
    }
  }

  renderTable();
  closeModal();
}

/* ---------------- delete ------------------ */

function deleteRisk(id){
  if(!confirm("Удалить этот риск?")) return;
  risks = risks.filter(r => r.id !== id);
  renderTable();
}

/* ---------------- delete selected ------------------ */

function deleteSelected(){
  const checked = Array.from(document.querySelectorAll(".row-check:checked")).map(cb=>cb.dataset.id);
  if(!checked.length) return alert("Не выбрано ни одной записи");
  if(!confirm(`Удалить выбранные (${checked.length})?`)) return;
  risks = risks.filter(r => !checked.includes(String(r.id)));
  renderTable();
}

/* ---------------- toggle select all ------------------ */

function toggleSelectAll(source){
  const checked = source.checked;
  document.querySelectorAll(".row-check").forEach(cb=> cb.checked = checked);
}

/* ================= utility ================== */

(function attachGlobalHelpers(){
  window.openScenarioModal = openScenarioModal;
  window.openEditRisk = openEditRisk;
  window.deleteRisk = deleteRisk;
  window.deleteSelected = deleteSelected;
  window.toggleSelectAll = toggleSelectAll;
  window.submitScenario = submitScenario;
  window.closeModal = closeModal;
  window.closeModalOnOverlay = closeModalOnOverlay;
  window.saveToJSON = saveToJSON;
})();

