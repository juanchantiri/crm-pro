import { api } from './core/api.js';
import { sanitize } from './core/security.js';
import { Modal } from './components/Modal.js'; // Importamos el controlador de modales

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Validar sesión
    try {
        await api.checkSession();
    } catch (e) {
        window.location.href = 'login.phtml';
        return;
    }

    let allClients = [];
    const tbody = document.getElementById('tbodyDirectorio');
    const inputBuscar = document.getElementById('buscadorDirectorio');
    const selectEstado = document.getElementById('filtroEstadoDirectorio');

    // Inicializamos el modal
    const modalNotas = new Modal('modalNotas');

    // Función para Obtener Iniciales
    const getInitials = (nombre, apellido) => {
        const n = nombre ? nombre.charAt(0).toUpperCase() : '';
        const a = apellido ? apellido.charAt(0).toUpperCase() : '';
        return n + a || '?';
    };

    // Función Mágica de WhatsApp
    const getWaLink = (phone, nombre, interes) => {
        if (!phone) return '#';
        let num = phone.replace(/\D/g, '');
        if (num.startsWith('0')) num = num.substring(1);
        if (num.length === 10 && (num.startsWith('11') || num.startsWith('2') || num.startsWith('3'))) num = '549' + num;
        else if (!num.startsWith('54') && num.length >= 10) num = '549' + num;
        
        const prod = interes || 'nuestros servicios';
        const text = encodeURIComponent(`¡Hola ${nombre}! 👋 Te escribo desde la administración por tu interés en: *${prod}*.`);
        return `https://wa.me/${num}?text=${text}`;
    };

    // 2. Renderizar la tabla
    const renderTable = (clientes) => {
        tbody.innerHTML = '';
        
        if (clientes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">No se encontraron clientes con esos filtros.</td></tr>`;
            return;
        }

        clientes.forEach(client => {
            const tr = document.createElement('tr');
            
            // Icono de estado
            let iconEstado = 'fa-circle-dot';
            if(client.estado === 'cerrado') iconEstado = 'fa-check-circle';
            if(client.estado === 'nuevo') iconEstado = 'fa-star';

            const montoHtml = client.monto_estimado ? `<br><small style="color:#10b981; font-weight:700; margin-top:4px; display:block;">$${parseFloat(client.monto_estimado).toLocaleString('es-AR')}</small>` : '';

            // Lógica de botones
            const waLink = getWaLink(client.telefono, client.nombre, client.producto_interes);
            const disableWa = !client.telefono ? 'opacity: 0.3; pointer-events: none;' : '';

            tr.innerHTML = `
                <td>
                    <div class="client-profile-cell">
                        <div class="avatar-initials">${getInitials(client.nombre, client.apellido)}</div>
                        <div class="client-info">
                            <h4>${sanitize(client.nombre)} ${sanitize(client.apellido)}</h4>
                            <span>Cargado el: ${new Date(client.creado_en).toLocaleDateString()}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="client-info">
                        <span style="color: var(--text-main); font-weight: 500;"><i class="fa-brands fa-whatsapp" style="color:#25D366;"></i> ${sanitize(client.telefono || '-')}</span><br>
                        <span>${sanitize(client.email || 'Sin email')}</span>
                    </div>
                </td>
                <td>
                    <div class="client-info">
                        <span style="color: var(--primary-color); font-weight: 600;">${sanitize(client.producto_interes || 'General')}</span>
                        ${montoHtml}
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${client.estado || 'nuevo'}">
                        <i class="fa-solid ${iconEstado}"></i> ${client.estado || 'Nuevo'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; height: 100%;">
                        <a href="${waLink}" target="_blank" class="btn-action" title="Abrir WhatsApp" style="background:#ffffff; border:1px solid var(--border-color); width: 32px; height: 32px; display:flex; align-items:center; justify-content:center; text-decoration:none; color: #25D366; ${disableWa}">
                            <i class="fa-brands fa-whatsapp"></i>
                        </a>
                        <button class="btn-action btn-detalles" data-id="${client.id}" title="Ver Historial" style="background:#ffffff; border:1px solid var(--border-color); width: 32px; height: 32px; color: var(--text-muted);">
                            <i class="fa-solid fa-folder-open"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    // 3. Escuchar clics en la tabla (Delegación de Eventos)
    tbody.addEventListener('click', async (e) => {
        const btnDetalles = e.target.closest('.btn-detalles');
        if (btnDetalles) {
            const clientId = btnDetalles.dataset.id;
            document.getElementById('notaClientId').value = clientId;
            modalNotas.open();
            
            // Cargar notas desde la API
            const listaNotas = document.getElementById('listaNotas');
            listaNotas.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Cargando...</p>';
            try {
                const res = await api.getNotesByClient(clientId);
                const notas = res.data.data || [];
                listaNotas.innerHTML = notas.length ? '' : '<p style="text-align:center; color:var(--text-muted);">Sin notas previas.</p>';
                notas.forEach(n => {
                    const div = document.createElement('div');
                    div.className = 'note-item';
                    div.innerHTML = `<p>${sanitize(n.contenido)}</p><small>${new Date(n.creado_en).toLocaleString()}</small>`;
                    listaNotas.prepend(div);
                });
            } catch (err) {
                listaNotas.innerHTML = '<p style="color:red; text-align:center;">Error al cargar.</p>';
            }
        }
    });

    // 4. Guardar Nueva Nota
    const formNuevaNota = document.getElementById('formNuevaNota');
    if (formNuevaNota) {
        formNuevaNota.addEventListener('submit', async (e) => {
            e.preventDefault();
            const clientId = document.getElementById('notaClientId').value;
            const contenido = document.getElementById('notaContenido').value;
            try {
                await api.createNote({ client_id: clientId, contenido });
                formNuevaNota.reset();
                modalNotas.close();
                // Opcional: Mostrar un Toast de éxito aquí si tienes la función global importada
            } catch (err) {
                alert("Error al guardar la nota.");
            }
        });
    }

    // 5. Filtrado Mágico
    const aplicarFiltros = () => {
        const texto = inputBuscar.value.toLowerCase();
        const estado = selectEstado.value;
        const filtrados = allClients.filter(c => {
            const matchTexto = (`${c.nombre} ${c.apellido} ${c.telefono} ${c.email}`).toLowerCase().includes(texto);
            const matchEstado = estado === "" ? true : c.estado === estado;
            return matchTexto && matchEstado;
        });
        renderTable(filtrados);
    };

    // 6. Cargar Datos al iniciar
    try {
        const res = await api.getClients(); 
        allClients = Array.isArray(res.data) ? res.data : (res.data.data || []);
        renderTable(allClients);
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error cargando clientes.</td></tr>`;
    }

    // 7. Listeners para los filtros
    inputBuscar.addEventListener('input', aplicarFiltros);
    selectEstado.addEventListener('change', aplicarFiltros);
});