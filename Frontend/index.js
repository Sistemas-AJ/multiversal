class ChambeadorApp {
  constructor() {
    this.columns = [];
    this.isProcessing = false;
    this.serverStatusInterval = null;
    this.initializeElements();
    this.setupEventListeners();
    this.initializeApp();
  }

  // Inicializar referencias a elementos DOM
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
      modelResultDiv: document.getElementById('modelResult'),
      plotXSelect: document.getElementById('plotX'),
      plotYSelect: document.getElementById('plotY'),
      plotZSelect: document.getElementById('plotZ'),
      plotBtn: document.getElementById('plotBtn'),
      plot3DBtn: document.getElementById('plot3DBtn'),
      chartContainer: document.querySelector('.chart-container')
    };

    // Estado de variables seleccionadas
    this.selectedIndependentVars = [];
  }

  // Configurar event listeners
  setupEventListeners() {
    // Botones principales
    this.elements.importBtn.onclick = () => this.handleImport();
    this.elements.runModelBtn.onclick = () => this.handleRunModel();
    this.elements.plotBtn.onclick = () => this.handlePlot2D();
    this.elements.plot3DBtn.onclick = () => this.handlePlot3D();

    // Controles de variables independientes
    this.elements.addVarBtn.onclick = () => this.addIndependentVariable();
    this.elements.clearVarsBtn.onclick = () => this.clearIndependentVariables();

    // Eventos del menú
    if (window.api.onMenuImportFile) {
      window.api.onMenuImportFile(() => this.elements.importBtn.click());
    }

    // Atajos de teclado
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  // Inicializar aplicación
  async initializeApp() {
    this.addCustomStyles();
    this.showNotification('👋 ¡Bienvenido a Chambeador! Comienza importando tus datos.', 'info');

    // Verificar estado del servidor
    setTimeout(() => {
      this.updateServerStatus();
      this.serverStatusInterval = setInterval(() => this.updateServerStatus(), 30000);
    }, 2000);
  }

  // Agregar estilos personalizados
  addCustomStyles() {
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
      .notification {
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
        max-width: 400px;
      }
      .server-status {
        position: fixed;
        bottom: 20px;
        left: 20px;
        padding: 8px 15px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
      }
      .server-status.connected {
        background: #28a745;
        color: white;
      }
      .server-status.disconnected {
        background: #dc3545;
        color: white;
      }
      .input-error {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
      }
      .input-success {
        border-color: #28a745 !important;
        box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1) !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ==========================================
  // MANEJO DE IMPORTACIÓN
  // ==========================================

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
      this.showNotification(`✅ Archivo importado exitosamente. ${this.columns.length} columnas encontradas.`, 'success');

    } catch (error) {
      this.showNotification('❌ Error al importar el archivo: ' + error.message, 'error');
    } finally {
      this.setLoading(this.elements.importBtn, false);
      this.isProcessing = false;
    }
  }

  updateColumnsDisplay() {
    this.elements.columnsDiv.innerHTML = `<strong>📋 Columnas encontradas:</strong><br>${this.columns.join(', ')}`;
    this.elements.columnsDiv.style.display = 'block';

    // Resetear variables seleccionadas al importar nuevo archivo
    this.clearIndependentVariables();
  }

  updateSelectors() {
    const defaultOption = '<option value="">Selecciona una variable...</option>';
    const options = this.columns.map(c => `<option value="${c}">${c}</option>`).join('');

    this.elements.dependentSelect.innerHTML = defaultOption + options;
    this.elements.availableVarsSelect.innerHTML = defaultOption + options;
    this.elements.plotXSelect.innerHTML = defaultOption + options;
    this.elements.plotYSelect.innerHTML = defaultOption + options;
    this.elements.plotZSelect.innerHTML = defaultOption + options;
  }

  // ==========================================
  // EJECUCIÓN DE MODELOS
  // ==========================================

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
      this.displayModelResults(result);

    } catch (error) {
      this.displayError('Error al ejecutar el modelo: ' + error.message);
    } finally {
      this.setLoading(this.elements.runModelBtn, false);
      this.isProcessing = false;
    }
  }

  validateModelInputs() {
    const dep = this.elements.dependentSelect.value;

    if (!dep) {
      return { valid: false, message: '❌ Selecciona una variable dependiente' };
    }

    if (this.selectedIndependentVars.length === 0) {
      return { valid: false, message: '❌ Agrega al menos una variable independiente' };
    }

    // Verificar que la variable dependiente no esté en las independientes
    if (this.selectedIndependentVars.includes(dep)) {
      return { valid: false, message: '❌ La variable dependiente no puede estar en las variables independientes' };
    }

    return { valid: true };
  }

  parseIndependentVars() {
    return [...this.selectedIndependentVars];
  }

  displayModelResults(result) {
    if (result.error) {
      this.displayError(result.error, result.proceso);
      return;
    }

    const procesoHtml = this.generateProcessHtml(result.proceso);
    const metricsHtml = this.generateMetricsHtml(result);

    this.elements.modelResultDiv.innerHTML = `
      <div class="result-container">
        <h3>📊 Resultados del Análisis</h3>
        <p><strong>🎯 Puntuación del modelo:</strong> ${(result.score * 100).toFixed(2)}%</p>
        ${result.coef ? this.generateCoefficientsHtml(result.coef) : ''}
        ${result.feature_importance ? this.generateFeatureImportanceHtml(result.feature_importance) : ''}
        ${metricsHtml}
        ${procesoHtml}
      </div>
    `;

    this.elements.modelResultDiv.style.display = 'block';
    this.showNotification('✅ Análisis completado exitosamente', 'success');
  }

  generateCoefficientsHtml(coef) {
    const indep = this.parseIndependentVars();
    return `
      <div style="margin-top: 15px;">
        <strong>📈 Coeficientes:</strong>
        <ul style="margin-left: 20px; margin-top: 8px;">
          ${coef.map((c, i) => `<li><strong>${indep[i] || 'Variable ' + (i+1)}:</strong> ${c.toFixed(4)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  generateFeatureImportanceHtml(featureImportance) {
    const sortedFeatures = Object.entries(featureImportance)
      .sort((a, b) => b[1] - a[1]);

    return `
      <div style="margin-top: 15px;">
        <strong>🌟 Importancia de Características:</strong>
        <ul style="margin-left: 20px; margin-top: 8px;">
          ${sortedFeatures.map(([feat, imp]) => `<li><strong>${feat}:</strong> ${(imp * 100).toFixed(2)}%</li>`).join('')}
        </ul>
      </div>
    `;
  }

  generateMetricsHtml(result) {
    if (!result.metrics) return '';

    return `
      <div style="margin-top: 15px;">
        <strong>📊 Métricas Detalladas:</strong>
        <div class="metrics-grid" style="margin-top: 10px;">
          ${Object.entries(result.metrics).map(([key, value]) => `
            <div class="metric-item">
              <div style="font-size: 0.9rem; color: #666; margin-bottom: 4px; font-weight: 500;">${key.toUpperCase()}</div>
              <div class="metric-value" style="font-size: 1.1rem; font-weight: bold; color: #28a745;">
                ${typeof value === 'number' ? value.toFixed(4) : value}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  generateProcessHtml(proceso) {
    if (!proceso || !Array.isArray(proceso)) return '';

    return `
      <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e9ecef;">
        <strong>📝 Proceso del Análisis:</strong>
        <ol style="margin-left: 20px; margin-top: 8px;">
          ${proceso.map(step => `<li style="margin-bottom: 5px;">${step}</li>`).join('')}
        </ol>
      </div>
    `;
  }

  displayError(message, proceso = null) {
    const procesoHtml = proceso ? this.generateProcessHtml(proceso) : '';
    this.elements.modelResultDiv.innerHTML = `
      <div class="result-container error">
        <strong>❌ Error:</strong> ${message}
        ${procesoHtml}
      </div>
    `;
    this.elements.modelResultDiv.style.display = 'block';
    this.showNotification('❌ Error en el análisis', 'error');
  }

  // ==========================================
  // GRÁFICOS 2D Y 3D
  // ==========================================

  async handlePlot2D() {
    if (this.isProcessing) return;

    const validation = this.validatePlotInputs(false);
    if (!validation.valid) {
      this.showNotification(validation.message, 'error');
      return;
    }

    await this.generatePlot({
      x: this.elements.plotXSelect.value,
      y: this.elements.plotYSelect.value
    }, 'plot', 'Gráfico generado exitosamente');
  }

  async handlePlot3D() {
    if (this.isProcessing) return;

    const validation = this.validatePlotInputs(true);
    if (!validation.valid) {
      this.showNotification(validation.message, 'error');
      return;
    }

    await this.generatePlot({
      x: this.elements.plotXSelect.value,
      y: this.elements.plotYSelect.value,
      z: this.elements.plotZSelect.value
    }, 'plot3d', 'Gráfico 3D generado exitosamente');
  }

  validatePlotInputs(is3D = false) {
    const x = this.elements.plotXSelect.value;
    const y = this.elements.plotYSelect.value;
    const z = this.elements.plotZSelect.value;

    if (!x || !y || (is3D && !z)) {
      const vars = is3D ? 'X, Y y Z' : 'X e Y';
      return { valid: false, message: `❌ Selecciona las variables ${vars} para el gráfico` };
    }

    if (is3D && (x === y || x === z || y === z)) {
      return { valid: false, message: '❌ Las variables X, Y y Z deben ser diferentes' };
    } else if (!is3D && x === y) {
      return { valid: false, message: '❌ Las variables X e Y deben ser diferentes' };
    }

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
      } else if (result.error) {
        this.showNotification('❌ ' + result.error, 'error');
      } else {
        this.showNotification('❌ No se pudo generar el gráfico', 'error');
      }
    } catch (error) {
      this.showNotification(`❌ Error al generar el gráfico: ${error.message}`, 'error');
    } finally {
      this.setLoading(button, false);
      this.isProcessing = false;
    }
  }

  displayChart(htmlContent) {
    // Limpiar gráficos anteriores
    this.elements.chartContainer.innerHTML = '';

    // Crear iframe con el contenido del gráfico
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');

    iframe.src = url;
    iframe.width = '100%';
    iframe.height = '500';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '10px';
    iframe.allow = 'fullscreen';

    this.elements.chartContainer.appendChild(iframe);
  }


  
  // Alixter vasquez


  // ==========================================
  // GESTIÓN DE VARIABLES INDEPENDIENTES
  // ==========================================

  addIndependentVariable() {
    const selectedVar = this.elements.availableVarsSelect.value;

    if (!selectedVar) {
      this.showNotification('❌ Selecciona una variable para agregar', 'warning');
      return;
    }

    if (this.selectedIndependentVars.includes(selectedVar)) {
      this.showNotification('⚠️ Esta variable ya está seleccionada', 'warning');
      return;
    }

    // Verificar que no sea la variable dependiente
    const dependentVar = this.elements.dependentSelect.value;
    if (selectedVar === dependentVar) {
      this.showNotification('❌ No puedes agregar la variable dependiente como independiente', 'error');
      return;
    }

    this.selectedIndependentVars.push(selectedVar);
    this.updateSelectedVarsDisplay();
    this.elements.availableVarsSelect.value = ''; // Resetear selección

    this.showNotification(`✅ Variable "${selectedVar}" agregada`, 'success');
  }

  removeIndependentVariable(variable) {
    this.selectedIndependentVars = this.selectedIndependentVars.filter(v => v !== variable);
    this.updateSelectedVarsDisplay();
    this.showNotification(`🗑️ Variable "${variable}" removida`, 'info');
  }

  clearIndependentVariables() {
    this.selectedIndependentVars = [];
    this.updateSelectedVarsDisplay();
    if (this.selectedIndependentVars.length > 0) {
      this.showNotification('🗑️ Todas las variables independientes han sido removidas', 'info');
    }
  }

  updateSelectedVarsDisplay() {
    const container = this.elements.selectedVarsDiv;

    if (this.selectedIndependentVars.length === 0) {
      container.innerHTML = '<div class="no-vars-message">No hay variables seleccionadas</div>';
      container.classList.remove('has-vars');
    } else {
      const tagsHtml = this.selectedIndependentVars.map(variable => `
        <span class="variable-tag">
          ${variable}
          <button class="remove-btn" onclick="window.chambeadorApp.removeIndependentVariable('${variable}')" title="Remover variable">
            ×
          </button>
        </span>
      `).join('');

      container.innerHTML = tagsHtml;
      container.classList.add('has-vars');
    }
  }

  handleKeyboard(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'o':
          e.preventDefault();
          this.elements.importBtn.click();
          break;
        case 'Enter':
          if (e.shiftKey) {
            e.preventDefault();
            this.elements.runModelBtn.click();
          }
          break;
      }
    }
  }

  // ==========================================
  // ESTADO DEL SERVIDOR
  // ==========================================

  async updateServerStatus() {
    let indicator = document.getElementById('server-status');
    if (!indicator) {
      indicator = this.createServerStatusIndicator();
    }

    try {
      const result = await window.api.checkServer();
      if (result.status === 'connected') {
        indicator.className = 'server-status connected';
        indicator.textContent = '🟢 Servidor conectado';
      } else {
        indicator.className = 'server-status disconnected';
        indicator.textContent = '🔴 Servidor desconectado';
      }
    } catch (error) {
      indicator.className = 'server-status disconnected';
      indicator.textContent = '🔴 Error de conexión';
    }
  }

  createServerStatusIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'server-status';
    indicator.className = 'server-status disconnected';
    document.body.appendChild(indicator);
    return indicator;
  }

  // ==========================================
  // UTILIDADES DE UI
  // ==========================================

  setLoading(button, isLoading) {
    if (isLoading) {
      button.disabled = true;
      const originalText = button.getAttribute('data-original') || button.innerHTML;
      button.setAttribute('data-original', originalText);
      button.innerHTML = '<span class="loading"></span> Procesando...';
    } else {
      button.disabled = false;
      button.innerHTML = button.getAttribute('data-original');
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';

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

  // Destructor para limpiar intervalos
  destroy() {
    if (this.serverStatusInterval) {
      clearInterval(this.serverStatusInterval);
    }
  }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

// Crear instancia de la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.chambeadorApp = new ChambeadorApp();
});

// Limpiar recursos al cerrar la ventana
window.addEventListener('beforeunload', () => {
  if (window.chambeadorApp) {
    window.chambeadorApp.destroy();
  }
});