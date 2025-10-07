# plots.py
from flask import jsonify
import pandas as pd
import plotly.express as px
from utils import get_df

def plot_logic(request):
    df = get_df()
    try:
        if df is None:
            return jsonify({'error': 'Primero debe importar un archivo de datos'}), 400
        data = request.json
        x = data['x']
        y = data['y']
        print(f"📊 Generando gráfico: {x} vs {y}")
        if x not in df.columns or y not in df.columns:
            return jsonify({'error': f'Columnas no encontradas: {x}, {y}'}), 400
        if df[x].isnull().any() or df[y].isnull().any():
            return jsonify({'error': 'Las columnas seleccionadas contienen valores nulos.'}), 400
        if not pd.api.types.is_numeric_dtype(df[x]) or not pd.api.types.is_numeric_dtype(df[y]):
            return jsonify({'error': 'Las columnas seleccionadas deben ser numéricas.'}), 400
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
