from fastapi import Request
from fastapi.responses import JSONResponse
import pandas as pd
import plotly.express as px
from utils import get_df

async def plot_logic(request):
    df = get_df()
    try:
        if df is None:
            return JSONResponse({'error': 'Primero debe importar un archivo de datos'}, status_code=400)
        data = await request.json()
        x = data['x']
        y = data['y']
        print(f"📊 Generando gráfico: {x} vs {y}")
        if x not in df.columns or y not in df.columns:
            return JSONResponse({'error': f'Columnas no encontradas: {x}, {y}'}, status_code=400)
        if df[x].isnull().any() or df[y].isnull().any():
            return JSONResponse({'error': 'Las columnas seleccionadas contienen valores nulos.'}, status_code=400)
        if not pd.api.types.is_numeric_dtype(df[x]) or not pd.api.types.is_numeric_dtype(df[y]):
            return JSONResponse({'error': 'Las columnas seleccionadas deben ser numéricas.'}, status_code=400)
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
        return JSONResponse({'html': html})
    except Exception as e:
        print(f"❌ Error al generar gráfico: {str(e)}")
        return JSONResponse({'error': f'Error al generar gráfico: {str(e)}'}, status_code=500)
