import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}"
    f"@{os.getenv('POSTGRES_HOST')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# MODELOS

class Rutina(db.Model):
    __tablename__ = 'rutinas'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    fecha = db.Column(db.Date, nullable=False)
    ejercicios = db.relationship('Ejercicio', backref='rutina', cascade="all, delete-orphan")

class Ejercicio(db.Model):
    __tablename__ = 'ejercicios'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    series = db.Column(db.Integer, nullable=False)
    repeticiones = db.Column(db.Integer, nullable=False)
    peso = db.Column(db.Float, nullable=True)
    rutina_id = db.Column(db.Integer, db.ForeignKey('rutinas.id'), nullable=False)

# RUTAS API

@app.route('/rutinas', methods=['GET'])
def obtener_rutinas():
    rutinas = Rutina.query.all()
    resultado = []
    for rutina in rutinas:
        resultado.append({
            'id': rutina.id,
            'nombre': rutina.nombre,
            'fecha': rutina.fecha.isoformat(),
            'ejercicios': [
                {
                    'id': e.id,
                    'nombre': e.nombre,
                    'series': e.series,
                    'repeticiones': e.repeticiones,
                    'peso': e.peso
                } for e in rutina.ejercicios
            ]
        })
    return jsonify(resultado)

@app.route('/rutinas', methods=['POST'])
def crear_rutina():
    datos = request.json
    rutina = Rutina(nombre=datos['nombre'], fecha=datos['fecha'])
    db.session.add(rutina)
    db.session.commit()
    return jsonify({'id': rutina.id}), 201

@app.route('/rutinas/<int:rutina_id>/ejercicios', methods=['POST'])
def agregar_ejercicio(rutina_id):
    rutina = Rutina.query.get_or_404(rutina_id)
    datos = request.json
    ejercicio = Ejercicio(
        nombre=datos['nombre'],
        series=datos['series'],
        repeticiones=datos['repeticiones'],
        peso=datos.get('peso'),
        rutina=rutina
    )
    db.session.add(ejercicio)
    db.session.commit()
    return jsonify({'id': ejercicio.id}), 201

@app.route('/rutinas/<int:rutina_id>/ejercicios/<int:ejercicio_id>', methods=['PUT'])
def editar_ejercicio(rutina_id, ejercicio_id):
    rutina = Rutina.query.get_or_404(rutina_id)
    ejercicio = Ejercicio.query.filter_by(id=ejercicio_id, rutina_id=rutina.id).first_or_404()

    datos = request.json
    ejercicio.nombre = datos.get('nombre', ejercicio.nombre)
    ejercicio.series = datos.get('series', ejercicio.series)
    ejercicio.repeticiones = datos.get('repeticiones', ejercicio.repeticiones)
    ejercicio.peso = datos.get('peso', ejercicio.peso)

    db.session.commit()
    return jsonify({'mensaje': 'Ejercicio actualizado'}), 200

@app.route('/rutinas/<int:rutina_id>/ejercicios/<int:ejercicio_id>', methods=['DELETE'])
def eliminar_ejercicio(rutina_id, ejercicio_id):
    rutina = Rutina.query.get_or_404(rutina_id)
    ejercicio = Ejercicio.query.filter_by(id=ejercicio_id, rutina_id=rutina.id).first_or_404()
    
    db.session.delete(ejercicio)
    db.session.commit()
    return jsonify({'mensaje': 'Ejercicio eliminado'}), 200

@app.route('/rutinas/<int:rutina_id>', methods=['DELETE'])
def eliminar_rutina(rutina_id):
    rutina = Rutina.query.get_or_404(rutina_id)
    db.session.delete(rutina)
    db.session.commit()
    return jsonify({'mensaje': 'Rutina eliminada'}), 200

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)