import sys
from flask import Flask, request, jsonify
import pandas as pd
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
import matplotlib.pyplot as plt
import plotly.express as px
import io
import base64

app = Flask(__name__)
df = None

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Servidor backend funcionando correctamente',
        'version': '1.0.0'
    })

@app.route('/import', methods=['POST'])
def import_data():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
        
        ext = file.filename.split('.')[-1].lower()
        global df
        
        if ext == 'csv':
            df = pd.read_csv(file)
            print(f"✅ Archivo CSV importado: {file.filename} ({len(df)} filas, {len(df.columns)} columnas)")
        elif ext in ['xls', 'xlsx']:
            df = pd.read_excel(file)
            print(f"✅ Archivo Excel importado: {file.filename} ({len(df)} filas, {len(df.columns)} columnas)")
        else:
            return jsonify({'error': f'Formato no soportado: {ext}. Use CSV, XLS o XLSX'}), 400
        
        columns = df.columns.tolist()
        print(f"📊 Columnas encontradas: {', '.join(columns)}")
        return jsonify({'columns': columns})
        
    except Exception as e:
        print(f"❌ Error al importar archivo: {str(e)}")
        return jsonify({'error': f'Error al procesar el archivo: {str(e)}'}), 500

@app.route('/model', methods=['POST'])
def run_model():
    try:
        if df is None:
            return jsonify({'error': 'Primero debe importar un archivo de datos'}), 400
        data = request.json
        dep = data['dependent']
        indep = data['independent']
        model_type = data['type']
        proceso = []
        proceso.append(f"Archivo cargado con {len(df)} filas y {len(df.columns)} columnas.")
        proceso.append(f"Modelo seleccionado: {model_type}")
        proceso.append(f"Variable dependiente: {dep}")
        proceso.append(f"Variables independientes: {', '.join(indep)}")
        # Verificar columnas
        missing_cols = [col for col in [dep] + indep if col not in df.columns]
        if missing_cols:
            proceso.append(f"❌ Columnas no encontradas: {', '.join(missing_cols)}")
            return jsonify({'error': f'Columnas no encontradas: {', '.join(missing_cols)}', 'proceso': proceso}), 400
        X = df[indep]
        y = df[dep]
        # Validar datos numéricos y nulos
        if X.isnull().any().any() or y.isnull().any():
            proceso.append("❌ Hay valores nulos en los datos. Por favor, limpia los datos antes de analizar.")
            return jsonify({'error': 'Hay valores nulos en los datos.', 'proceso': proceso}), 400
        if not all([pd.api.types.is_numeric_dtype(X[c]) for c in X.columns]) or not pd.api.types.is_numeric_dtype(y):
            proceso.append("❌ Las variables deben ser numéricas para el análisis.")
            return jsonify({'error': 'Las variables deben ser numéricas.', 'proceso': proceso}), 400
        # Proceso de análisis
        if model_type == 'regresion_multiple':
            model = LinearRegression().fit(X, y)
            score = model.score(X, y)
            coef = model.coef_.tolist()
            intercept = model.intercept_
            # Fórmula general
            formula = f"Y = {intercept:.4f} + " + " + ".join([f"({c:.4f} * {name})" for c, name in zip(coef, X.columns)])
            proceso.append("\n<b>Fórmula de la regresión múltiple:</b>")
            proceso.append(f"<span style='font-family:monospace;'>Y = b₀ + b₁X₁ + ... + bₙXₙ</span>")
            proceso.append(f"Donde:<br>Y = variable dependiente<br>X₁, X₂, ... = variables independientes<br>b₀ = intercepto<br>b₁, b₂, ... = coeficientes")
            proceso.append(f"<b>Fórmula con tus datos:</b> <span style='font-family:monospace;'>{formula}</span>")
            proceso.append(f"<b>Interpretación:</b> Por cada unidad que aumenta una variable independiente, Y cambia en su coeficiente respectivo, manteniendo las demás constantes.")
            proceso.append(f"✅ Regresión múltiple ejecutada. Score: {score:.4f}")
            return jsonify({'score': score, 'coef': coef, 'proceso': proceso})
        elif model_type == 'regresion_logistica':
            model = LogisticRegression(max_iter=1000).fit(X, y)
            score = model.score(X, y)
            coef = model.coef_[0].tolist() if len(model.coef_.shape) > 1 else model.coef_.tolist()
            intercept = model.intercept_[0] if hasattr(model.intercept_, '__iter__') else model.intercept_
            # Fórmula general
            formula = f"log(p/(1-p)) = {intercept:.4f} + " + " + ".join([f"({c:.4f} * {name})" for c, name in zip(coef, X.columns)])
            proceso.append("\n<b>Fórmula de la regresión logística:</b>")
            proceso.append(f"<span style='font-family:monospace;'>log(p/(1-p)) = b₀ + b₁X₁ + ... + bₙXₙ</span>")
            proceso.append(f"Donde:<br>p = probabilidad de éxito<br>X₁, X₂, ... = variables independientes<br>b₀ = intercepto<br>b₁, b₂, ... = coeficientes")
            proceso.append(f"<b>Fórmula con tus datos:</b> <span style='font-family:monospace;'>{formula}</span>")
            proceso.append(f"<b>Interpretación:</b> Cada coeficiente representa el cambio en el logit de la probabilidad por unidad de la variable independiente.")
            proceso.append(f"✅ Regresión logística ejecutada. Score: {score:.4f}")
            return jsonify({'score': score, 'coef': coef, 'proceso': proceso})
        elif model_type == 'discriminante':
            model = LinearDiscriminantAnalysis().fit(X, y)
            score = model.score(X, y)
            coef = model.coef_[0].tolist() if len(model.coef_.shape) > 1 else model.coef_.tolist()
            intercept = model.intercept_[0] if hasattr(model.intercept_, '__iter__') else model.intercept_
            formula = f"D = {intercept:.4f} + " + " + ".join([f"({c:.4f} * {name})" for c, name in zip(coef, X.columns)])
            proceso.append("\n<b>Fórmula del análisis discriminante:</b>")
            proceso.append(f"<span style='font-family:monospace;'>D = b₀ + b₁X₁ + ... + bₙXₙ</span>")
            proceso.append(f"Donde:<br>D = función discriminante<br>X₁, X₂, ... = variables independientes<br>b₀ = intercepto<br>b₁, b₂, ... = coeficientes")
            proceso.append(f"<b>Fórmula con tus datos:</b> <span style='font-family:monospace;'>{formula}</span>")
            proceso.append(f"<b>Interpretación:</b> La función D permite clasificar observaciones en grupos según las variables independientes.")
            proceso.append(f"✅ Análisis discriminante ejecutado. Score: {score:.4f}")
            return jsonify({'score': score, 'coef': coef, 'proceso': proceso})
        else:
            proceso.append("❌ Modelo no soportado.")
            return jsonify({'error': 'Modelo no soportado', 'proceso': proceso}), 400
    except Exception as e:
        print(f"❌ Error en análisis: {str(e)}")
        return jsonify({'error': f'Error en el análisis: {str(e)}'}), 500

@app.route('/plot', methods=['POST'])
def plot():
    try:
        if df is None:
            return jsonify({'error': 'Primero debe importar un archivo de datos'}), 400
        data = request.json
        x = data['x']
        y = data['y']
        print(f"📊 Generando gráfico: {x} vs {y}")
        # Validar columnas
        if x not in df.columns or y not in df.columns:
            return jsonify({'error': f'Columnas no encontradas: {x}, {y}'}), 400
        # Validar datos numéricos y nulos
        if df[x].isnull().any() or df[y].isnull().any():
            return jsonify({'error': 'Las columnas seleccionadas contienen valores nulos.'}), 400
        if not pd.api.types.is_numeric_dtype(df[x]) or not pd.api.types.is_numeric_dtype(df[y]):
            return jsonify({'error': 'Las columnas seleccionadas deben ser numéricas.'}), 400
        # Generar gráfico interactivo HTML
        fig = px.scatter(df, x=x, y=y, 
                        title=f'Gráfico de dispersión: {x} vs {y}',
                        labels={x: x, y: y})
        fig.update_layout(
            title_font_size=16,
            xaxis_title_font_size=14,
            yaxis_title_font_size=14
        )
        html = fig.to_html(full_html=False, include_plotlyjs='cdn')
        print(f"✅ Gráfico HTML generado exitosamente")
        return jsonify({'html': html})
    except Exception as e:
        print(f"❌ Error al generar gráfico: {str(e)}")
        return jsonify({'error': f'Error al generar gráfico: {str(e)}'}), 500

if __name__ == '__main__':
    print("🚀 Iniciando servidor Chambeador...")
    print("📊 Servidor de análisis multivariable")
    print("🌐 URL: http://localhost:5000")
    print("❓ Health check: http://localhost:5000/health")
    print("⏹️  Presiona Ctrl+C para detener")
    print("-" * 50)
    app.run(host='0.0.0.0', port=5000, debug=False)
