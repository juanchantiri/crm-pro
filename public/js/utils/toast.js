export const showToast = (message, type = 'success', customTitle = null) => {
    let container = document.getElementById('toastContainer');

    // Si no existe el contenedor en el HTML, el script lo crea solo (Auto-instalable)
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    // Le asignamos la clase que controla todo el diseño Glassmorphism en el CSS
    toast.className = 'toast-premium';
    toast.setAttribute('data-type', type);

    // Mapeo de iconos corporativos
    const icons = {
        success: '<i class="fa-solid fa-circle-check"></i>',
        error: '<i class="fa-solid fa-circle-exclamation"></i>',
        warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
        info: '<i class="fa-solid fa-circle-info"></i>'
    };

    // Títulos automáticos si no le pasas uno
    const defaultTitles = {
        success: '¡Operación Exitosa!',
        error: 'Algo salió mal',
        warning: 'Atención',
        info: 'Información'
    };

    const title = customTitle || defaultTitles[type] || defaultTitles.info;
    const iconHtml = icons[type] || icons.info;

    // Armamos la estructura de la tarjeta con la barra de progreso
    toast.innerHTML = `
        <div class="toast-icon ${type}">${iconHtml}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <div class="toast-progress"></div>
    `;

    // Lo agregamos a la pantalla
    container.appendChild(toast);

    // Temporizador: Inicia la animación de salida (.closing) a los 3 segundos
    setTimeout(() => {
        toast.classList.add('closing');
        
        // Esperamos 400ms a que termine la animación visual para borrarlo de la memoria
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 400);
        
    }, 3000);
};

// Lo atamos al objeto window globalmente para que funcione en toda tu app
window.showToast = showToast;