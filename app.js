// SYSTEM PROMPT
const SYSTEM_INSTRUCTION = `
Actúa como un Gemelo Digital de una Analista Financiera Senior de una multinacional de dispositivos biomédicos en Estados Unidos (US Sales).
Tu foco es la Gerencia Financiera estratégica:
1. Comisiones e incentivos comerciales: Conciliación de Accruals (lo estimado) vs. Actuals (lo pagado realmente).
2. Tono y Personalidad: Profesional, sumamente respetuoso, directo al grano, honesto, orientado a la acción y a decisiones de negocio (criterio de dueño, no confundir volumen con rentabilidad).
3. Habilidades técnicas: Eres experta en Excel masivo (fórmulas avanzadas XLOOKUP, SUMIFS, LET, LAMBDA), Power Query (lenguaje M) para consolidar archivos dispersos y diseño de templates limpios.
4. Restricciones:
   - No inventes fuentes ni uses información externa no verificada.
   - Si se te pide unificar archivos o conciliar datos, propón soluciones estructuradas para Excel o Power Query paso a paso.
   - Entrega los resultados listos para exportar a Word, Excel o PDF cuando se requiera.
`;

function toggleConfig() {
    const box = document.getElementById('apiBox');
    box.style.display = box.style.display === 'none' ? 'flex' : 'none';
}

function saveApiKey() {
    const key = document.getElementById('apiKey').value.trim();
    if (key) {
        localStorage.setItem('gemini_api_key', key);
        alert('API Key guardada con éxito.');
        document.getElementById('apiBox').style.display = 'none'; // Se oculta automáticamente al guardar
    }
}

window.onload = () => {
    // 1. Revisa si el enlace trae la clave oculta al final (#key=...)
    const hash = window.location.hash;
    if (hash && hash.includes('key=')) {
        const keyFromUrl = hash.split('key=')[1];
        if (keyFromUrl) {
            localStorage.setItem('gemini_api_key', keyFromUrl.trim());
            // Borra la clave de la barra de direcciones de inmediato para que nadie la vea
            window.history.replaceState(null, null, window.location.pathname);
        }
    }

    // 2. Cargar la clave si ya estaba guardada
    const savedKey = localStorage.getItem('gemini_api_key');
    const apiBox = document.getElementById('apiBox');
    
    if (savedKey) {
        if (document.getElementById('apiKey')) document.getElementById('apiKey').value = savedKey;
        if (apiBox) apiBox.style.display = 'none'; // Ocultar panel
    }
};

async function sendMessage() {
    const apiKey = localStorage.getItem('gemini_api_key') || document.getElementById('apiKey').value.trim();
    const input = document.getElementById('userInput');
    const chatBox = document.getElementById('chatBox');
    const userText = input.value.trim();

    if (!apiKey) {
        alert('Por favor ingresa tu Gemini API Key.');
        return;
    }
    if (!userText) return;

    // Mostrar mensaje del usuario
    chatBox.innerHTML += `<div class="message user"><strong>Tú:</strong> ${userText}</div>`;
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // Mensaje temporal de espera
    const tempAgentMsg = document.createElement('div');
    tempAgentMsg.className = 'message agent';
    tempAgentMsg.innerText = 'Analizando información financiera...';
    chatBox.appendChild(tempAgentMsg);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // LLAMADA DIRECTA AL MODELO GRATUITO OFICIAL DE GOOGLE: gemini-2.0-flash
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: SYSTEM_INSTRUCTION }]
                },
                contents: [{
                    parts: [{ text: userText }]
                }]
            })
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
            tempAgentMsg.innerHTML = `<strong>Agente Financiero:</strong>\n${data.candidates[0].content.parts[0].text}`;
        } else if (data.error) {
            tempAgentMsg.innerText = 'Error de Google: ' + data.error.message;
        } else {
            tempAgentMsg.innerText = 'No se recibió respuesta válida.';
        }
    } catch (error) {
        tempAgentMsg.innerText = 'Error de conexión: ' + error.message;
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}
