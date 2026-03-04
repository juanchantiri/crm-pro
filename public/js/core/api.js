// /public/js/core/api.js

export class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async #request(endpoint, method = 'GET', body = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        };

        if (body) options.body = JSON.stringify(body);

        try {
            const response = await fetch(url, options);
            
            // --- INTERCEPTOR DE AUTENTICACIÓN (401) ---
            if (response.status === 401 && endpoint !== '/login') {
                window.location.href = 'login.phtml';
                throw new Error('Sesión caducada. Redirigiendo...');
            }

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Error de comunicación');
            
            return { status: response.status, data };
        } catch (error) {
            console.error(`[API Error - ${method} ${endpoint}]: ${error.message}`);
            throw error;
        }
    }

    // --- MÉTODOS DE AUTENTICACIÓN ---
    async login(email, password) {
        return await this.#request('/login', 'POST', { email, password });
    }
    
    async checkSession() {
        return await this.#request('/check-session', 'GET');
    }
    
    async logout() {
        return await this.#request('/logout', 'GET');
    }

    // --- MÉTODOS DE CLIENTES ---
    async getClients() {
        return await this.#request('/clients', 'GET');
    }

    async createClient(clientData) {
        return await this.#request('/clients', 'POST', clientData);
    }

    async updateClientStatus(clientId, nuevoEstado) {
        return await this.#request(`/clients/${clientId}/status`, 'PUT', { estado: nuevoEstado });
    }
    
    // --- MÉTODOS DE RECORDATORIOS ---
    async getPendingReminders() {
        return await this.#request('/reminders', 'GET');
    }

    async createReminder(reminderData) {
        return await this.#request('/reminders', 'POST', reminderData);
    }

    // --- MÉTODOS DE NOTAS ---
    async getNotesByClient(clientId) {
        return await this.#request(`/notes?client_id=${clientId}`, 'GET');
    }

    async createNote(noteData) {
        return await this.#request('/notes', 'POST', noteData);
    }
    async getTags() {
        return await this.#request('/tags', 'GET');
    }

    async assignTag(clientId, nombre, colorHex) {
        return await this.#request(`/clients/${clientId}/tags`, 'POST', { 
            nombre: nombre.toUpperCase(), 
            color_hex: colorHex 
        });
    }
}


// ATENCIÓN: Asegúrate de que esta URL sea exactamente la de tu proyecto en XAMPP
export const api = new ApiClient('http://localhost/mini-crm/api');