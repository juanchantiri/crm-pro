import { store } from '../core/store.js';

export class TaskList {
    constructor() {
        this.container = document.getElementById('listaTareasProximas');
        this.initListeners();
    }

    initListeners() {
        // Escucha al estado global: si la variable 'reminders' se actualiza, se repinta solo
        window.addEventListener('stateChange', (e) => {
            if (e.detail.property === 'reminders') this.render(e.detail.value);
        });
    }

    render(tareas) {
        if (!this.container) return;
        this.container.innerHTML = ''; // Limpiamos el "Cargando..."

        if (!tareas || tareas.length === 0) {
            this.container.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-muted);">No hay tareas pendientes para hoy.</p>';
            return;
        }

        // Dibuja solo las 3 tareas más próximas (por si tienes 50, no romper el diseño)
        tareas.slice(0, 3).forEach(tarea => {
            // Formateamos la fecha al estilo argentino (ej: 03 mar, 10:30)
            const fecha = new Date(tarea.fecha_vencimiento).toLocaleString('es-AR', {
                day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'
            });
            
            const card = document.createElement('div');
            card.className = 'task-card'; // Clase que ya tienes en tu style.css
            
            // Verificamos si hay cliente asignado (por si el backend manda null)
            const nombreCliente = tarea.cliente_nombre ? `${tarea.cliente_nombre} ${tarea.cliente_apellido}` : 'Sin cliente asignado';

            card.innerHTML = `
                <div class="task-info">
                    <h4>${tarea.titulo}</h4>
                    <p>${nombreCliente}</p>
                    <span class="task-date">${fecha} hs</span>
                </div>
            `;
            this.container.appendChild(card);
        });
    }
}