class ChambeadorApp {
  constructor() {
    this.columns = [];
    this.isProcessing = false;
    this.serverStatusInterval = null;
    this.initializeElements();
    this.setupEventListeners();
    this.initializeApp();
  }

  // MODIFICADO: Inicializar referencias a los nuevos elementos del DOM
  initializeElements() {
    this.elements = {
      importBtn: document.getElementById('importBtn'),
      columnsDiv: document.getElementById('columns'),
      dependentSelect: document.getElementById('dependent'),
      availableVarsSelect: document.getElementById('availableVars'),
      addVarBtn: document.getElementById('addVarBtn'),
      clearVarsBtn: document.getElementById('clearVarsBtn'),
      selectedVarsDiv: document.getElementById('selectedVars'),
      modelTypeSelect: document.getElementById('modelType'),
      runModelBtn: document.getElementById('runModelBtn'),
      
      // NUEVO: Elementos para el panel de resultados en la sidebar
      analysisLogContainer: document.getElementById('analysisLogContainer'),
      scoreValue: document.getElementById('scoreValue'),
      coefficientsList: document.getElementById('coefficientsList'),
      metricsList: document.getElementById('metricsList'),
      processList: document.getElementById('processList'),

      plotXSelect: document.getElementById('plotX'),
      plotYSelect: document.getElementById('plotY'),
      plotZSelect: document.getElementById('plotZ'),
      plotBtn: document.getElementById('plotBtn'),
      plot3DBtn: document.getElementById('plot3DBtn'),
      chartContainer: document.querySelector('.chart-container')
    };

    this.selectedIndependentVars = [];
  }

  // Configurar event listeners
  setupEventListeners() {
    this.elements.importBtn.onclick = () => this.handleImport();
    this.elements.runModelBtn.onclick = () => this.handleRunModel();
    this.elements.plotBtn.onclick = () => this.handlePlot2D();
    this.elements.plot3DBtn.onclick = () => this.handlePlot3D();
    this.elements.addVarBtn.onclick = () => this.addIndependentVariable();
    this.elements.clearVarsBtn.onclick = () => this.clearIndependentVariables();

    if (window.api.onMenuImportFile) {
      window.api.onMenuImportFile(() => this.elements.importBtn.click());
    }
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  // Inicializar aplicación
  async initializeApp() {
    this.addCustomStyles();
    this.showNotification('👋 ¡Bienvenido a Multimodel! Comienza importando tus datos.', 'info');
    setTimeout(() => {
      this.updateServerStatus();
      this.serverStatusInterval = setInterval(() => this.updateServerStatus(), 30000);
    }, 2000);
  }

  // Agregar estilos personalizados (sin cambios)
  addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
      .notification { position: fixed; top: 20px; right: 20px; padding: 15px 20px; border-radius: 8px; color: white; font-weight: 500; z-index: 1000; box-shadow: 0 5px 15px rgba(0,0,0,0.2); animation: slideIn 0.3s ease; max-width: 400px; }
      .server-status { position: fixed; bottom: 20px; left: 20px; padding: 8px 15px; border-radius: 20px; font-size: 0.85rem; font-weight: 500; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.2); transition: all 0.3s ease; }
      .server-status.connected { background: #28a745; color: white; }
      .server-status.disconnected { background: #dc3545; color: white; }
    `;
    document.head.appendChild(style);
  }

  // MANEJO DE IMPORTACIÓN (sin cambios)
  async handleImport() {
    if (this.isProcessing) return;
    this.setLoading(this.elements.importBtn, true);
    this.isProcessing = true;
    try {
      const result = await window.api.importFile();
      if (!result) {
        this.showNotification('Importación cancelada', 'info');
        return;
      }
      this.columns = result.columns;
      this.updateColumnsDisplay();
      this.updateSelectors();
      this.showNotification(`✅ Archivo importado. ${this.columns.length} columnas encontradas.`, 'success');
    } catch (error) {
      this.showNotification('❌ Error al importar: ' + error.message, 'error');
    } finally {
      this.setLoading(this.elements.importBtn, false);
      this.isProcessing = false;
    }
  }

  updateColumnsDisplay() {
    this.elements.columnsDiv.innerHTML = `<strong>📋 Columnas:</strong><br>${this.columns.join(', ')}`;
    this.elements.columnsDiv.style.display = 'block';
    this.clearIndependentVariables();
  }

  updateSelectors() {
    const defaultOption = '<option value="">Selecciona una variable...</option>';
    const options = this.columns.map(c => `<option value="${c}">${c}</option>`).join('');
    ['dependentSelect', 'availableVarsSelect', 'plotXSelect', 'plotYSelect', 'plotZSelect'].forEach(id => {
      this.elements[id].innerHTML = defaultOption + options;
    });
  }

  // EJECUCIÓN DE MODELOS
  async handleRunModel() {
    if (this.isProcessing) return;
    const validation = this.validateModelInputs();
    if (!validation.valid) {
      this.showNotification(validation.message, 'error');
      return;
    }
    this.setLoading(this.elements.runModelBtn, true);
    this.isProcessing = true;
    try {
      const params = {
        dependent: this.elements.dependentSelect.value,
        independent: this.parseIndependentVars(),
        type: this.elements.modelTypeSelect.value
      };
      const result = await window.api.runModel(params);
      this.displayModelResults(result); // Esta función está modificada
    } catch (error) {
      this.displayError('Error al ejecutar el modelo: ' + error.message); // Esta también
    } finally {
      this.setLoading(this.elements.runModelBtn, false);
      this.isProcessing = false;
    }
  }

  validateModelInputs() {
    const dep = this.elements.dependentSelect.value;
    if (!dep) return { valid: false, message: '❌ Selecciona una variable dependiente' };
    if (this.selectedIndependentVars.length === 0) return { valid: false, message: '❌ Agrega al menos una variable independiente' };
    if (this.selectedIndependentVars.includes(dep)) return { valid: false, message: '❌ La variable dependiente no puede ser independiente' };
    return { valid: true };
  }

  parseIndependentVars() {
    return [...this.selectedIndependentVars];
  }

  // MODIFICADO: Esta es la función clave que llena el nuevo panel de resultados.
  displayModelResults(result) {
    if (result.error) {
      this.displayError(result.error, result.proceso);
      return;
    }

    // 1. Hacer visible el contenedor de resultados
    this.elements.analysisLogContainer.style.display = 'block';

    // 2. Llenar la Puntuación
    if (result.score) {
      this.elements.scoreValue.textContent = `${(result.score * 100).toFixed(2)}%`;
    }

    // 3. Llenar los Coeficientes o Importancia de Características
    this.elements.coefficientsList.innerHTML = ''; // Limpiar
    const coefficientsData = result.coef ? Object.fromEntries(this.parseIndependentVars().map((v, i) => [v, result.coef[i]])) : result.feature_importance;
    if (coefficientsData) {
        Object.entries(coefficientsData).forEach(([key, value]) => {
            const li = document.createElement('li');
            li.textContent = `${key}: ${value.toFixed(4)}`;
            this.elements.coefficientsList.appendChild(li);
        });
    } else {
        this.elements.coefficientsList.innerHTML = '<li>No disponible para este modelo.</li>';
    }

  // 4. Llenar las Métricas
  this.elements.metricsList.innerHTML = '';
  if (result.metrics && Object.keys(result.metrics).length > 0) {
    Object.entries(result.metrics).forEach(([key, value]) => {
      const li = document.createElement('li');
      li.innerHTML = `${key.toUpperCase()}: <span>${typeof value === 'number' ? value.toFixed(4) : value}</span>`;
      this.elements.metricsList.appendChild(li);
    });
  } else {
    this.elements.metricsList.innerHTML = '<li>No hay métricas detalladas.</li>';
  }
  // Mostrar la fórmula generada automáticamente si hay coeficientes y variable dependiente
  if (result.coef && Array.isArray(result.coef) && typeof result.intercept === 'number') {
    const dep = this.elements.dependentSelect.value || 'Y';
    const indep = this.parseIndependentVars();
    let formula = `${dep} = ${result.intercept.toFixed(4)}`;
    indep.forEach((v, i) => {
      const coef = result.coef[i];
      if (typeof coef === 'number') {
        formula += ` + (${coef.toFixed(4)} * ${v})`;
      }
    });
    const formulaLi = document.createElement('li');
    formulaLi.innerHTML = "<b>Fórmula con tus datos:</b> <span style='font-family:monospace;'>" + formula + "</span>";
    this.elements.metricsList.appendChild(formulaLi);
  }

    // 5. Llenar el Proceso
    this.elements.processList.innerHTML = ''; // Limpiar
    if (result.proceso && Array.isArray(result.proceso)) {
        result.proceso.forEach(step => {
            const li = document.createElement('li');
            li.textContent = step;
            this.elements.processList.appendChild(li);
        });
    }

    this.showNotification('✅ Análisis completado exitosamente', 'success');
  }

  // MODIFICADO: Función para mostrar errores en el nuevo panel.
  displayError(message, proceso = null) {
    // 1. Hacer visible el contenedor
    this.elements.analysisLogContainer.style.display = 'block';

    // 2. Limpiar resultados anteriores y mostrar el error
    this.elements.scoreValue.textContent = 'Error';
    this.elements.coefficientsList.innerHTML = '<li>-</li>';
    this.elements.metricsList.innerHTML = '<li>-</li>';
    
    this.elements.processList.innerHTML = ''; // Limpiar
    const errorLi = document.createElement('li');
    errorLi.innerHTML = `<strong>❌ Error:</strong> ${message}`;
    this.elements.processList.appendChild(errorLi);

    if (proceso && Array.isArray(proceso)) {
        proceso.forEach(step => {
            const li = document.createElement('li');
            li.textContent = step;
            this.elements.processList.appendChild(li);
        });
    }
    
    // Activar la pestaña de "Proceso" para que el error sea visible
    document.querySelector('.tab-btn[data-tab="procesoTabContent"]').click();

    this.showNotification('❌ Error en el análisis', 'error');
  }

  // GRÁFICOS 2D Y 3D (sin cambios)
  async handlePlot2D() {
    if (this.isProcessing) return;
    const validation = this.validatePlotInputs(false);
    if (!validation.valid) {
      this.showNotification(validation.message, 'error');
      return;
    }
    await this.generatePlot({ x: this.elements.plotXSelect.value, y: this.elements.plotYSelect.value }, 'plot', 'Gráfico 2D generado');
  }

  async handlePlot3D() {
    if (this.isProcessing) return;
    const validation = this.validatePlotInputs(true);
    if (!validation.valid) {
      this.showNotification(validation.message, 'error');
      return;
    }
    await this.generatePlot({ x: this.elements.plotXSelect.value, y: this.elements.plotYSelect.value, z: this.elements.plotZSelect.value }, 'plot3d', 'Gráfico 3D generado');
  }

  validatePlotInputs(is3D = false) {
    const x = this.elements.plotXSelect.value;
    const y = this.elements.plotYSelect.value;
    const z = is3D ? this.elements.plotZSelect.value : null;
    if (!x || !y || (is3D && !z)) return { valid: false, message: `❌ Selecciona las variables ${is3D ? 'X, Y y Z' : 'X e Y'}` };
    if ((!is3D && x === y) || (is3D && (x === y || x === z || y === z))) return { valid: false, message: '❌ Las variables deben ser diferentes' };
    return { valid: true };
  }

  async generatePlot(params, apiMethod, successMessage) {
    const button = apiMethod === 'plot' ? this.elements.plotBtn : this.elements.plot3DBtn;
    this.setLoading(button, true);
    this.isProcessing = true;
    try {
      const result = await window.api[apiMethod](params);
      if (result.html) {
        this.displayChart(result.html);
        this.showNotification(`✅ ${successMessage}`, 'success');
      } else {
        this.showNotification('❌ ' + (result.error || 'No se pudo generar el gráfico'), 'error');
      }
    } catch (error) {
      this.showNotification(`❌ Error al generar gráfico: ${error.message}`, 'error');
    } finally {
      this.setLoading(button, false);
      this.isProcessing = false;
    }
  }

  displayChart(htmlContent) {
    this.elements.chartContainer.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = URL.createObjectURL(new Blob([htmlContent], { type: 'text/html' }));
    iframe.width = '100%';
    iframe.height = '500';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '10px';
    this.elements.chartContainer.appendChild(iframe);
  }

  // GESTIÓN DE VARIABLES INDEPENDIENTES (sin cambios)
  addIndependentVariable() {
    const selectedVar = this.elements.availableVarsSelect.value;
    if (!selectedVar) return;
    if (this.selectedIndependentVars.includes(selectedVar)) {
      this.showNotification('⚠️ Variable ya seleccionada', 'warning');
      return;
    }
    if (selectedVar === this.elements.dependentSelect.value) {
      this.showNotification('❌ No puedes agregar la variable dependiente', 'error');
      return;
    }
    this.selectedIndependentVars.push(selectedVar);
    this.updateSelectedVarsDisplay();
    this.elements.availableVarsSelect.value = '';
  }

  removeIndependentVariable(variable) {
    this.selectedIndependentVars = this.selectedIndependentVars.filter(v => v !== variable);
    this.updateSelectedVarsDisplay();
  }

  clearIndependentVariables() {
    this.selectedIndependentVars = [];
    this.updateSelectedVarsDisplay();
  }

  updateSelectedVarsDisplay() {
    const container = this.elements.selectedVarsDiv;
    if (this.selectedIndependentVars.length === 0) {
      container.innerHTML = '<div class="no-vars-message">No hay variables seleccionadas</div>';
      container.classList.remove('has-vars');
    } else {
      container.innerHTML = this.selectedIndependentVars.map(variable => `
        <span class="variable-tag">
          ${variable}
          <button class="remove-btn" onclick="window.chambeadorApp.removeIndependentVariable('${variable}')">×</button>
        </span>
      `).join('');
      container.classList.add('has-vars');
    }
  }

  // UTILIDADES Y ESTADO (sin cambios)
  handleKeyboard(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'o') { e.preventDefault(); this.elements.importBtn.click(); }
      if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); this.elements.runModelBtn.click(); }
    }
  }
  
  async updateServerStatus() {
    let indicator = document.getElementById('server-status');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'server-status';
        document.body.appendChild(indicator);
    }
    try {
      const result = await window.api.checkServer();
      indicator.className = `server-status ${result.status}`;
      indicator.textContent = result.status === 'connected' ? '🟢 Servidor conectado' : '🔴 Servidor desconectado';
    } catch (error) {
      indicator.className = 'server-status disconnected';
      indicator.textContent = '🔴 Error de conexión';
    }
  }

  setLoading(button, isLoading) {
    if (isLoading) {
      button.disabled = true;
      button.setAttribute('data-original', button.innerHTML);
      button.innerHTML = '<span class="loading"></span> Procesando...';
    } else {
      button.disabled = false;
      button.innerHTML = button.getAttribute('data-original');
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    const colors = { success: '#28a745', error: '#dc3545', info: '#4a90e2', warning: '#ffc107' };
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  destroy() {
    if (this.serverStatusInterval) clearInterval(this.serverStatusInterval);
  }
}

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
  window.chambeadorApp = new ChambeadorApp();

  // --- LÓGICA PARA LAS PESTAÑAS ---
  const tabContainer = document.querySelector('.tab-nav');
  if (tabContainer) {
      tabContainer.addEventListener('click', (e) => {
          if (e.target.matches('.tab-btn')) {
              const tabId = e.target.dataset.tab;
              tabContainer.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
              document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
              e.target.classList.add('active');
              document.getElementById(tabId).classList.add('active');
          }
      });
  }
});

window.addEventListener('beforeunload', () => {
  if (window.chambeadorApp) window.chambeadorApp.destroy();
});