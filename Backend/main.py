from flask import Flask, jsonify
from flask import render_template_string
from routes import register_routes


app = Flask(__name__)
register_routes(app)

# Pantalla de bienvenida en la raíz
@app.route('/')
def welcome():
    return render_template_string('''
        <html>
        <head>
            <title>API Multiversal</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f7f7fa; color: #222; text-align: center; padding-top: 60px; }
                .welcome-box { background: #fff; border-radius: 12px; box-shadow: 0 2px 12px #0001; display: inline-block; padding: 2.5rem 3.5rem; }
                h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
                p { font-size: 1.2rem; color: #444; }
                .emoji { font-size: 2.5rem; }
            </style>
        </head>
        <body>
            <div class="welcome-box">
                <div class="emoji">🚀</div>
                <h1>API Multiversal</h1>
                <p>Bienvenido a la API de análisis multivariable.<br>
                Consulta la documentación o usa los endpoints disponibles.<br><br>
                <b>Health check:</b> <a href="/health">/health</a>
                </p>
            </div>
        </body>
        </html>
    ''')

if __name__ == '__main__':
    print("🚀 Iniciando servidor Chambeador...")
    print("📊 Servidor de análisis multivariable")
    print("🌐 URL: http://localhost:5000")
    print("❓ Health check: http://localhost:5000/health")
    print("⏹️  Presiona Ctrl+C para detener")
    print("-" * 50)
    app.run(host='0.0.0.0', port=5000, debug=False)
