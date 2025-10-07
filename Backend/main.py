

# --- main.py inicializa la app FastAPI y monta las rutas ---
from fastapi import FastAPI
from routes import router

app = FastAPI(title="Chambeador", description="Servidor de análisis multivariable")
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    print("🚀 Iniciando servidor Chambeador...")
    print("📊 Servidor de análisis multivariable")
    print("🌐 URL: http://localhost:8000")
    print("❓ Health check: http://localhost:8000/health")
    print("⏹️  Presiona Ctrl+C para detener")
    print("-" * 50)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
