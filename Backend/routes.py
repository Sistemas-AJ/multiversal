# routes.py
from flask import request, jsonify
from models import run_model_logic
from plots import plot_logic
from utils import import_data_logic, get_df

def register_routes(app):
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'Servidor backend funcionando correctamente',
            'version': '1.0.0'
        })

    @app.route('/import', methods=['POST'])
    def import_data():
        return import_data_logic(request)

    @app.route('/model', methods=['POST'])
    def run_model():
        return run_model_logic(request)

    @app.route('/plot', methods=['POST'])
    def plot():
        return plot_logic(request)
