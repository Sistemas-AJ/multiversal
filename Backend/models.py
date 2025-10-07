from fastapi import Request
from fastapi.responses import JSONResponse
import pandas as pd
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis

from schemas import ModelRequest
from utils import get_df

async def run_model_logic(data: 'ModelRequest'):
    df = get_df()
    try:
        if df is None:
            return JSONResponse({'error': 'Primero debe importar un archivo de datos'}, status_code=400)
        dep = data.dependent
        indep = data.independent
        model_type = data.type
        proceso = []
        proceso.append(f"Archivo cargado con {len(df)} filas y {len(df.columns)} columnas.")
        proceso.append(f"Modelo seleccionado: {model_type}")
        proceso.append(f"Variable dependiente: {dep}")
        proceso.append(f"Variables independientes: {', '.join(indep)}")
        missing_cols = [col for col in [dep] + indep if col not in df.columns]
        if missing_cols:
            proceso.append(f"❌ Columnas no encontradas: {', '.join(missing_cols)}")
            return JSONResponse({'error': f'Columnas no encontradas: {', '.join(missing_cols)}', 'proceso': proceso}, status_code=400)
        X = df[indep]
        y = df[dep]
        if X.isnull().any().any() or y.isnull().any():
            proceso.append("❌ Hay valores nulos en los datos. Por favor, limpia los datos antes de analizar.")
            return JSONResponse({'error': 'Hay valores nulos en los datos.', 'proceso': proceso}, status_code=400)
        if not all([pd.api.types.is_numeric_dtype(X[c]) for c in X.columns]) or not pd.api.types.is_numeric_dtype(y):
            proceso.append("❌ Las variables deben ser numéricas para el análisis.")
            return JSONResponse({'error': 'Las variables deben ser numéricas.', 'proceso': proceso}, status_code=400)
        if model_type == 'regresion_multiple':
            model = LinearRegression().fit(X, y)
            score = model.score(X, y)
            coef = model.coef_.tolist()
            intercept = model.intercept_
            formula = f"Y = {intercept:.4f} + " + " + ".join([f"({c:.4f} * {name})" for c, name in zip(coef, X.columns)])
            proceso.append("\n<b>Fórmula de la regresión múltiple:</b>")
            proceso.append(f"<span style='font-family:monospace;'>Y = b₀ + b₁X₁ + ... + bₙXₙ</span>")
            proceso.append(f"Donde:<br>Y = variable dependiente<br>X₁, X₂, ... = variables independientes<br>b₀ = intercepto<br>b₁, b₂, ... = coeficientes")
            proceso.append(f"<b>Fórmula con tus datos:</b> <span style='font-family:monospace;'>{formula}</span>")
            proceso.append(f"<b>Interpretación:</b> Por cada unidad que aumenta una variable independiente, Y cambia en su coeficiente respectivo, manteniendo las demás constantes.")
            proceso.append(f"✅ Regresión múltiple ejecutada. Score: {score:.4f}")
            return JSONResponse({'score': score, 'coef': coef, 'proceso': proceso})
        elif model_type == 'regresion_logistica':
            model = LogisticRegression(max_iter=1000).fit(X, y)
            score = model.score(X, y)
            coef = model.coef_[0].tolist() if len(model.coef_.shape) > 1 else model.coef_.tolist()
            intercept = model.intercept_[0] if hasattr(model.intercept_, '__iter__') else model.intercept_
            formula = f"log(p/(1-p)) = {intercept:.4f} + " + " + ".join([f"({c:.4f} * {name})" for c, name in zip(coef, X.columns)])
            proceso.append("\n<b>Fórmula de la regresión logística:</b>")
            proceso.append(f"<span style='font-family:monospace;'>log(p/(1-p)) = b₀ + b₁X₁ + ... + bₙXₙ</span>")
            proceso.append(f"Donde:<br>p = probabilidad de éxito<br>X₁, X₂, ... = variables independientes<br>b₀ = intercepto<br>b₁, b₂, ... = coeficientes")
            proceso.append(f"<b>Fórmula con tus datos:</b> <span style='font-family:monospace;'>{formula}</span>")
            proceso.append(f"<b>Interpretación:</b> Cada coeficiente representa el cambio en el logit de la probabilidad por unidad de la variable independiente.")
            proceso.append(f"✅ Regresión logística ejecutada. Score: {score:.4f}")
            return JSONResponse({'score': score, 'coef': coef, 'proceso': proceso})
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
            return JSONResponse({'score': score, 'coef': coef, 'proceso': proceso})
        else:
            proceso.append("❌ Modelo no soportado.")
            return JSONResponse({'error': 'Modelo no soportado', 'proceso': proceso}, status_code=400)
    except Exception as e:
        print(f"❌ Error en análisis: {str(e)}")
        return JSONResponse({'error': f'Error en el análisis: {str(e)}'}, status_code=500)
