import { store } from '../core/store.js';

export class Dashboard {
    constructor() {
        this.totalClientesEl = document.getElementById('totalClientesCount');
        this.chartCrecimiento = null;
        this.chartPipeline = null;
        this.chartCanales = null;
        this.initListeners();
    }

    initListeners() {
        window.addEventListener('stateChange', (e) => {
            if (e.detail.property === 'clients') {
                this.updateMetrics(e.detail.value);
                this.renderLineChart(e.detail.value);
                this.renderDoughnutChart(e.detail.value);
                this.renderBarChart(e.detail.value);
            }
        });
    }

    updateMetrics(clients) {
        if (!this.totalClientesEl) return;
        this.totalClientesEl.classList.remove('skeleton');
        this.totalClientesEl.removeAttribute('aria-busy');
        this.totalClientesEl.textContent = clients.length;
    }

    // 1. EL GRÁFICO DE CRECIMIENTO (FUTURISTA)
    renderLineChart(clients) {
        const ctx = document.getElementById('graficoCrecimiento');
        if (!ctx) return;

        const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const labelsMeses = [];
        const conteoPorMes = [];
        
        const hoy = new Date();
        for (let i = 11; i >= 0; i--) { 
            const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
            labelsMeses.push(mesesNombres[d.getMonth()]);
            conteoPorMes.push({ yearMonth: `${d.getFullYear()}-${d.getMonth()}`, nuevos: 0 });
        }

        let clientesAcumulados = 0;
        const fechaLimite = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);

        clients.forEach(client => {
            const fechaCreacion = client.creado_en ? new Date(client.creado_en) : new Date(); 
            if (fechaCreacion < fechaLimite) clientesAcumulados++;
            else {
                const key = `${fechaCreacion.getFullYear()}-${fechaCreacion.getMonth()}`;
                const mesIndex = conteoPorMes.findIndex(m => m.yearMonth === key);
                if (mesIndex !== -1) conteoPorMes[mesIndex].nuevos++;
            }
        });

        const dataCrecimiento = [];
        conteoPorMes.forEach(mes => {
            clientesAcumulados += mes.nuevos;
            dataCrecimiento.push(clientesAcumulados);
        });

        // MAGIA VISUAL: Gradientes Neón
        const context = ctx.getContext('2d');
        
        // Relleno debajo de la curva (De azul eléctrico a transparente)
        const gradientFill = context.createLinearGradient(0, 0, 0, 300);
        gradientFill.addColorStop(0, 'rgba(85, 56, 248, 0.4)'); // Cyan brillante
        gradientFill.addColorStop(1, 'rgba(99, 102, 241, 0.0)'); // Indigo transparente

        if (this.chartCrecimiento) this.chartCrecimiento.destroy();

        this.chartCrecimiento = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labelsMeses,
                datasets: [{
                    label: 'Total de Clientes',
                    data: dataCrecimiento,
                    borderColor: '#6366f1', // Cyan Eléctrico
                    borderWidth: 4, // Línea más gruesa y contundente
                    backgroundColor: gradientFill,
                    fill: true, 
                    tension: 0.4, 
                    pointBackgroundColor: '#0f172a', // Fondo oscuro en los puntos
                    pointBorderColor: '#8c8efc', // Borde brillante
                    pointBorderWidth: 3,
                    pointRadius: 5, // Puntos más grandes
                    pointHoverRadius: 8, // Efecto de expansión al pasar el mouse
                    pointHoverBackgroundColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', // Glassmorphism oscuro
                        titleFont: { size: 13, family: 'Inter', weight: '600' },
                        bodyFont: { size: 14, weight: 'bold', family: 'Inter' },
                        padding: 14,
                        displayColors: false,
                        cornerRadius: 12,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        callbacks: { label: (context) => `${context.raw} Clientes en total` }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(226, 232, 240, 0.6)', drawBorder: false, borderDash: [5, 5] }, // Líneas punteadas elegantes
                        ticks: { font: { family: 'Inter', size: 11, weight: '500' }, color: '#94a3b8', padding: 10 }
                    },
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { font: { family: 'Inter', size: 12, weight: '500' }, color: '#94a3b8', padding: 10 }
                    }
                },
                interaction: { intersect: false, mode: 'index' },
            }
        });
    }

 // 2. GRÁFICO DE DONA (PIPELINE ESTILO APPLE / VERCEL - ULTRA PREMIUM)
    renderDoughnutChart(clients) {
        const ctx = document.getElementById('graficoPipeline');
        if (!ctx) return;

        const conteo = { nuevo: 0, contactado: 0, negociacion: 0, cerrado: 0 };
        clients.forEach(c => {
            if (conteo[c.estado] !== undefined) conteo[c.estado]++;
            else conteo.nuevo++;
        });

        const totalLeads = conteo.nuevo + conteo.contactado + conteo.negociacion + conteo.cerrado;

        // 1. MAGIA VISUAL: Crear Gradientes para cada gajo
        const context = ctx.getContext('2d');
        
        const gradNuevo = context.createLinearGradient(0, 0, 0, 200);
        gradNuevo.addColorStop(0, '#94a3b8'); // Slate
        gradNuevo.addColorStop(1, '#cbd5e1');
        
        const gradContactado = context.createLinearGradient(0, 0, 0, 200);
        gradContactado.addColorStop(0, '#3b82f6'); // Blue
        gradContactado.addColorStop(1, '#8b5cf6'); // Violet
        
        const gradNegociacion = context.createLinearGradient(0, 0, 0, 200);
        gradNegociacion.addColorStop(0, '#f43f5e'); // Rose Neón
        gradNegociacion.addColorStop(1, '#fb923c'); // Orange
        
        const gradCerrado = context.createLinearGradient(0, 0, 0, 200);
        gradCerrado.addColorStop(0, '#10b981'); // Emerald
        gradCerrado.addColorStop(1, '#06b6d4'); // Cyan

        if (this.chartPipeline) this.chartPipeline.destroy();

        // 2. PLUGIN PERSONALIZADO: Texto en el centro de la Dona
        const centerTextPlugin = {
            id: 'centerText',
            beforeDraw: function(chart) {
                const width = chart.width;
                const height = chart.height;
                const ctx = chart.ctx;

                ctx.restore();
                
                // Texto Principal (Número)
                const fontSize = (height / 100).toFixed(2);
                ctx.font = `bold ${fontSize}em Inter`;
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#1e293b"; // Color oscuro premium
                
                const text = totalLeads.toString();
                const textX = Math.round((width - ctx.measureText(text).width) / 2);
                const textY = height / 2.1;
                ctx.fillText(text, textX, textY);

                // Texto Secundario ("Leads")
                ctx.font = `600 ${(fontSize / 3.5).toFixed(2)}em Inter`;
                ctx.fillStyle = "#64748b";
                const subText = "LEADS";
                const subTextX = Math.round((width - ctx.measureText(subText).width) / 2);
                ctx.fillText(subText, subTextX, textY + (fontSize * 14));
                
                ctx.save();
            }
        };

        // 3. RENDERIZADO DEL GRÁFICO
        this.chartPipeline = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Nuevos', 'Contactados', 'Negociación', 'Cerrados'],
                datasets: [{
                    data: [conteo.nuevo, conteo.contactado, conteo.negociacion, conteo.cerrado],
                    backgroundColor: [gradNuevo, gradContactado, gradNegociacion, gradCerrado],
                    borderWidth: 0,
                    borderRadius: 20, // Borde ultra redondeado estilo cápsula
                    spacing: 8, // Separación amplia
                    hoverOffset: 12 // Expansión dramática al pasar el mouse
                }]
            },
            plugins: [centerTextPlugin], // Inyectamos el plugin del centro aquí
            options: {
                responsive: true, 
                maintainAspectRatio: false,
                cutout: '82%', // Hueco gigante para que parezcan anillos de luz
                // ANIMACIÓN PREMIUM: "Sweep & Expand" sin cortes
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 2000, 
                    easing: 'easeOutExpo', // La curva de aceleración más premium
                },
                
                plugins: {
                    legend: { 
                        position: 'bottom', 
                        labels: { 
                            usePointStyle: true, 
                            padding: 25, 
                            font: { family: 'Inter', size: 12, weight: '600' }, 
                            color: '#475569' 
                        } 
                    },
                    tooltip: { 
                        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                        cornerRadius: 12, 
                        padding: 16, 
                        titleFont: { family: 'Inter', size: 13, weight: '600', color: '#cbd5e1' }, 
                        bodyFont: { family: 'Inter', size: 15, weight: 'bold' },
                        boxPadding: 6,
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                        borderWidth: 1
                    }
                }
            }
        });
    }

    // 3. GRÁFICO DE BARRAS (ORÍGENES TIPO STRIPE)
// 3. GRÁFICO DE BARRAS (ORÍGENES TIPO STRIPE / LINEAR - ULTRA PREMIUM)
    renderBarChart(clients) {
        const ctx = document.getElementById('graficoCanales');
        if (!ctx) return;

        const conteo = { whatsapp: 0, instagram: 0, web: 0, referido: 0, otro: 0 };
        clients.forEach(c => {
            const origen = c.origen ? c.origen.toLowerCase() : 'otro';
            if (conteo[origen] !== undefined) conteo[origen]++;
            else conteo.otro++;
        });

        // 1. MAGIA VISUAL: Gradientes de Aceleración Horizontal
        const context = ctx.getContext('2d');
        
        // Función para crear gradientes de izquierda (0) a derecha (400px aprox)
        const createGradient = (colorStart, colorEnd) => {
            const grad = context.createLinearGradient(0, 0, 400, 0);
            grad.addColorStop(0, colorStart); // Semitransparente en la base
            grad.addColorStop(1, colorEnd);   // Sólido neón en la punta
            return grad;
        };

        const gradWA  = createGradient('rgba(16, 185, 129, 0.2)', '#10b981'); // Emerald (WhatsApp)
        const gradIG  = createGradient('rgba(236, 72, 153, 0.2)', '#ec4899'); // Pink (Instagram)
        const gradWeb = createGradient('rgba(99, 102, 241, 0.2)', '#6366f1'); // Indigo (Web)
        const gradRef = createGradient('rgba(245, 158, 11, 0.2)', '#f59e0b'); // Amber (Referido)
        const gradOtro = createGradient('rgba(148, 163, 184, 0.2)', '#94a3b8'); // Slate (Otro)

        if (this.chartCanales) this.chartCanales.destroy();

        // 2. RENDERIZADO DEL GRÁFICO
        this.chartCanales = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['WhatsApp', 'Instagram', 'Web', 'Referido', 'Otro'],
                datasets: [{
                    label: 'Leads Capturados',
                    data: [conteo.whatsapp, conteo.instagram, conteo.web, conteo.referido, conteo.otro],
                    backgroundColor: [gradWA, gradIG, gradWeb, gradRef, gradOtro],
                    
                    // Colores sólidos ultra brillantes al pasar el mouse (Hover)
                    hoverBackgroundColor: ['#34d399', '#f472b6', '#818cf8', '#fbbf24', '#cbd5e1'], 
                    
                    borderRadius: 50, // Píldoras perfectas (estilo cápsula)
                    borderSkipped: false, // Redondea la base y la punta
                    barThickness: 16,
                    
                    // Efecto de cristal en los bordes
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)' 
                }]
            },
            options: {
                indexAxis: 'y', 
                responsive: true, 
                maintainAspectRatio: false,
                
                // ANIMACIÓN PREMIUM: Deslizamiento Exponencial
                animation: {
                    x: {
                        duration: 1500,
                        easing: 'easeOutExpo', // Curva rápida al inicio, frenado microscópico al final
                        from: 0, 
                        delay: (context) => context.dataIndex * 150 // Cascada súper fluida (150ms)
                    },
                    y: {
                        duration: 1000,
                        easing: 'easeOutExpo'
                    }
                },
                
                // INTERACCIÓN Y TOOLTIPS
               interaction: {
                    mode: 'nearest', // Solo interactúa con el elemento más cercano
                    axis: 'y',       // Respeta el movimiento horizontal
                    intersect: true  // OBLIGA a que el mouse esté tocando la barra
                },
                // Hacemos que la transición de color sea un poco más suave
                hover: {
                    animationDuration: 400
                },
                plugins: { 
                    legend: { display: false },
                    tooltip: { 
                        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                        cornerRadius: 12, 
                        padding: 16,
                        titleFont: { family: 'Inter', size: 13, weight: '600', color: '#cbd5e1' }, 
                        bodyFont: { family: 'Inter', size: 15, weight: 'bold' },
                        boxPadding: 6,
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                        borderWidth: 1
                    }
                },
                
                // ESTILIZACIÓN DE LA GRILLA (Invisible y Limpia)
                scales: {
                    x: { 
                        beginAtZero: true, 
                        grid: { 
                            color: 'rgba(226, 232, 240, 0.5)', 
                            drawBorder: false, 
                            borderDash: [5, 5] // Punteado elegante
                        }, 
                        ticks: { 
                            font: { family: 'Inter', size: 11, weight: '500' }, 
                            color: '#94a3b8',
                            padding: 10
                        } 
                    },
                    y: { 
                        grid: { display: false, drawBorder: false }, 
                        ticks: { 
                            font: { family: 'Inter', size: 12, weight: '600' }, 
                            color: '#475569',
                            padding: 12
                        } 
                    }
                }
            }
        });
    }
}