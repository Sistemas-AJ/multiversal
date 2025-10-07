
# --- main.py solo inicializa la app y registra las rutas ---
from flask import Flask
from routes import register_routes

app = Flask(__name__)
register_routes(app)

if __name__ == '__main__':
    print("🚀 Iniciando servidor Chambeador...")
    print("📊 Servidor de análisis multivariable")
    print("🌐 URL: http://localhost:5000")
    print("❓ Health check: http://localhost:5000/health")
    print("⏹️  Presiona Ctrl+C para detener")
    print("-" * 50)
    app.run(host='0.0.0.0', port=5000, debug=False)
