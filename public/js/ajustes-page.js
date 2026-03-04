import { api } from './core/api.js';
import { ClientService } from './services/ClientService.js';
import './utils/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validar Sesión y Cargar Datos
    try {
        const session = await api.checkSession();
        const userData = session.data.data;
        
        // Cargar Nombre y Avatar
        const nombre = userData.nombre_negocio || "Mi Negocio";
        document.getElementById('uiNombreNegocio').textContent = nombre;
        document.getElementById('inputNombreNegocio').value = nombre;
        document.getElementById('avatarConfig').textContent = nombre.charAt(0).toUpperCase();
        
        // Cargar Datos del Plan
        const planActual = userData.plan_actual ? userData.plan_actual.toUpperCase() : 'FREE';
        document.getElementById('uiPlanName').textContent = planActual;
        
        if (planActual === 'FREE') {
            document.getElementById('uiPlanExpiration').textContent = 'Versión Gratuita (Límites aplicados)';
        } else {
            const fechaVenc = new Date(userData.fecha_vencimiento_suscripcion).toLocaleDateString('es-AR');
            document.getElementById('uiPlanExpiration').textContent = `Tu suscripción vence el: ${fechaVenc}`;
            document.getElementById('btnUpgradePro').style.display = 'none'; 
        }
    } catch (e) {
        window.location.href = 'login.phtml';
        return; 
    }

    // 2. Exportar CSV
    const btnExportar = document.getElementById('btnExportar');
    if (btnExportar) {
        btnExportar.addEventListener('click', async () => {
            window.showToast("Generando reporte de clientes...", "success");
            await ClientService.loadAllClients();
            ClientService.exportToCSV();
        });
    }

    // 3. Cerrar Sesión
    const btnCerrarSesion = document.getElementById('btnCerrarSesionAjustes');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', async () => {
            await api.logout();
            window.location.href = 'login.phtml';
        });
    }

    // 4. Upgrade Pro
    const btnUpgradePro = document.getElementById('btnUpgradePro');
    if (btnUpgradePro) {
        btnUpgradePro.addEventListener('click', () => {
            window.open('https://mpago.la/2jeGMFf', '_blank'); 
        });
    }
});