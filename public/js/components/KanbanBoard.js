import { store } from '../core/store.js';
import { api } from '../core/api.js';
import { sanitize } from '../core/security.js';

export class KanbanBoard {
    constructor() {
        this.boardElement = document.querySelector('.kanban-board');
        this.initListeners();
    }

    initListeners() {
        window.addEventListener('stateChange', (e) => {
            if (e.detail.property === 'clients') this.render(e.detail.value);
        });

        this.boardElement.addEventListener('dragover', (e) => e.preventDefault());
        this.boardElement.addEventListener('drop', this.handleDrop.bind(this));

        // EVENT DELEGATION
        this.boardElement.addEventListener('click', (e) => {
            const btnNotas = e.target.closest('.btn-notas');
            const btnTarea = e.target.closest('.btn-tarea');

            if (btnNotas) {
                const id = btnNotas.dataset.id;
                window.dispatchEvent(new CustomEvent('abrirNotas', { detail: { id } }));
            }
            if (btnTarea) {
                const id = btnTarea.dataset.id;
                window.dispatchEvent(new CustomEvent('abrirTarea', { detail: { id } }));
            }
        });
    }

    // Método auxiliar privado de la clase
    #generateWhatsAppLink(phone, nombreCliente, productoInteres) {
        if (!phone) return null;
        let num = phone.replace(/\D/g, ''); // Limpiar símbolos y espacios
        
        // Formateo de número nativo automático
        if (num.startsWith('0')) num = num.substring(1);
        if (num.length === 10 && (num.startsWith('11') || num.startsWith('2') || num.startsWith('3'))) {
            num = '549' + num;
        } else if (!num.startsWith('54') && num.length >= 10) {
            num = '549' + num; 
        }

        // EL TEXTO MÁGICO DE VENTAS
        const interes = productoInteres || 'nuestros servicios';
        const mensaje = encodeURIComponent(`¡Hola ${nombreCliente}! 👋 Soy tu asesor. Te escribo por tu interés en: *${interes}*. ¿Te parece si armamos una propuesta a medida?`);
        
        return `https://wa.me/${num}?text=${mensaje}`;
    }

    render(clients, tagFilter = null) {
        document.querySelectorAll('.kanban-cards').forEach(col => col.innerHTML = '');
        const contadores = { nuevo: 0, contactado: 0, negociacion: 0, cerrado: 0 };
        
        // Sistema de Filtrado Inteligente en memoria (O(n))
        const clientesFiltrados = tagFilter 
            ? clients.filter(c => c.tags && c.tags.some(t => t.nombre === tagFilter)) 
            : clients;

        clientesFiltrados.forEach(client => {
            const estado = contadores[client.estado] !== undefined ? client.estado : 'nuevo';
            contadores[estado]++;

            // Renderizado de Etiquetas (Si tu API devuelve client.tags)
            let tagsHtml = '';
            if (client.tags && client.tags.length > 0) {
                tagsHtml = `<div class="card-tags" style="display:flex; gap:5px; margin-bottom:8px;">` + 
                    client.tags.map(t => `<span style="background:${t.color_hex}; color:#fff; font-size:0.7rem; padding:2px 6px; border-radius:4px; font-weight:600;">${sanitize(t.nombre)}</span>`).join('') +
                `</div>`;
            }

            // --- MAGIA EMPRESARIAL: Smart Fields y WhatsApp ---
            const waLink = this.#generateWhatsAppLink(client.telefono, client.nombre, client.producto_interes);
            const waBtnHtml = waLink 
                ? `<a href="${waLink}" target="_blank" class="btn-action" title="Enviar Propuesta por WhatsApp"><i class="fa-brands fa-whatsapp" style="color: #25D366; font-size: 1.3rem;"></i></a>` 
                : `<button class="btn-action" title="Sin teléfono válido" disabled style="opacity: 0.3; cursor: not-allowed;"><i class="fa-brands fa-whatsapp" style="font-size: 1.3rem;"></i></button>`;

            // Badge del Producto (Si tiene monto, lo formatea con puntos y el signo $)
            const formatMonto = client.monto_estimado ? ` - $${parseFloat(client.monto_estimado).toLocaleString('es-AR')}` : '';
            const badgeProducto = client.producto_interes ? 
                `<div style="background: #e0e7ff; color: #4338ca; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; margin-bottom: 12px; display: inline-flex; align-items: center; gap: 5px;">
                    <i class="fa-solid fa-star"></i> ${sanitize(client.producto_interes)}${formatMonto}
                </div>` : '';

            // Usamos etiqueta <article> para SEO y Semántica
            const card = document.createElement('article');
            card.className = 'k-card';
            card.draggable = true;
            card.dataset.id = client.id;
            card.setAttribute('role', 'listitem');

            card.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', client.id));

            card.innerHTML = `
                ${tagsHtml}
                <div class="k-card-title">${sanitize(client.nombre)} ${sanitize(client.apellido)}</div>
                
                <div class="k-card-subtitle">
                    ${badgeProducto}
                    <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 5px;">
                        <span><i class="fa-solid fa-phone" style="width: 16px;"></i> ${sanitize(client.telefono || 'Sin teléfono')}</span>
                        <span><i class="fa-regular fa-envelope" style="width: 16px;"></i> ${sanitize(client.email || 'Sin email')}</span>
                    </div>
                </div>

                <div class="k-card-actions">
                    ${waBtnHtml}
                    <button class="btn-action btn-notas" data-id="${client.id}" title="Ver Seguimiento"><i class="fa-solid fa-comment-dots"></i></button>
                    <button class="btn-action btn-tarea" data-id="${client.id}" title="Agendar Recordatorio"><i class="fa-solid fa-calendar-plus"></i></button>
                </div>
            `;
            
            const col = document.querySelector(`#col-${estado} .kanban-cards`);
            if (col) col.appendChild(card);
        });

        Object.keys(contadores).forEach(key => {
            const badge = document.querySelector(`#col-${key} .count-badge`);
            if(badge) badge.textContent = contadores[key];
        });
    }

    async handleDrop(e) {
        e.preventDefault();
        const column = e.target.closest('.kanban-column');
        if (!column) return;

        const clientId = e.dataTransfer.getData('text/plain');
        const nuevoEstado = column.dataset.estado;

        const clientIndex = store.clients.findIndex(c => c.id == clientId);
        if (clientIndex > -1) {
            store.clients[clientIndex].estado = nuevoEstado;
            store.clients = [...store.clients]; 
        }

        try {
            await api.updateClientStatus(clientId, nuevoEstado);
            window.showToast(`Movido a ${nuevoEstado}`, 'success');
        } catch (error) {
            window.showToast('Error al mover', 'error');
        }
    }
}