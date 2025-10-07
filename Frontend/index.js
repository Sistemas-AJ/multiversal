 const importBtn = document.getElementById('importBtn');
    const columnsDiv = document.getElementById('columns');
    const dependentSelect = document.getElementById('dependent');
    const independentInput = document.getElementById('independent');
    const modelTypeSelect = document.getElementById('modelType');
    const runModelBtn = document.getElementById('runModelBtn');
    const modelResultDiv = document.getElementById('modelResult');
    const plotXSelect = document.getElementById('plotX');
    const plotYSelect = document.getElementById('plotY');
    const plotBtn = document.getElementById('plotBtn');
    const plotImg = document.getElementById('plotImg');

    let columns = [];
    let isProcessing = false;

    // Función para mostrar loading
    function setLoading(button, isLoading) {
      if (isLoading) {
        button.disabled = true;
        const originalText = button.innerHTML;
        button.setAttribute('data-original', originalText);
        button.innerHTML = '<span class="loading"></span> Procesando...';
      } else {
        button.disabled = false;
        button.innerHTML = button.getAttribute('data-original') || button.innerHTML;
      }
    }

    // Función para mostrar notificaciones
    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
      `;
      
      const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#4a90e2',
        warning: '#ffc107'
      };
      
      notification.style.background = colors[type] || colors.info;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }

    // Agregar estilos para animaciones
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    // Importar archivo
    importBtn.onclick = async () => {
      if (isProcessing) return;
      
      setLoading(importBtn, true);
      isProcessing = true;
      
      try {
        const res = await window.api.importFile();
        if (!res) {
          showNotification('Importación cancelada', 'info');
          return;
        }
        
        columns = res.columns;
        columnsDiv.innerHTML = `<strong>Columnas encontradas:</strong><br>${columns.join(', ')}`;
        columnsDiv.style.display = 'block';
        
        // Actualizar selectores
        const defaultOption = '<option value="">Selecciona una variable...</option>';
        dependentSelect.innerHTML = defaultOption + columns.map(c => `<option value="${c}">${c}</option>`).join('');
        plotXSelect.innerHTML = defaultOption + columns.map(c => `<option value="${c}">${c}</option>`).join('');
        plotYSelect.innerHTML = defaultOption + columns.map(c => `<option value="${c}">${c}</option>`).join('');
        
        showNotification(`✅ Archivo importado exitosamente. ${columns.length} columnas encontradas.`, 'success');
      } catch (error) {
        showNotification('❌ Error al importar el archivo: ' + error.message, 'error');
      } finally {
        setLoading(importBtn, false);
        isProcessing = false;
      }
    };

    // Ejecutar modelo
    runModelBtn.onclick = async () => {
      if (isProcessing) return;
      
      const dep = dependentSelect.value;
      const indepText = independentInput.value.trim();
      
      if (!dep) {
        showNotification('❌ Selecciona una variable dependiente', 'error');
        return;
      }
      
      if (!indepText) {
        showNotification('❌ Ingresa al menos una variable independiente', 'error');
        return;
      }
      
      const indep = indepText.split(',').map(s => s.trim()).filter(Boolean);
      const type = modelTypeSelect.value;
      
      setLoading(runModelBtn, true);
      isProcessing = true;
      
      try {
        const res = await window.api.runModel({ dependent: dep, independent: indep, type });
        let procesoHtml = '';
        if (res.proceso && Array.isArray(res.proceso)) {
          procesoHtml = `<div style='margin-top:18px;'><strong>📝 Proceso del análisis:</strong><ol style='margin-left:20px;'>${res.proceso.map(p => `<li>${p}</li>`).join('')}</ol></div>`;
        }
        if (res.error) {
          modelResultDiv.innerHTML = `<div class="result-container error">
            <strong>❌ Error:</strong> ${res.error}
            ${procesoHtml}
          </div>`;
          showNotification('❌ Error en el análisis', 'error');
        } else {
          modelResultDiv.innerHTML = `<div class="result-container">
            <h3>📊 Resultados del Análisis</h3>
            <p><strong>Puntuación del modelo:</strong> ${(res.score * 100).toFixed(2)}%</p>
            <p><strong>Coeficientes:</strong></p>
            <ul style="margin-left: 20px;">
              ${res.coef.map((coef, i) => `<li>${indep[i] || 'Variable ' + (i+1)}: ${coef.toFixed(4)}</li>`).join('')}
            </ul>
            ${procesoHtml}
          </div>`;
          showNotification('✅ Análisis completado exitosamente', 'success');
        }
        modelResultDiv.style.display = 'block';
      } catch (error) {
        modelResultDiv.innerHTML = `<div class="result-container error">
          <strong>❌ Error:</strong> ${error.message}
        </div>`;
        modelResultDiv.style.display = 'block';
        showNotification('❌ Error al ejecutar el modelo', 'error');
      } finally {
        setLoading(runModelBtn, false);
        isProcessing = false;
      }
    };

    // Generar gráfico
    plotBtn.onclick = async () => {
      if (isProcessing) return;
      
      const x = plotXSelect.value;
      const y = plotYSelect.value;
      
      if (!x || !y) {
        showNotification('❌ Selecciona ambas variables para el gráfico', 'error');
        return;
      }
      
      if (x === y) {
        showNotification('❌ Las variables X e Y deben ser diferentes', 'warning');
        return;
      }
      
      setLoading(plotBtn, true);
      isProcessing = true;
      
      try {
        const res = await window.api.plot({ x, y });
        const chartContainer = document.querySelector('.chart-container');
        // Limpiar gráficos anteriores
        chartContainer.innerHTML = '';
        if (res.html) {
          // Crear un blob con el HTML y mostrarlo en un iframe
          const blob = new Blob([res.html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const iframe = document.createElement('iframe');
          iframe.src = url;
          iframe.width = '100%';
          iframe.height = '500';
          iframe.style.border = 'none';
          iframe.style.borderRadius = '10px';
          iframe.allow = 'fullscreen';
          chartContainer.appendChild(iframe);
          showNotification('✅ Gráfico generado exitosamente', 'success');
        } else if (res.error) {
          showNotification('❌ ' + res.error, 'error');
        } else {
          showNotification('❌ No se pudo generar el gráfico', 'error');
        }
      } catch (error) {
        showNotification('❌ Error al generar el gráfico: ' + error.message, 'error');
      } finally {
        setLoading(plotBtn, false);
        isProcessing = false;
      }
    };

    // Escuchar eventos del menú
    if (window.api.onMenuImportFile) {
      window.api.onMenuImportFile(() => {
        importBtn.click();
      });
    }

    // Validación en tiempo real para variables independientes
    independentInput.addEventListener('input', function() {
      const value = this.value.trim();
      if (value && columns.length > 0) {
        const vars = value.split(',').map(s => s.trim()).filter(Boolean);
        const invalidVars = vars.filter(v => !columns.includes(v));
        
        if (invalidVars.length > 0) {
          this.style.borderColor = '#dc3545';
          this.title = `Variables no encontradas: ${invalidVars.join(', ')}`;
        } else {
          this.style.borderColor = '#28a745';
          this.title = '';
        }
      } else {
        this.style.borderColor = '#e1e5e9';
        this.title = '';
      }
    });
    
    // Verificar estado del servidor al cargar
    async function checkServerStatus() {
      try {
        const result = await window.api.checkServer();
        if (result.status === 'connected') {
          showNotification('✅ Conectado al servidor backend', 'success');
        } else {
          showNotification('⚠️ Servidor backend no disponible. Inicia el servidor Python.', 'warning');
        }
      } catch (error) {
        showNotification('❌ No se pudo verificar el servidor backend', 'error');
      }
    }

    // Función para crear indicador de estado del servidor
    function createServerStatusIndicator() {
      const indicator = document.createElement('div');
      indicator.id = 'server-status';
      indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        padding: 8px 15px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
        background: #dc3545;
        color: white;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `;
      indicator.textContent = '🔴 Servidor desconectado';
      document.body.appendChild(indicator);
      return indicator;
    }

    // Actualizar indicador de estado
    async function updateServerStatus() {
      let indicator = document.getElementById('server-status');
      if (!indicator) {
        indicator = createServerStatusIndicator();
      }

      try {
        const result = await window.api.checkServer();
        if (result.status === 'connected') {
          indicator.style.background = '#28a745';
          indicator.textContent = '🟢 Servidor conectado';
        } else {
          indicator.style.background = '#dc3545';
          indicator.textContent = '🔴 Servidor desconectado';
        }
      } catch (error) {
        indicator.style.background = '#dc3545';
        indicator.textContent = '🔴 Error de conexión';
      }
    }

    // Mensaje de bienvenida y verificación inicial
    document.addEventListener('DOMContentLoaded', async () => {
      showNotification('👋 ¡Bienvenido a Chambeador! Comienza importando tus datos.', 'info');
      
      // Verificar servidor después de un momento
      setTimeout(async () => {
        await updateServerStatus();
        // Verificar cada 30 segundos
        setInterval(updateServerStatus, 30000);
      }, 2000);
    });

    // Atajos de teclado
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'o':
            e.preventDefault();
            importBtn.click();
            break;
          case 'Enter':
            if (e.shiftKey) {
              e.preventDefault();
              runModelBtn.click();
            }
            break;
        }
      }
    });