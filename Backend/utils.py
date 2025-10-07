# utils.py
import pandas as pd
from flask import jsonify

df = None

def get_df():
    global df
    return df

def set_df(new_df):
    global df
    df = new_df

def import_data_logic(request):
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
        ext = file.filename.split('.')[-1].lower()
        if ext == 'csv':
            new_df = pd.read_csv(file)
        elif ext in ['xls', 'xlsx']:
            new_df = pd.read_excel(file)
        else:
            return jsonify({'error': f'Formato no soportado: {ext}. Use CSV, XLS o XLSX'}), 400
        set_df(new_df)
        columns = new_df.columns.tolist()
        print(f"📊 Columnas encontradas: {', '.join(columns)}")
        return jsonify({'columns': columns})
    except Exception as e:
        print(f"❌ Error al importar archivo: {str(e)}")
        return jsonify({'error': f'Error al procesar el archivo: {str(e)}'}), 500
