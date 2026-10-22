let SYSTEM_PROMPT = '';
let apiKey = localStorage.getItem('gemini_api_key') || '';
let history = [];

const chatBox = document.getElementById('chat');
document.getElementById('apiKey').value = apiKey;

// Cargar el system prompt desde /context/system-prompt.md
fetch('context/system-prompt.md')
  .then(r => r.text())
  .then(txt => SYSTEM_PROMPT = txt)
  .catch(() => addMessage('sistema', 'No se pudo cargar system-prompt.md. Verifica la ruta.'));

document.getElementById('saveKey').onclick = () => {
  apiKey = document.getElementById('apiKey').value.trim();
  localStorage.setItem('gemini_api_key', apiKey);
  addMessage('sistema', 'API Key guardada correctamente.');
};

function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = 'message ' + role;
  div.innerText = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

async function callGemini(userText) {
  if (!apiKey) { addMessage('sistema', 'Primero ingresa tu API Key de Gemini.'); return; }

  addMessage('usuario', userText);
  history.push({ role: 'user', parts: [{ text: userText }] });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: history
  };

  const pensando = addMessage('sistema', 'Pensando...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    pensando.remove();
    const respuesta = data.candidates?.[0]?.content?.parts?.[0]?.text
      || 'No se obtuvo respuesta. Revisa tu API Key.';
    addMessage('agente', respuesta);
    history.push({ role: 'model', parts: [{ text: respuesta }] });
  } catch (e) {
    pensando.remove();
    addMessage('sistema', 'Error: ' + e.message);
  }
}

document.getElementById('sendBtn').onclick = () => {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  callGemini(text);
};

/* ---------- CONSOLIDACIÓN DE EXCEL ---------- */
let archivos = [];
document.getElementById('fileInput').onchange = e => archivos = Array.from(e.target.files);

document.getElementById('consolidarBtn').onclick = async () => {
  if (archivos.length === 0) { addMessage('sistema', 'Sube al menos un archivo Excel.'); return; }

  let datos = [];
  for (const file of archivos) {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);
    json.forEach(row => row['__archivo_origen'] = file.name);
    datos = datos.concat(json);
  }

  const hoja = XLSX.utils.json_to_sheet(datos);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Consolidado');
  XLSX.writeFile(libro, 'archivo_consolidado.xlsx');

  addMessage('sistema', `✅ Consolidados ${archivos.length} archivos (${datos.length} filas). Descarga iniciada.`);

  const muestra = JSON.stringify(datos.slice(0, 20));
  callGemini(`Analiza esta muestra (primeras 20 de ${datos.length} filas) de comisiones consolidadas. Dame hallazgos clave, inconsistencias y recomendaciones:\n${muestra}`);
};
