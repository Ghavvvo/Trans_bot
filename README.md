# TransBot

Aplicación para generación automática de pruebas teóricas de tránsito para estudiar para los exámenes.

## Estructura del Proyecto

- `frontend/` - Aplicación React con Tailwind CSS
- `backend/` - API REST con Flask
- `shared/` - Recursos compartidos (preguntas, imágenes, etc.)

## Tecnologías

### Frontend
- React 18
- Tailwind CSS
- Axios para API calls
- React Router para navegación

### Backend
- Flask
- Flask-CORS
- SQLAlchemy
- Python 3.8+

## Instalación y Uso

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Características

- Generación automática de exámenes de tránsito
- Diferentes categorías de preguntas
- Modo práctica y modo examen
- Resultados y estadísticas
- Banco de preguntas actualizable
