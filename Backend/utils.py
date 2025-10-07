
# utils.py
import pandas as pd
from fastapi import UploadFile
from fastapi.responses import JSONResponse

df = None

def get_df():
    global df
    return df

def set_df(new_df):
    global df
    df = new_df

async def import_data_logic(file: UploadFile):
    try:
        if file is None or file.filename == '':
            return JSONResponse({'error': 'No se seleccionó ningún archivo'}, status_code=400)
        ext = file.filename.split('.')[-1].lower()
        if ext == 'csv':
            new_df = pd.read_csv(file.file)
        elif ext in ['xls', 'xlsx']:
            new_df = pd.read_excel(file.file)
        else:
            return JSONResponse({'error': f'Formato no soportado: {ext}. Use CSV, XLS o XLSX'}, status_code=400)
        set_df(new_df)
        columns = new_df.columns.tolist()
        print(f"📊 Columnas encontradas: {', '.join(columns)}")
        return JSONResponse({'columns': columns})
    except Exception as e:
        print(f"❌ Error al importar archivo: {str(e)}")
        return JSONResponse({'error': f'Error al procesar el archivo: {str(e)}'}, status_code=500)
