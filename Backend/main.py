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

@app.route('/import', methods=['POST'])
def import_data():
    file = request.files['file']
    ext = file.filename.split('.')[-1]
    if ext == 'csv':
        global df
        df = pd.read_csv(file)
    elif ext in ['xls', 'xlsx']:
        df = pd.read_excel(file)
    else:
        return jsonify({'error': 'Formato no soportado'}), 400
    return jsonify({'columns': df.columns.tolist()})

@app.route('/model', methods=['POST'])
def run_model():
    data = request.json
    dep = data['dependent']
    indep = data['independent']
    model_type = data['type']
    X = df[indep]
    y = df[dep]
    if model_type == 'regresion_multiple':
        model = LinearRegression().fit(X, y)
        score = model.score(X, y)
        coef = model.coef_.tolist()
        return jsonify({'score': score, 'coef': coef})
    elif model_type == 'regresion_logistica':
        model = LogisticRegression().fit(X, y)
        score = model.score(X, y)
        coef = model.coef_.tolist()
        return jsonify({'score': score, 'coef': coef})
    elif model_type == 'discriminante':
        model = LinearDiscriminantAnalysis().fit(X, y)
        score = model.score(X, y)
        coef = model.coef_.tolist()
        return jsonify({'score': score, 'coef': coef})
    else:
        return jsonify({'error': 'Modelo no soportado'}), 400

@app.route('/plot', methods=['POST'])
def plot():
    data = request.json
    x = data['x']
    y = data['y']
    fig = px.scatter(df, x=x, y=y)
    img_bytes = fig.to_image(format="png")
    img_b64 = base64.b64encode(img_bytes).decode('utf-8')
    return jsonify({'image': img_b64})

if __name__ == '__main__':
    app.run(port=5000)
