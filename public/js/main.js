import './utils/toast.js';

import { api } from './core/api.js';
import { store } from './core/store.js'; // <-- IMPORTACIÓN FALTANTE QUE CAUSABA EL ERROR
import { Dashboard } from './components/Dashboard.js';
import { KanbanBoard } from './components/KanbanBoard.js';
import { Modal } from './components/Modal.js';
import { ClientService } from './services/ClientService.js';
import { TaskList } from './components/TaskList.js'; // <-- IMPORTACIÓN PARA LA LISTA DE TAREAS

// Entry point: Se ejecuta cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async () => {
    // 1. EL PORTERO: Validar Sesión 
    try {
        const session = await api.checkSession();
        const userData = session.data.data;
        
       // Cargar Nombre y Saludo Contextual (Dependiendo de la hora)
        const hora = new Date().getHours();
        let saludo = 'Buenas noches';
        
        if (hora >= 5 && hora < 12) {
            saludo = 'Buenos días';
        } else if (hora >= 12 && hora < 19) {
            saludo = 'Buenas tardes';
        }

        const nombre = userData.nombre_negocio || 'Profesional';
        
        // Inyectamos el saludo y resaltamos el nombre con el color primario
        document.getElementById('greetingTitle').innerHTML = `${saludo}, <span style="color: var(--primary-color);">${nombre}</span>.`;
        
        // ELIMINAMOS LA LÓGICA DE AJUSTES QUE CAUSABA EL CRASH AQUÍ
        
   } catch (e) {
        console.error("Error validando sesión:", e);
        window.location.href = 'login.phtml'; // ¡Esta es la línea clave que te envía al login!
        return; 
    }

    // 2. INICIALIZAR COMPONENTES UI
    const dashboard = new Dashboard();
    const kanban = new KanbanBoard(); 
    const taskList = new TaskList(); // <-- INICIAMOS EL COMPONENTE DE TAREAS
    
    const modalNuevoCliente = new Modal('modalNuevoCliente');
    // Instancia el resto de modales aquí: modalNotas, modalTarea...

    // 3. CARGAR DATOS (Dispara la reactividad de la app)
    await ClientService.loadAllClients();
    
    // --- Cargar tareas pendientes ---
    try {
        const resReminders = await api.getPendingReminders();
        
        // Extractor Inteligente para Tareas
        let tareasArray = [];
        if (Array.isArray(resReminders.data)) {
            tareasArray = resReminders.data;
        } else if (resReminders.data && Array.isArray(resReminders.data.data)) {
            tareasArray = resReminders.data.data;
        }
        
        store.reminders = tareasArray;
        
        // APAGAMOS EL SKELETON LOADER Y PONEMOS EL NÚMERO REAL
        const badgeTareas = document.getElementById('totalTareasCount');
        if (badgeTareas) {
            badgeTareas.classList.remove('skeleton'); // Quita el fondo de carga
            badgeTareas.removeAttribute('aria-busy');
            badgeTareas.textContent = store.reminders.length; // Escribe el número
        }
    } catch (e) {
        console.error("No se pudieron cargar las tareas", e);
    }

    // --- Formulario para agendar Tareas ---
    const formNuevaTarea = document.getElementById('formNuevaTarea');
    if (formNuevaTarea) {
        formNuevaTarea.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                client_id: document.getElementById('tareaClientId').value,
                titulo: document.getElementById('tareaTitulo').value,
                descripcion: document.getElementById('tareaDesc').value,
                fecha_vencimiento: document.getElementById('tareaFecha').value.replace('T', ' ') + ':00'
            };
            try {
                await api.createReminder(data);
                modalTarea.close();
                window.showToast("Tarea agendada", "success");
                
                // Recargar tareas
                const res = await api.getPendingReminders();
                let nuevasTareas = [];
                if (Array.isArray(res.data)) nuevasTareas = res.data;
                else if (res.data && Array.isArray(res.data.data)) nuevasTareas = res.data.data;
                
                store.reminders = nuevasTareas;
                document.getElementById('totalTareasCount').textContent = store.reminders.length;
            } catch (err) { window.showToast("Error al agendar", "error"); }
        });
    }

    // 4. BINDINGS DE EVENTOS MANUALES (Botones del header)

    const btnExportar = document.getElementById('btnExportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            ClientService.exportToCSV();
        });
    }
    const btnNuevoCliente = document.getElementById('btnNuevoCliente');
    if (btnNuevoCliente) {
        btnNuevoCliente.addEventListener('click', () => modalNuevoCliente.open());
    }

    const formNuevoCliente = document.getElementById('formNuevoCliente');
    if (formNuevoCliente) {
        formNuevoCliente.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Recolectar datos
            const data = {
                nombre: document.getElementById('cliNombre').value,
                apellido: document.getElementById('cliApellido').value,
                telefono: document.getElementById('cliTelefono').value,
                email: document.getElementById('cliEmail').value,
                documento: document.getElementById('cliDocumento').value,
                origen: document.getElementById('cliOrigen').value,
                producto_interes: document.getElementById('cliProducto').value,
                monto_estimado: document.getElementById('cliMonto').value ? parseFloat(document.getElementById('cliMonto').value) : null
            };

            // Llamar al servicio
            const success = await ClientService.createNewClient(data);
            if (success) {
                modalNuevoCliente.close();
            }
        });
    }

    // BOTÓN DE LOGOUT GLOBAL
    const btnCerrarSesion = document.getElementById('btnCerrarSesionAjustes');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', async () => {
            await api.logout();
            window.location.href = 'login.phtml';
        });
    }

    // --- LÓGICA DE MODALES DE TARJETAS (Notas y Tareas) ---
    const modalNotas = new Modal('modalNotas');
    const modalTarea = new Modal('modalTarea');
    const listaNotas = document.getElementById('listaNotas');

    // Escuchamos el evento que dispara el KanbanBoard al tocar el botón de Notas
    window.addEventListener('abrirNotas', async (e) => {
        const clientId = e.detail.id;
        document.getElementById('notaClientId').value = clientId;
        modalNotas.open();
        
        listaNotas.innerHTML = '<p class="skeleton" style="height: 50px; margin-bottom:10px;"></p>';
        
        try {
            const res = await api.getNotesByClient(clientId);
            const notas = res.data.data || [];
            listaNotas.innerHTML = notas.length ? '' : '<p style="text-align:center; color:var(--text-muted);">Sin notas previas.</p>';
            
            notas.forEach(n => {
                const div = document.createElement('div');
                div.className = 'note-item';
                div.innerHTML = `<p>${n.contenido}</p><small>${new Date(n.creado_en).toLocaleString()}</small>`;
                listaNotas.prepend(div);
            });
        } catch (error) {
            listaNotas.innerHTML = '<p style="color:red;">Error al cargar el historial.</p>';
        }
    });

    // Escuchamos el evento del botón de Tareas
    window.addEventListener('abrirTarea', (e) => {
        const clientId = e.detail.id;
        document.getElementById('tareaClientId').value = clientId;
        modalTarea.open();
        
        // Poner la fecha de mañana por defecto
        const m = new Date(); m.setDate(m.getDate() + 1);
        document.getElementById('tareaFecha').value = m.toISOString().slice(0, 16);
    });

    // Enviar formulario de Notas
    const formNuevaNota = document.getElementById('formNuevaNota');
    if (formNuevaNota) {
        formNuevaNota.addEventListener('submit', async (e) => {
            e.preventDefault();
            const clientId = document.getElementById('notaClientId').value;
            const contenido = document.getElementById('notaContenido').value;
            
            try {
                await api.createNote({ client_id: clientId, contenido });
                formNuevaNota.reset();
                window.showToast("Nota guardada", "success");
                // Recargar las notas en el modal
                window.dispatchEvent(new CustomEvent('abrirNotas', { detail: { id: clientId } }));
            } catch (err) { window.showToast("Error al guardar nota", "error"); }
        });
    }


    // --- MOTOR DE ETIQUETAS (TAGS) ---
    const modalEtiquetas = new Modal('modalEtiquetas');
    const selectFiltro = document.getElementById('filtroEtiquetas');

    // 1. Cargar las etiquetas existentes en el menú desplegable (Filtro)
    const cargarFiltroEtiquetas = async () => {
        try {
            const res = await api.getTags();
            const tags = Array.isArray(res.data) ? res.data : (res.data.data || []);
            
            // Limpiamos y recargamos
            selectFiltro.innerHTML = '<option value="">🏷️ Todas las etiquetas</option>';
            tags.forEach(tag => {
                const opt = document.createElement('option');
                opt.value = tag.nombre;
                opt.textContent = tag.nombre;
                selectFiltro.appendChild(opt);
            });
        } catch (e) { console.warn("No se pudieron cargar los filtros de etiquetas"); }
    };
    // Llamamos a esta función al iniciar
    cargarFiltroEtiquetas();

    // 2. Escuchar cuando el usuario cambia el filtro en el menú superior
        // --- MOTOR DE BÚSQUEDA Y FILTRADO COMBINADO ---
    const inputBuscar = document.getElementById('inputBuscarCliente');

    // Función central que aplica ambos filtros a la vez
    const aplicarFiltros = () => {
        const texto = inputBuscar ? inputBuscar.value.toLowerCase() : '';
        const tagSeleccionada = selectFiltro ? selectFiltro.value : '';

        // 1. Empezamos con todos los clientes
        let filtrados = store.clients;

        // 2. Filtramos por texto (Nombre Completo o Teléfono)
        if (texto !== "") {
            filtrados = filtrados.filter(c => {
                // Combinamos nombre y apellido en una sola frase para la búsqueda
                const nombreCompleto = `${c.nombre || ''} ${c.apellido || ''}`.toLowerCase();
                const telefono = c.telefono || '';

                // Ahora buscamos si el texto escrito coincide con la frase completa o el teléfono
                return nombreCompleto.includes(texto) || telefono.includes(texto);
            });
        }

        // 3. Le pasamos los clientes filtrados por texto al Kanban, 
        // y le decimos que también aplique la etiqueta (si hay una seleccionada)
        kanban.render(filtrados, tagSeleccionada === "" ? null : tagSeleccionada);
    };

    // Escuchar el menú de etiquetas
    if (selectFiltro) {
        selectFiltro.addEventListener('change', aplicarFiltros);
    }

    // Escuchar el teclado mientras escribe (Búsqueda en tiempo real)
    if (inputBuscar) {
        inputBuscar.addEventListener('input', aplicarFiltros);
    }

    // 3. Abrir modal de etiquetas (Agregamos un truco para abrirlo al hacer doble clic en una tarjeta)
    document.querySelector('.kanban-board').addEventListener('dblclick', (e) => {
        const card = e.target.closest('.k-card');
        if (card) {
            document.getElementById('etiquetaClientId').value = card.dataset.id;
            modalEtiquetas.open();
        }
    });

    // 4. Guardar nueva etiqueta
    const formNuevaEtiqueta = document.getElementById('formNuevaEtiqueta');
    if (formNuevaEtiqueta) {
        formNuevaEtiqueta.addEventListener('submit', async (e) => {
            e.preventDefault();
            const clientId = document.getElementById('etiquetaClientId').value;
            const nombre = document.getElementById('etiquetaNombre').value;
            const color = document.getElementById('etiquetaColor').value;
            
            try {
                await api.assignTag(clientId, nombre, color);
                modalEtiquetas.close();
                window.showToast("Etiqueta asignada", "success");
                
                // Recargamos clientes para que aparezca la etiqueta en la tarjeta
                await ClientService.loadAllClients();
                cargarFiltroEtiquetas(); // Actualizamos el filtro por si es una etiqueta nueva
            } catch (err) { window.showToast("Error al asignar etiqueta", "error"); }
        });
    }
    // --- LÓGICA DE NAVEGACIÓN DEL MENÚ LATERAL ---
    // const btnNavDashboard = document.getElementById('navDashboard');
    // const btnNavAjustes = document.getElementById('navAjustes');
    
    // const viewDashboard = [document.querySelector('.dashboard-widgets'), document.querySelector('.kanban-board').parentElement, document.querySelector('.tasks-grid').parentElement, document.querySelector('.chart-section')];
    // const viewAjustes = document.getElementById('seccionAjustes');

    // btnNavAjustes.addEventListener('click', (e) => {
    //     e.preventDefault();
    //     btnNavDashboard.classList.remove('active');
    //     btnNavAjustes.classList.add('active');
    //     viewDashboard.forEach(el => el.style.display = 'none');
    //     viewAjustes.style.display = 'block';
    // });

    // btnNavDashboard.addEventListener('click', (e) => {
    //     e.preventDefault();
    //     btnNavAjustes.classList.remove('active');
    //     btnNavDashboard.classList.add('active');
    //     viewAjustes.style.display = 'none';
    //     viewDashboard.forEach(el => el.style.display = 'block');
    // });

   // --- PASARELA DE PAGOS (MercadoPago / Stripe) ---
    const btnUpgradePro = document.getElementById('btnUpgradePro');
    if (btnUpgradePro) {
        btnUpgradePro.addEventListener('click', () => {
            // Reemplaza esto con el Link de Pago real que generes en tu cuenta de MercadoPago
            const linkMercadoPago = 'https://mpago.la/2jeGMFf'; 
            
            window.showToast("Abriendo pasarela de pagos segura...", "success");
            
            // Abre MercadoPago en una pestaña nueva
            window.open(linkMercadoPago, '_blank'); 
        });
    }
});
