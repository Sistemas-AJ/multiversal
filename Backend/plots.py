from fastapi.responses import JSONResponse
import pandas as pd
import plotly.express as px
from utils import get_df

async def plot_logic(data):
    df = get_df()
    try:
        if df is None:
            return JSONResponse({'error': 'Primero debe importar un archivo de datos'}, status_code=400)
        x = data.x
        y = data.y
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

async def plot_3d_logic(data):
    df = get_df()
    try:
        if df is None:
            return JSONResponse({'error': 'Primero debe importar un archivo de datos'}, status_code=400)
        x = data.x
        y = data.y
        z = data.z
        print(f"📊 Generando gráfico 3D: {x}, {y}, {z}")
        if x not in df.columns or y not in df.columns or z not in df.columns:
            return JSONResponse({'error': f'Columnas no encontradas: {x}, {y}, {z}'}, status_code=400)
        if df[x].isnull().any() or df[y].isnull().any() or df[z].isnull().any():
            return JSONResponse({'error': 'Las columnas seleccionadas contienen valores nulos.'}, status_code=400)
        if not pd.api.types.is_numeric_dtype(df[x]) or not pd.api.types.is_numeric_dtype(df[y]) or not pd.api.types.is_numeric_dtype(df[z]):
            return JSONResponse({'error': 'Las columnas seleccionadas deben ser numéricas.'}, status_code=400)
        fig = px.scatter_3d(df, x=x, y=y, z=z, 
                           title=f'Gráfico 3D: {x}, {y}, {z}',
                           labels={x: x, y: y, z: z})
        fig.update_layout(
            title_font_size=16,
            scene=dict(
                xaxis_title_font_size=14,
                yaxis_title_font_size=14,
                zaxis_title_font_size=14
            )
        )
        html = fig.to_html(full_html=False, include_plotlyjs='cdn')
        print(f"✅ Gráfico 3D HTML generado exitosamente")
        return JSONResponse({'html': html})
    except Exception as e:
        print(f"❌ Error al generar gráfico 3D: {str(e)}")
        return JSONResponse({'error': f'Error al generar gráfico 3D: {str(e)}'}, status_code=500)
