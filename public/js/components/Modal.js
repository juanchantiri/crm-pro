export class Modal {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        if (!this.modal) return;
        
        this.closeBtn = this.modal.querySelector('.close-btn');
        this.initListeners();
    }

    initListeners() {
        // Cierre con el botón X
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }

        // Cierre al hacer clic fuera del contenido (en el overlay oscuro)
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Accesibilidad: Cierre con tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }

    open() {
        this.modal.classList.add('active');
        this.modal.setAttribute('aria-hidden', 'false');
        // Auto-focus en el primer input para mejorar la UX
        const firstInput = this.modal.querySelector('input, textarea, select');
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }

    close() {
        this.modal.classList.remove('active');
        this.modal.setAttribute('aria-hidden', 'true');
        // Resetea el formulario interno si existe
        const form = this.modal.querySelector('form');
        if (form) form.reset();
    }
}