import { api } from '../core/api.js';
import { store } from '../core/store.js';

export class ClientService {
    static async loadAllClients() {
        try {
            const response = await api.getClients();
            console.log("📦 Datos recibidos del Backend:", response);

            // EXTRACTOR INTELIGENTE: Busca el array sin importar cómo venga envuelto
            let clientesArray = [];
            if (Array.isArray(response.data)) {
                clientesArray = response.data; // Si PHP manda el array directo
            } else if (response.data && Array.isArray(response.data.data)) {
                clientesArray = response.data.data; // Si PHP manda { status: "success", data: [...] }
            } else {
                console.warn("⚠️ No se encontró la lista de clientes. Verifica la respuesta de PHP.");
            }

            // Inyectamos el array en el Estado Global (Esto dispara el repintado del Kanban)
            store.clients = clientesArray; 

        } catch (error) {
            window.showToast("Error al cargar la cartera de clientes", "error");
            console.error("Error en ClientService:", error);
        }
    }

    static async createNewClient(clientData) {
        try {
            const response = await api.createClient(clientData);
            if (response.status === 201) {
                await this.loadAllClients();
                window.showToast('Cliente guardado exitosamente', 'success');
                return true;
            }
        } catch (error) {
            window.showToast(error.message || 'Error al guardar', 'error');
            return false;
        }
    }

    static exportToCSV() {
        const clients = store.clients;
        if (!clients || clients.length === 0) {
            return window.showToast("No hay datos para exportar", "error");
        }

        // PREVENCIÓN DE DOM XSS y CSV INJECTION (Excel Macro Execution)
        const sanitizeCSV = (str) => {
            let cleanStr = String(str || '').trim();
            // Evitar que la celda ejecute fórmulas en Excel/Sheets
            if (/^[=\-@+ \t\r]/.test(cleanStr)) {
                cleanStr = "'" + cleanStr; 
            }
            // Escapar comillas dobles
            return `"${cleanStr.replace(/"/g, '""')}"`;
        };

        const headers = ['Nombre', 'Apellido', 'Teléfono', 'Email', 'Estado', 'Origen'];
        const rows = clients.map(c => [
            sanitizeCSV(c.nombre), 
            sanitizeCSV(c.apellido), 
            sanitizeCSV(c.telefono), 
            sanitizeCSV(c.email), 
            sanitizeCSV(c.estado), 
            sanitizeCSV(c.origen)
        ].join(','));

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
        
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `CRM_Exportacion_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        window.showToast("Exportación completada", "success");
    }
}