// Constantes y variables globales
const API_URL = ''; // Ruta vacía para usar las rutas relativas que Nginx proxy
let rutinas = [];
let rutinaActual = null;

// Añadimos manejo de errores global
window.addEventListener('error', function(e) {
    console.error('Error global:', e.message);
    mostrarNotificacion('Ha ocurrido un error en la aplicación', 'error');
});

// Elementos DOM
const listaRutinas = document.getElementById('lista-rutinas');
const detalleRutina = document.getElementById('detalle-rutina');
const detalleTitulo = document.getElementById('detalle-titulo');
const detalleFecha = document.getElementById('detalle-fecha');
const listaEjercicios = document.getElementById('lista-ejercicios');
const btnNuevaRutina = document.getElementById('btn-nueva-rutina');
const btnVolverRutinas = document.getElementById('btn-volver');
const btnAgregarEjercicio = document.getElementById('btn-agregar-ejercicio');
const modalNuevaRutina = document.getElementById('modal-nueva-rutina');
const modalNuevoEjercicio = document.getElementById('modal-nuevo-ejercicio');
const formNuevaRutina = document.getElementById('form-nueva-rutina');
const formNuevoEjercicio = document.getElementById('form-nuevo-ejercicio');
const rutinaIdEjercicio = document.getElementById('rutina-id-ejercicio');

// Funciones para cargar datos
async function cargarRutinas() {
    listaRutinas.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i> Cargando rutinas...
        </div>
    `;
    
    try {
        console.log('Iniciando solicitud para obtener rutinas...');
        const response = await fetch('/rutinas');
        console.log('Respuesta recibida:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error al cargar rutinas (Status: ${response.status})`);
        }
        
        rutinas = await response.json();
        console.log('Rutinas cargadas:', rutinas);
        renderizarRutinas();
    } catch (error) {
        console.error('Error al cargar rutinas:', error);
        listaRutinas.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar rutinas: ${error.message}</p>
                <button class="btn btn-primary retry-btn" onclick="cargarRutinas()">
                    <i class="fas fa-sync"></i> Reintentar
                </button>
            </div>
        `;
        mostrarNotificacion('Error al conectar con el servidor', 'error');
    }
}

// Funciones para renderizar la UI
function renderizarRutinas() {
    if (rutinas.length === 0) {
        listaRutinas.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-dumbbell"></i>
                <p>No tienes rutinas. ¡Crea una nueva para comenzar!</p>
            </div>
        `;
    } else {
        listaRutinas.innerHTML = rutinas
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .map(rutina => `
                <div class="rutina-card" data-id="${rutina.id}">
                    <h3>${rutina.nombre}</h3>
                    <p><i class="fas fa-calendar-alt"></i> ${formatearFecha(rutina.fecha)}</p>
                    <div class="rutina-actions">
                        <button class="btn btn-secondary btn-ver-rutina" data-id="${rutina.id}">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <button class="btn btn-danger btn-eliminar-rutina" data-id="${rutina.id}">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `).join('');

        document.querySelectorAll('.btn-ver-rutina').forEach(btn => {
            btn.addEventListener('click', () => {
                const rutinaId = btn.getAttribute('data-id');
                mostrarDetalleRutina(rutinaId);
            });
        });

        document.querySelectorAll('.btn-eliminar-rutina').forEach(btn => {
            btn.addEventListener('click', async () => {
                const rutinaId = btn.getAttribute('data-id');
                if (confirm('¿Eliminar esta rutina?')) {
                    await eliminarRutina(rutinaId);
                }
            });
        });
    }
}

async function eliminarRutina(id) {
    try {
        const response = await fetch(`/rutinas/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error(`Error ${response.status}`);

        rutinas = rutinas.filter(r => r.id != id);
        renderizarRutinas();
        mostrarNotificacion('Rutina eliminada', 'success');
    } catch (err) {
        console.error('Error al eliminar rutina:', err);
        mostrarNotificacion('No se pudo eliminar la rutina', 'error');
    }
}

function mostrarDetalleRutina(rutinaId) {
    rutinaActual = rutinas.find(r => r.id == rutinaId);
    
    if (rutinaActual) {
        detalleTitulo.textContent = rutinaActual.nombre;
        detalleFecha.textContent = formatearFecha(rutinaActual.fecha);
        rutinaIdEjercicio.value = rutinaActual.id;
        
        renderizarEjercicios();
        
        document.querySelector('.rutinas-container').classList.add('hidden');
        detalleRutina.classList.remove('hidden');
    }
}

function renderizarEjercicios() {
    if (!rutinaActual) return;
    
    if (rutinaActual.ejercicios.length === 0) {
        listaEjercicios.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-running"></i>
                <p>No hay ejercicios en esta rutina. ¡Agrega uno!</p>
            </div>
        `;
    } else {
        listaEjercicios.innerHTML = rutinaActual.ejercicios.map(ejercicio => {
            return `
                <div class="ejercicio-item" data-id="${ejercicio.id}">
                    <div class="ejercicio-nombre">${ejercicio.nombre}</div>
                    <div class="ejercicio-detalles">
                        <div class="ejercicio-detail">
                            <i class="fas fa-layer-group"></i> ${ejercicio.series} series
                        </div>
                        <div class="ejercicio-detail">
                            <i class="fas fa-redo"></i> ${ejercicio.repeticiones} repeticiones
                        </div>
                        <div class="ejercicio-detail">
                            <i class="fas fa-weight-hanging"></i> ${ejercicio.peso ? ejercicio.peso + ' kg' : 'Sin peso'}
                        </div>
                        <button class="btn btn-secondary btn-editar-ejercicio" data-id="${ejercicio.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-eliminar-ejercicio" data-id="${ejercicio.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Asignar eventos a los botones
        document.querySelectorAll('.btn-eliminar-ejercicio').forEach(btn => {
            btn.addEventListener('click', async () => {
                const ejercicioId = btn.getAttribute('data-id');
                if (confirm('¿Eliminar este ejercicio?')) {
                    await eliminarEjercicio(rutinaActual.id, ejercicioId);
                }
            });
        });

        document.querySelectorAll('.btn-editar-ejercicio').forEach(btn => {
            btn.addEventListener('click', () => {
                const ejercicioId = btn.getAttribute('data-id');
                const ejercicio = rutinaActual.ejercicios.find(e => e.id == ejercicioId);
                mostrarFormularioEdicion(ejercicio);
            });
        });
    }
}

async function eliminarEjercicio(rutinaId, ejercicioId) {
    try {
        const response = await fetch(`/rutinas/${rutinaId}/ejercicios/${ejercicioId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error(`Error ${response.status}`);

        // Actualizar datos locales
        const rutina = rutinas.find(r => r.id == rutinaId);
        rutina.ejercicios = rutina.ejercicios.filter(e => e.id != ejercicioId);
        renderizarEjercicios();
        mostrarNotificacion('Ejercicio eliminado con éxito', 'success');
    } catch (err) {
        console.error('Error al eliminar ejercicio:', err);
        mostrarNotificacion('No se pudo eliminar el ejercicio', 'error');
    }
}


// Funciones para crear nuevos elementos
async function crearNuevaRutina(nombre, fecha) {
    try {
        console.log('Creando nueva rutina:', nombre, fecha);
        const response = await fetch('/rutinas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nombre,
                fecha,
            }),
        });

        if (!response.ok) {
            throw new Error(`Error al crear rutina (Status: ${response.status})`);
        }

        const data = await response.json();
        console.log('Rutina creada:', data);
        
        // Añadir la nueva rutina a la lista
        const nuevaRutina = {
            id: data.id,
            nombre,
            fecha,
            ejercicios: [],
        };
        
        rutinas.push(nuevaRutina);
        renderizarRutinas();
        
        return nuevaRutina;
    } catch (error) {
        console.error('Error al crear rutina:', error);
        mostrarNotificacion(`Error al crear la rutina: ${error.message}`, 'error');
        return null;
    }
}

async function agregarEjercicio(rutinaId, nombre, series, repeticiones, peso) {
    try {
        console.log('Agregando ejercicio a rutina:', rutinaId);
        const response = await fetch(`/rutinas/${rutinaId}/ejercicios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nombre,
                series,
                repeticiones,
                peso: peso || null,
            }),
        });

        if (!response.ok) {
            throw new Error(`Error al agregar ejercicio (Status: ${response.status})`);
        }

        const data = await response.json();
        console.log('Ejercicio agregado:', data);
        
        // Encontrar la rutina y añadir el ejercicio
        const rutina = rutinas.find(r => r.id == rutinaId);
        if (rutina) {
            const nuevoEjercicio = {
                id: data.id,
                nombre,
                series,
                repeticiones,
                peso: peso || null,
            };
            
            rutina.ejercicios.push(nuevoEjercicio);
            renderizarEjercicios();
        }
        
        return data;
    } catch (error) {
        console.error('Error al agregar ejercicio:', error);
        mostrarNotificacion(`Error al agregar el ejercicio: ${error.message}`, 'error');
        return null;
    }
}

async function editarEjercicio(rutinaId, ejercicioId, datos) {
    try {
        const response = await fetch(`/rutinas/${rutinaId}/ejercicios/${ejercicioId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        if (!response.ok) throw new Error(`Error ${response.status}`);

        const rutina = rutinas.find(r => r.id == rutinaId);
        const index = rutina.ejercicios.findIndex(e => e.id == ejercicioId);
        rutina.ejercicios[index] = { id: ejercicioId, ...datos };

        renderizarEjercicios();
        mostrarNotificacion('Ejercicio actualizado', 'success');
    } catch (err) {
        console.error('Error al editar ejercicio:', err);
        mostrarNotificacion('Error al editar ejercicio', 'error');
    }
}


function mostrarFormularioEdicion(ejercicio) {
    const nombre = prompt('Nombre del ejercicio:', ejercicio.nombre);
    if (nombre === null) return;

    const series = prompt('Series:', ejercicio.series);
    if (series === null) return;

    const repeticiones = prompt('Repeticiones:', ejercicio.repeticiones);
    if (repeticiones === null) return;

    const peso = prompt('Peso (kg):', ejercicio.peso || 0);
    if (peso === null) return;

    editarEjercicio(rutinaActual.id, ejercicio.id, {
        nombre,
        series: parseInt(series),
        repeticiones: parseInt(repeticiones),
        peso: parseFloat(peso)
    });
}

// Funciones auxiliares
function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function mostrarNotificacion(mensaje, tipo) {
    // Crear notificación flotante
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    
    // Agregar ícono según el tipo
    let icono = '';
    if (tipo === 'success') {
        icono = '<i class="fas fa-check-circle"></i> ';
    } else if (tipo === 'error') {
        icono = '<i class="fas fa-exclamation-circle"></i> ';
    }
    
    notificacion.innerHTML = `${icono}${mensaje}`;
    
    document.body.appendChild(notificacion);
    
    // Mostrar y eliminar después de un tiempo
    setTimeout(() => {
        notificacion.classList.add('show');
        
        setTimeout(() => {
            notificacion.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notificacion);
            }, 300);
        }, 3000);
    }, 100);
}

// Modal handlers
function abrirModal(modal) {
    modal.style.display = 'block';
}

function cerrarModal(modal) {
    modal.style.display = 'none';
}

// Eventos globales
btnNuevaRutina.addEventListener('click', () => {
    formNuevaRutina.reset();
    abrirModal(modalNuevaRutina);
});

btnVolverRutinas.addEventListener('click', () => {
    document.querySelector('.rutinas-container').classList.remove('hidden');
    detalleRutina.classList.add('hidden');
    rutinaActual = null;
});

btnAgregarEjercicio.addEventListener('click', () => {
    formNuevoEjercicio.reset();
    abrirModal(modalNuevoEjercicio);
});

// Eventos de formularios
formNuevaRutina.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombreRutina = document.getElementById('nombre-rutina').value;
    const fechaRutina = document.getElementById('fecha-rutina').value;
    
    const nuevaRutina = await crearNuevaRutina(nombreRutina, fechaRutina);
    
    if (nuevaRutina) {
        cerrarModal(modalNuevaRutina);
        mostrarNotificacion('Rutina creada con éxito', 'success');
    }
});

formNuevoEjercicio.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombreEjercicio = document.getElementById('nombre-ejercicio').value;
    const seriesEjercicio = parseInt(document.getElementById('series-ejercicio').value);
    const repeticionesEjercicio = parseInt(document.getElementById('repeticiones-ejercicio').value);
    const pesoEjercicio = parseFloat(document.getElementById('peso-ejercicio').value) || null;
    
    const nuevoEjercicio = await agregarEjercicio(
        rutinaIdEjercicio.value,
        nombreEjercicio,
        seriesEjercicio,
        repeticionesEjercicio,
        pesoEjercicio
    );
    
    if (nuevoEjercicio) {
        cerrarModal(modalNuevoEjercicio);
        mostrarNotificacion('Ejercicio agregado con éxito', 'success');
    }
});

// Eventos de cierre de modales
document.querySelectorAll('.close, .cancel-modal').forEach(element => {
    element.addEventListener('click', () => {
        cerrarModal(modalNuevaRutina);
        cerrarModal(modalNuevoEjercicio);
    });
});

// Carga inicial de datos
window.addEventListener('DOMContentLoaded', () => {
    cargarRutinas();
});

// Cerrar modal al hacer clic fuera del contenido
window.addEventListener('click', (e) => {
    if (e.target === modalNuevaRutina) {
        cerrarModal(modalNuevaRutina);
    }
    if (e.target === modalNuevoEjercicio) {
        cerrarModal(modalNuevoEjercicio);
    }
});