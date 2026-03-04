import { api } from './core/api.js';
import { sanitize } from './core/security.js';

document.addEventListener('DOMContentLoaded', async () => {

    try {
        await api.checkSession();
    } catch (e) {
        window.location.href = 'login.phtml';
        return;
    }

    const listaVencidas = document.getElementById('listaVencidas');
    const listaHoy = document.getElementById('listaHoy');
    const listaProximas = document.getElementById('listaProximas');

    // Función principal para cargar y ordenar tareas
    const cargarTareas = async () => {
        // Ponemos un estado de carga bonito
        const loader = `<p style="color:var(--text-muted); font-size:0.85rem; text-align:center;">Cargando...</p>`;
        listaVencidas.innerHTML = loader;
        listaHoy.innerHTML = loader;
        listaProximas.innerHTML = loader;

        try {
            const res = await api.getPendingReminders();
            let tareas = [];
            if (Array.isArray(res.data)) tareas = res.data;
            else if (res.data && Array.isArray(res.data.data)) tareas = res.data.data;

            // Limpiamos listas
            listaVencidas.innerHTML = '';
            listaHoy.innerHTML = '';
            listaProximas.innerHTML = '';

            const hoyDate = new Date();
            hoyDate.setHours(0,0,0,0); // Normalizamos a la medianoche de hoy

            let contVencidas = 0, contHoy = 0, contProximas = 0;

            tareas.forEach(tarea => {
                const fechaTarea = new Date(tarea.fecha_vencimiento);
                const fechaNormalizada = new Date(tarea.fecha_vencimiento);
                fechaNormalizada.setHours(0,0,0,0);

                let claseBadge = '';
                let textoFecha = fechaTarea.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                let targetList = listaProximas;

                // Lógica para decidir en qué columna cae la tarea
                if (fechaNormalizada < hoyDate) {
                    claseBadge = 'urgente';
                    targetList = listaVencidas;
                    contVencidas++;
                } else if (fechaNormalizada.getTime() === hoyDate.getTime()) {
                    claseBadge = 'hoy';
                    targetList = listaHoy;
                    contHoy++;
                    textoFecha = `Hoy, ${fechaTarea.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
                } else {
                    targetList = listaProximas;
                    contProximas++;
                }

                const ticket = document.createElement('div');
                ticket.className = 'task-ticket';
                ticket.innerHTML = `
                    <div class="task-checkbox" data-id="${tarea.id}" title="Marcar como completada">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <div class="task-details">
                        <h4>${sanitize(tarea.titulo)}</h4>
                        ${tarea.descripcion ? `<p>${sanitize(tarea.descripcion)}</p>` : ''}
                        <div class="task-meta">
                            <span class="task-date-badge ${claseBadge}"><i class="fa-regular fa-clock"></i> ${textoFecha}</span>
                            </div>
                    </div>
                `;
                targetList.appendChild(ticket);
            });

            // Mensajes vacíos si no hay tareas en esa columna
            if(contVencidas === 0) listaVencidas.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">No hay tareas urgentes. ¡Genial!</p>`;
            if(contHoy === 0) listaHoy.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">Tu día está libre.</p>`;
            if(contProximas === 0) listaProximas.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">No hay tareas a futuro.</p>`;

        } catch (error) {
            console.error(error);
            listaHoy.innerHTML = `<p style="color:red; font-size:0.85rem;">Error al cargar tareas.</p>`;
        }
    };

    // Delegación de eventos para completar tareas (Checkbox)
    document.querySelector('.tasks-dashboard').addEventListener('click', async (e) => {
        const checkbox = e.target.closest('.task-checkbox');
        if (checkbox) {
            const taskId = checkbox.dataset.id;
            
            // Efecto visual instantáneo antes de llamar a la API
            const ticket = checkbox.closest('.task-ticket');
            ticket.style.opacity = '0.5';
            ticket.style.transform = 'scale(0.95)';
            
            try {
                // Aquí deberías llamar a la ruta de tu API que marca la tarea como completada
                // await api.completeReminder(taskId); 
                
                // Si la tienes, descoméntala. Por ahora simulamos que se borra de la lista:
                setTimeout(() => {
                    ticket.remove();
                    // Opcional: mostrar un window.showToast("Tarea completada", "success");
                }, 300);

            } catch (err) {
                ticket.style.opacity = '1';
                ticket.style.transform = 'scale(1)';
                alert("Hubo un error al completar la tarea.");
            }
        }
    });

    // Iniciar carga
    cargarTareas();
});