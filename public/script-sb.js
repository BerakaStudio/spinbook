// File: script-sb.js
// Main JavaScript functionality for SpinBook booking application

class SpinBookApp {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.selectedSlots = [];
        this.busySlots = [];
        this.isLoading = false;
        
        // Initialize the application
        this.init();
    }

    init() {
        console.log('Initializing SpinBook App...');
        this.setupEventListeners();
        this.renderCalendar();
        console.log('SpinBook App initialized successfully');
    }

    setupEventListeners() {
        // Calendar navigation
        document.getElementById('prev-month').addEventListener('click', () => this.previousMonth());
        document.getElementById('next-month').addEventListener('click', () => this.nextMonth());
        
        // Form submission
        document.getElementById('booking-form').addEventListener('submit', (e) => this.handleBookingSubmit(e));
        
        // Modal controls
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('download-pdf').addEventListener('click', () => this.downloadPDF());
        
        // Close modal when clicking outside
        document.getElementById('success-modal').addEventListener('click', (e) => {
            if (e.target.id === 'success-modal') {
                this.closeModal();
            }
        });
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    renderCalendar() {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        
        // Update month/year header
        document.getElementById('month-year').textContent = 
            `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        
        const calendarGrid = document.getElementById('calendar-grid');
        calendarGrid.innerHTML = '';
        
        // Add day headers
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'text-xs font-semibold text-gray-500 p-2';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });
        
        // Get first day of month and number of days
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const today = new Date();
        
        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'p-2';
            calendarGrid.appendChild(emptyCell);
        }
        
        // Add days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayCell = document.createElement('div');
            const cellDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const dateString = this.formatDate(cellDate);
            
            dayCell.className = 'p-2 text-center cursor-pointer rounded hover:bg-gray-700 transition-colors';
            dayCell.textContent = day;
            
            // Disable past dates
            if (cellDate < today.setHours(0, 0, 0, 0)) {
                dayCell.className += ' text-gray-600 cursor-not-allowed';
            } else {
                dayCell.addEventListener('click', () => this.selectDate(dateString, dayCell));
            }
            
            // Highlight selected date
            if (this.selectedDate === dateString) {
                dayCell.className += ' bg-yellow-500 text-black font-bold';
            }
            
            calendarGrid.appendChild(dayCell);
        }
    }

    async selectDate(dateString, dayCell) {
        console.log('Date selected:', dateString);
        
        // Remove previous selection
        document.querySelectorAll('#calendar-grid > div').forEach(cell => {
            cell.classList.remove('bg-yellow-500', 'text-black', 'font-bold');
        });
        
        // Highlight new selection
        dayCell.classList.add('bg-yellow-500', 'text-black', 'font-bold');
        
        this.selectedDate = dateString;
        this.selectedSlots = [];
        
        // Update selected date info
        const dateInfo = document.getElementById('selected-date-info');
        const formattedDate = new Date(dateString).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        dateInfo.textContent = `Fecha seleccionada: ${formattedDate}`;
        
        // Load time slots for this date
        await this.loadTimeSlots(dateString);
    }

    async loadTimeSlots(dateString) {
        console.log('Loading time slots for:', dateString);
        
        const slotsContainer = document.getElementById('time-slots');
        const loader = document.getElementById('slots-loader');
        
        // Show loader
        slotsContainer.innerHTML = '';
        loader.classList.remove('hidden');
        loader.classList.add('flex');
        
        try {
            // Fetch busy slots from API
            const response = await fetch(`/api/get-events?date=${dateString}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.busySlots = await response.json();
            console.log('Busy slots received:', this.busySlots);
            
            // Hide loader
            loader.classList.add('hidden');
            loader.classList.remove('flex');
            
            // Generate time slots (9 AM to 9 PM)
            this.generateTimeSlots(slotsContainer);
            
        } catch (error) {
            console.error('Error loading time slots:', error);
            loader.classList.add('hidden');
            loader.classList.remove('flex');
            
            slotsContainer.innerHTML = `
                <div class="col-span-full text-center text-red-400 p-4">
                    <p>Error al cargar los horarios disponibles.</p>
                    <button onclick="window.location.reload()" class="text-yellow-400 underline mt-2">
                        Intentar de nuevo
                    </button>
                </div>
            `;
        }
    }

    generateTimeSlots(container) {
        // Business hours: 9 AM to 9 PM (21:00)
        const startHour = 9;
        const endHour = 21;
        
        for (let hour = startHour; hour < endHour; hour++) {
            const timeSlot = document.createElement('button');
            const timeString = `${hour.toString().padStart(2, '0')}:00`;
            const endTimeString = `${(hour + 1).toString().padStart(2, '0')}:00`;
            
            timeSlot.className = 'p-3 text-sm font-medium rounded-lg border transition-all duration-200';
            timeSlot.textContent = `${timeString} - ${endTimeString}`;
            
            // Check if this slot is busy
            if (this.busySlots.includes(hour)) {
                timeSlot.className += ' border-red-500 bg-red-900/20 text-red-300 cursor-not-allowed';
                timeSlot.disabled = true;
                timeSlot.innerHTML += ' <span class="text-xs block">Ocupado</span>';
            } else {
                timeSlot.className += ' border-gray-600 bg-gray-800 hover:bg-gray-700 hover:border-yellow-400';
                timeSlot.addEventListener('click', () => this.toggleTimeSlot(hour, timeSlot));
            }
            
            container.appendChild(timeSlot);
        }
    }

    toggleTimeSlot(hour, slotElement) {
        const index = this.selectedSlots.indexOf(hour);
        
        if (index > -1) {
            // Remove slot
            this.selectedSlots.splice(index, 1);
            slotElement.classList.remove('bg-yellow-500', 'text-black', 'border-yellow-400');
            slotElement.classList.add('border-gray-600', 'bg-gray-800');
        } else {
            // Add slot
            this.selectedSlots.push(hour);
            slotElement.classList.remove('border-gray-600', 'bg-gray-800');
            slotElement.classList.add('bg-yellow-500', 'text-black', 'border-yellow-400');
        }
        
        // Show/hide booking form
        if (this.selectedSlots.length > 0) {
            document.getElementById('booking-form-container').classList.remove('hidden');
        } else {
            document.getElementById('booking-form-container').classList.add('hidden');
        }
        
        console.log('Selected slots:', this.selectedSlots);
    }

    async handleBookingSubmit(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        const submitBtn = document.getElementById('submit-booking');
        const originalText = submitBtn.textContent;
        
        // Get form data
        const userData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim()
        };
        
        // Validation
        if (!userData.name || !userData.email || !userData.phone) {
            this.showMessage('Por favor, completa todos los campos.', 'error');
            return;
        }
        
        if (this.selectedSlots.length === 0) {
            this.showMessage('Por favor, selecciona al menos un horario.', 'error');
            return;
        }
        
        // Show loading state
        this.isLoading = true;
        submitBtn.textContent = 'Procesando...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/create-event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: this.selectedDate,
                    slots: this.selectedSlots,
                    userData: userData
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                console.log('Booking created successfully:', result);
                this.showSuccessModal(userData, result.event);
                this.resetForm();
                
                // Refresh the time slots to show new busy periods
                await this.loadTimeSlots(this.selectedDate);
            } else {
                throw new Error(result.message || 'Error al procesar la reserva');
            }
            
        } catch (error) {
            console.error('Booking error:', error);
            this.showMessage(error.message || 'Error al procesar la reserva. Inténtalo de nuevo.', 'error');
        } finally {
            // Reset loading state
            this.isLoading = false;
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    showSuccessModal(userData, eventData) {
        const modal = document.getElementById('success-modal');
        
        // Populate modal with booking details
        document.getElementById('modal-name').textContent = userData.name;
        document.getElementById('modal-email').textContent = userData.email;
        document.getElementById('modal-phone').textContent = userData.phone;
        
        const formattedDate = new Date(this.selectedDate).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('modal-date').textContent = formattedDate;
        
        const sortedSlots = [...this.selectedSlots].sort((a, b) => a - b);
        const timeRange = `${sortedSlots[0].toString().padStart(2, '0')}:00 - ${(sortedSlots[sortedSlots.length - 1] + 1).toString().padStart(2, '0')}:00`;
        document.getElementById('modal-time').textContent = timeRange;
        
        document.getElementById('modal-id').textContent = eventData?.id || 'N/A';
        
        // Store data for PDF generation
        this.currentBookingData = {
            userData,
            date: formattedDate,
            time: timeRange,
            slots: sortedSlots,
            eventId: eventData?.id || 'N/A'
        };
        
        // Show modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    closeModal() {
        const modal = document.getElementById('success-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        
        // Reset selections and reload calendar
        this.selectedSlots = [];
        this.selectedDate = null;
        document.getElementById('selected-date-info').textContent = '';
        document.getElementById('time-slots').innerHTML = '';
        document.getElementById('booking-form-container').classList.add('hidden');
        
        // Re-render calendar to refresh any changes
        this.renderCalendar();
    }

    downloadPDF() {
        if (!this.currentBookingData) {
            console.error('No booking data available for PDF');
            return;
        }
        
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Set colors and fonts
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.setTextColor(255, 193, 7); // Yellow color
            
            // Title
            doc.text('SpinBook - Confirmación de Reserva', 105, 30, { align: 'center' });
            
            // Reset to normal font
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            
            // Booking details
            const details = [
                `Cliente: ${this.currentBookingData.userData.name}`,
                `Email: ${this.currentBookingData.userData.email}`,
                `Teléfono: ${this.currentBookingData.userData.phone}`,
                `Fecha: ${this.currentBookingData.date}`,
                `Horario: ${this.currentBookingData.time}`,
                `ID de Reserva: ${this.currentBookingData.eventId}`,
                '',
                'Detalles del Servicio:',
                '• Sesión de grabación/producción musical',
                '• Estudio profesional equipado',
                '• Incluye ingeniería básica',
                '',
                'Términos y Condiciones:',
                '• Llegar 10 minutos antes de la hora reservada',
                '• Cancelaciones con 24h de anticipación',
                '• No se permiten reembolsos por inasistencias',
                '',
                `Generado el: ${new Date().toLocaleString('es-ES')}`
            ];
            
            let yPosition = 50;
            details.forEach(line => {
                if (line.startsWith('Cliente:') || line.startsWith('Detalles del Servicio:') || line.startsWith('Términos y Condiciones:')) {
                    doc.setFont('helvetica', 'bold');
                } else {
                    doc.setFont('helvetica', 'normal');
                }
                
                doc.text(line, 20, yPosition);
                yPosition += 8;
            });
            
            // Add footer
            doc.setFontSize(10);
            doc.setTextColor(128, 128, 128);
            doc.text('SpinBook - Sistema de Reservas de Estudio', 105, 280, { align: 'center' });
            
            // Save the PDF
            const fileName = `SpinBook_Reserva_${this.currentBookingData.userData.name.replace(/\s+/g, '_')}_${this.selectedDate}.pdf`;
            doc.save(fileName);
            
            console.log('PDF generated successfully');
            
            // Close modal after download
            this.closeModal();
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.showMessage('Error al generar el PDF. Inténtalo de nuevo.', 'error');
        }
    }

    resetForm() {
        document.getElementById('booking-form').reset();
        this.selectedSlots = [];
        document.getElementById('booking-form-container').classList.add('hidden');
    }

    showMessage(message, type = 'info') {
        const messageArea = document.getElementById('message-area');
        const className = type === 'error' ? 'text-red-400' : type === 'success' ? 'text-green-400' : 'text-yellow-400';
        
        messageArea.innerHTML = `<p class="${className} font-medium">${message}</p>`;
        
        // Clear message after 5 seconds
        setTimeout(() => {
            messageArea.innerHTML = '';
        }, 5000);
    }

    formatDate(date) {
        return date.getFullYear() + '-' + 
               String(date.getMonth() + 1).padStart(2, '0') + '-' + 
               String(date.getDate()).padStart(2, '0');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.spinBookApp = new SpinBookApp();
    
    // Add CSS for loader animation
    const style = document.createElement('style');
    style.textContent = `
        .loader {
            border-top-color: #f59e0b;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .modal-backdrop {
            background-color: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(4px);
        }
        
        .modal-content {
            animation: modalSlideIn 0.3s ease-out;
        }
        
        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: translateY(-20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
    `;
    document.head.appendChild(style);
});