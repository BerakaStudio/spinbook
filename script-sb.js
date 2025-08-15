// script-sb.js - SpinBook Main Application Script
// © José Lobos Sanhueza, Beraka Studio, 2025

document.addEventListener('DOMContentLoaded', function() {
    // --- CONFIGURACIÓN DEL ESTUDIO (Variable modificable) ---
    const STUDIO_CONFIG = {
        name: 'DJ SDC Producciones - SpinBook', //AGREGA NOMBRE DEL ESTUDIO/PRODUCTOR ANTES DEL GUION
        address: 'Pasaje Las Hortensias 2703, Portal San Francisco, Temuco', // AGREGA LA DIRECCIÓN DEL ESTUDIO/PRODUCTOR
        contact: {
            email: 'djsdcblak@gmail.com', // AGREGA EL EMAIL DEL ESTUDIO/PRODUCTOR
            phone: '+56 9 4271 3685' // AGREGA EL TELÉFONO DEL ESTUDIO/PRODUCTOR
        }
    };

    // --- CONFIGURACIÓN DE NOTIFICACIONES TELEGRAM ---
    const TELEGRAM_CONFIG = {
        enabled: true, // Cambiar a false para desactivar notificaciones
        botToken: '8139850560:AAEtMWZx8maY_rgSHdpb-XfTcITGKobaHg4', // Reemplazar con tu token de BotFather
        chatId: '1033500550', // Reemplazar con tu Chat ID
        // Opcional: Configuración adicional
        silent: false, // true = notificación silenciosa
        parseMode: 'Markdown' // 'Markdown' o 'HTML'
    };

    // --- STATE MANAGEMENT ---
    let currentDate = new Date();
    let selectedDate = null;
    let selectedSlots = [];
    let lastBookingData = null; // Para el PDF
    let currentBusySlots = []; // Cache de slots ocupados para la fecha actual

    // --- DOM ELEMENTS ---
    const monthYearEl = document.getElementById('month-year');
    const calendarGridEl = document.getElementById('calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const slotsContainer = document.getElementById('slots-container');
    const selectedDateInfoEl = document.getElementById('selected-date-info');
    const timeSlotsEl = document.getElementById('time-slots');
    const slotsLoaderEl = document.getElementById('slots-loader');
    const bookingFormContainer = document.getElementById('booking-form-container');
    const bookingForm = document.getElementById('booking-form');
    const messageArea = document.getElementById('message-area');
    const submitButton = document.getElementById('submit-booking');

    // Modal elements
    const successModal = document.getElementById('success-modal');
    const modalClose = document.getElementById('modal-close');
    const downloadPdfBtn = document.getElementById('download-pdf');

    const availableHours = [17, 18, 19, 20, 21];

    // --- UTILITY FUNCTIONS ---
    // NUEVA FUNCIÓN: Formatear fecha correctamente evitando problemas de timezone
    function formatDateCorrectly(dateString) {
        // Parse manual para evitar problemas de timezone
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        const date = new Date(year, month - 1, day); // mes es 0-indexed en JavaScript
        
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // NUEVA FUNCIÓN: Crear objeto Date correcto desde string YYYY-MM-DD
    function createDateFromString(dateString) {
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        return new Date(year, month - 1, day); // mes es 0-indexed en JavaScript
    }

    // --- NUEVA FUNCIÓN: NOTIFICACIÓN TELEGRAM ---
    async function sendTelegramNotification(bookingData) {
        // Verificar si las notificaciones están habilitadas
        if (!TELEGRAM_CONFIG.enabled || !TELEGRAM_CONFIG.botToken || !TELEGRAM_CONFIG.chatId) {
            console.log('Telegram notifications disabled or not configured');
            return;
        }

        // Verificar configuración básica
        if (TELEGRAM_CONFIG.botToken === 'TU_BOT_TOKEN_AQUI' || TELEGRAM_CONFIG.chatId === 'TU_CHAT_ID_AQUI') {
            console.warn('Telegram configuration incomplete. Please update TELEGRAM_CONFIG with your bot token and chat ID.');
            return;
        }

        try {
            const { userData, date, slots, eventId } = bookingData;
            const formattedDate = formatDateCorrectly(date);
            const timeSlots = slots.map(hour => `${hour}:00-${hour+1}:00`).join(', ');
            const currentTime = new Date().toLocaleString('es-ES');

            // Crear mensaje con formato Markdown
            const message = `🎵 *NUEVA RESERVA SPINBOOK* 🎵

📋 *DETALLES DE LA RESERVA:*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Cliente:* ${userData.name}
📧 *Email:* ${userData.email}
📱 *Teléfono:* ${userData.phone}

📅 *Fecha:* ${formattedDate}
⏰ *Horario:* ${timeSlots}

📍 *Ubicación:* ${STUDIO_CONFIG.address}

🎯 *ID Reserva:* \`${eventId.substring(0, 12).toUpperCase()}\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ *Reserva generada:* ${currentTime}
🏢 *Estudio:* ${STUDIO_CONFIG.name}

✅ *La reserva ha sido confirmada en Google Calendar*`;

            const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;
            
            const payload = {
                chat_id: TELEGRAM_CONFIG.chatId,
                text: message,
                parse_mode: TELEGRAM_CONFIG.parseMode,
                disable_notification: TELEGRAM_CONFIG.silent
            };

            console.log('Sending Telegram notification...');
            
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Telegram notification sent successfully:', result.result.message_id);
            } else {
                const errorData = await response.json();
                console.error('❌ Telegram notification failed:', errorData);
                
                // Mostrar error específico si es problema de configuración
                if (errorData.error_code === 400) {
                    console.error('Bad Request - Check your bot token and chat ID');
                } else if (errorData.error_code === 401) {
                    console.error('Unauthorized - Invalid bot token');
                } else if (errorData.error_code === 403) {
                    console.error('Forbidden - Bot was blocked by user or chat not found');
                }
            }

        } catch (error) {
            console.error('Error sending Telegram notification:', error);
            // No interferir con el flujo principal aunque falle la notificación
        }
    }

    // --- NUEVA FUNCIÓN: TEST DE CONFIGURACIÓN TELEGRAM ---
    async function testTelegramConfiguration() {
        if (!TELEGRAM_CONFIG.enabled || TELEGRAM_CONFIG.botToken === 'TU_BOT_TOKEN_AQUI') {
            console.log('Telegram not configured, skipping test');
            return;
        }

        try {
            const testMessage = `🧪 *TEST SPINBOOK*

Este es un mensaje de prueba del sistema de notificaciones.

✅ La configuración de Telegram está funcionando correctamente.

⚙️ *Configuración:*
• Bot Token: ${TELEGRAM_CONFIG.botToken.substring(0, 10)}...
• Chat ID: ${TELEGRAM_CONFIG.chatId}
• Parse Mode: ${TELEGRAM_CONFIG.parseMode}

🏢 ${STUDIO_CONFIG.name}
📍 ${STUDIO_CONFIG.address}

⏱️ ${new Date().toLocaleString('es-ES')}`;

            const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_CONFIG.botToken}/sendMessage`;
            
            const response = await fetch(telegramApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CONFIG.chatId,
                    text: testMessage,
                    parse_mode: 'Markdown'
                })
            });

            if (response.ok) {
                console.log('✅ Telegram test message sent successfully');
            } else {
                const errorData = await response.json();
                console.error('❌ Telegram test failed:', errorData);
            }

        } catch (error) {
            console.error('Error testing Telegram configuration:', error);
        }
    }

    // --- CALENDAR LOGIC ---
    function renderCalendar() {
        calendarGridEl.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        
        monthYearEl.textContent = `${currentDate.toLocaleString('es-ES', { month: 'long' })} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Day headers
        ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'font-bold text-yellow-500 text-sm';
            dayEl.textContent = day;
            calendarGridEl.appendChild(dayEl);
        });

        // Empty cells for first day
        let dayOfWeek = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
        for (let i = 0; i < dayOfWeek; i++) {
            calendarGridEl.appendChild(document.createElement('div'));
        }

        // Calendar days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            const dayDate = new Date(year, month, day);
            const dayOfWeekNumber = dayDate.getDay();

            dayEl.textContent = day;
            dayEl.className = 'calendar-day p-2 rounded-full cursor-pointer transition-colors';
            
            const isPast = dayDate < today;
            const isWeekend = dayOfWeekNumber === 0 || dayOfWeekNumber === 6;

            if (isPast || isWeekend) {
                dayEl.classList.add('disabled', 'text-gray-600', 'cursor-not-allowed');
            } else {
                // Check if fully booked (will be updated after loading slots)
                dayEl.addEventListener('click', () => selectDate(dayDate));
            }

            if (selectedDate && dayDate.getTime() === selectedDate.getTime()) {
                dayEl.classList.add('bg-yellow-500', 'text-black', 'font-bold');
            }
            
            calendarGridEl.appendChild(dayEl);
        }

        // Load busy slots for all available days to show which are fully booked
        loadBusySlotsForMonth(year, month);
    }

    // --- LOAD BUSY SLOTS FOR MONTH ---
    async function loadBusySlotsForMonth(year, month) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            const dayOfWeekNumber = dayDate.getDay();
            
            // Skip past days and weekends
            if (dayDate < today || dayOfWeekNumber === 0 || dayOfWeekNumber === 6) {
                continue;
            }

            try {
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const response = await fetch(`/api/get-events?date=${dateString}`);
                
                if (response.ok) {
                    const busySlots = await response.json();
                    
                    // Check if all available hours are booked
                    const fullyBooked = availableHours.every(hour => busySlots.includes(hour));
                    
                    if (fullyBooked) {
                        // Find the day element and mark as fully booked
                        const dayElements = calendarGridEl.querySelectorAll('.calendar-day');
                        dayElements.forEach(el => {
                            if (el.textContent == day && !el.classList.contains('disabled')) {
                                el.classList.add('fully-booked');
                                el.style.pointerEvents = 'none';
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading slots for day', day, ':', error);
            }
        }
    }

    // --- DATE & TIME SLOT LOGIC ---
    async function selectDate(date) {
        selectedDate = date;
        selectedSlots = [];
        renderCalendar();
        bookingFormContainer.classList.add('hidden');
        
        selectedDateInfoEl.textContent = `Horarios para el ${date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
        timeSlotsEl.innerHTML = '';
        slotsLoaderEl.style.display = 'flex';

        try {
            const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const response = await fetch(`/api/get-events?date=${dateString}`);
            
            if (!response.ok) {
                throw new Error('No se pudieron cargar los horarios.');
            }
            
            const busySlots = await response.json();
            currentBusySlots = [...busySlots]; // Cache the current busy slots
            renderTimeSlots(busySlots);

        } catch (error) {
            console.error('Error fetching slots:', error);
            displayMessage('Error al cargar horarios. Inténtalo de nuevo.', 'error');
        } finally {
            slotsLoaderEl.style.display = 'none';
        }
    }

    function renderTimeSlots(busySlots = []) {
        timeSlotsEl.innerHTML = '';
        if (!selectedDate) {
            const placeholder = document.createElement('p');
            placeholder.textContent = 'Selecciona una fecha para ver los horarios disponibles.';
            placeholder.className = 'text-gray-500 col-span-2 sm:col-span-3';
            timeSlotsEl.appendChild(placeholder);
            return;
        }

        availableHours.forEach(hour => {
            const slotEl = document.createElement('div');
            const isBusy = busySlots.includes(hour);
            
            slotEl.textContent = `${hour}:00 - ${hour + 1}:00`;
            slotEl.className = 'time-slot p-3 rounded-lg text-center font-semibold border-2 transition-transform';

            if (isBusy) {
                slotEl.classList.add('disabled', 'border-gray-600');
            } else {
                slotEl.classList.add('available', 'cursor-pointer', 'border-green-600');
                slotEl.dataset.hour = hour;
                slotEl.addEventListener('click', () => toggleSlotSelection(hour));
            }

            if (selectedSlots.includes(hour)) {
                slotEl.classList.remove('available', 'border-green-600');
                slotEl.classList.add('selected', 'border-yellow-300');
            }
            
            timeSlotsEl.appendChild(slotEl);
        });
    }

    function toggleSlotSelection(hour) {
        const index = selectedSlots.indexOf(hour);
        if (index > -1) {
            selectedSlots.splice(index, 1);
        } else {
            selectedSlots.push(hour);
        }
        selectedSlots.sort((a, b) => a - b);
        
        // Re-render slots to update colors
        renderTimeSlots(currentBusySlots);
        
        if (selectedSlots.length > 0) {
            bookingFormContainer.classList.remove('hidden');
        } else {
            bookingFormContainer.classList.add('hidden');
        }
    }
    
    // --- BOOKING LOGIC ---
    async function handleBookingSubmit(event) {
        event.preventDefault();
        if (selectedSlots.length === 0) {
            displayMessage('Por favor, selecciona al menos un horario.', 'error');
            return;
        }

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;

        const bookingData = {
            date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
            slots: selectedSlots,
            userData: { name, email, phone }
        };
        
        setLoadingState(true);

        try {
            const response = await fetch('/api/create-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ocurrió un error en la reserva.');
            }
            
            const result = await response.json();
            
            // Store booking data for PDF generation
            // CORRECCIÓN: Almacenar la fecha correctamente sin problemas de timezone
            lastBookingData = {
                userData: bookingData.userData,
                date: bookingData.date, // Mantenemos el formato YYYY-MM-DD
                selectedDateObject: selectedDate, // Agregamos el objeto Date original para referencia
                slots: selectedSlots,
                eventId: result.event.id,
                createdAt: new Date()
            };
            
            // NUEVA FUNCIONALIDAD: Enviar notificación a Telegram
            console.log('Sending Telegram notification...');
            await sendTelegramNotification({
                userData: bookingData.userData,
                date: bookingData.date,
                slots: selectedSlots,
                eventId: result.event.id
            });
            
            // Show success modal instead of message
            showSuccessModal();
            
            // Reset form and state
            bookingForm.reset();
            bookingFormContainer.classList.add('hidden');
            selectedSlots = [];

        } catch (error) {
            console.error('Booking error:', error);
            displayMessage(error.message, 'error');
        } finally {
            setLoadingState(false);
        }
    }

    // --- MODAL FUNCTIONS ---
    function showSuccessModal() {
        if (!lastBookingData) return;

        const { userData, date, slots, eventId } = lastBookingData;
        
        // Populate modal data
        document.getElementById('modal-name').textContent = userData.name;
        document.getElementById('modal-email').textContent = userData.email;
        document.getElementById('modal-phone').textContent = userData.phone;
        
        // CORRECCIÓN: Usar la función que formatea correctamente la fecha
        document.getElementById('modal-date').textContent = formatDateCorrectly(date);
        
        document.getElementById('modal-time').textContent = slots.map(h => `${h}:00-${h+1}:00`).join(', ');
        document.getElementById('modal-id').textContent = eventId.substring(0, 12).toUpperCase();
        
        // MEJORA: Agregar dirección del estudio en el modal
        document.getElementById('modal-address').textContent = STUDIO_CONFIG.address;
        
        // Show modal
        successModal.classList.remove('hidden');
        successModal.classList.add('flex');
    }

    function hideSuccessModal() {
        successModal.classList.add('hidden');
        successModal.classList.remove('flex');
        
        // MEJORA: Refrescar horarios después de cerrar el modal
        refreshBookingState();
    }

    // --- NEW: REFRESH BOOKING STATE ---
    async function refreshBookingState() {
        if (selectedDate) {
            // Refresh the selected date to show new busy slots
            await selectDate(selectedDate);
        }
        
        // Refresh the calendar to update fully booked days
        renderCalendar();
    }

    // --- PDF GENERATION ---
    function generatePDF() {
        if (!lastBookingData) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const { userData, date, slots, eventId, createdAt } = lastBookingData;

        // Colors (SpinBook theme)
        const yellow = [250, 204, 21]; // #facc15
        const black = [0, 0, 0];
        const gray = [107, 114, 128]; // #6B7280

        // Header background
        doc.setFillColor(...yellow);
        doc.rect(0, 0, 210, 45, 'F');

        // Add logo/icon in top left corner
        try {
            // Create an image element to load the icon
            const img = new Image();
            img.onload = function() {
                // Add the image to PDF once loaded
                doc.addImage(img, 'PNG', 15, 8, 30, 30); // x, y, width, height
                
                // Continue with the rest of the PDF generation
                completePDFGeneration();
            };
            img.onerror = function() {
                // If image fails to load, continue without icon
                console.warn('Could not load icon.png, continuing without logo');
                completePDFGeneration();
            };
            img.src = 'icon.png';
        } catch (error) {
            console.warn('Error loading icon:', error);
            completePDFGeneration();
        }

        function completePDFGeneration() {
            // Title (moved slightly to the right to accommodate logo)
            doc.setTextColor(...black);
            doc.setFontSize(30);
            doc.setFont('helvetica', 'bold');
            doc.text('SpinBook', 125, 25, { align: 'center' });
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Ticket de Reserva', 125, 35, { align: 'center' });

            // Reset text color
            doc.setTextColor(...black);

            // Confirmation title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('CONFIRMACIÓN DE RESERVA', 105, 65, { align: 'center' });

            // Booking details box
            doc.setFillColor(248, 249, 250); // Light gray
            doc.rect(15, 75, 180, 90, 'F');
            doc.setDrawColor(...gray);
            doc.rect(15, 75, 180, 90, 'S');

            // Details
            const startY = 90;
            const lineHeight = 12;
            let currentY = startY;

            // CORRECCIÓN: Usar la función que formatea correctamente la fecha
            const formattedDate = formatDateCorrectly(date);

            const timeSlots = slots.map(hour => `${hour}:00-${hour+1}:00`).join(', ');

            const details = [
                { label: 'Cliente:', value: userData.name },
                { label: 'Email:', value: userData.email },
                { label: 'Teléfono:', value: userData.phone },
                { label: 'Fecha:', value: formattedDate },
                { label: 'Horario:', value: timeSlots },
                { label: 'Ubicación:', value: STUDIO_CONFIG.address }, // MEJORA: Dirección agregada
                { label: 'ID de Reserva:', value: eventId.substring(0, 12).toUpperCase() }
            ];

            doc.setFontSize(11);
            details.forEach(detail => {
                doc.setFont('helvetica', 'bold');
                doc.text(detail.label, 20, currentY);
                doc.setFont('helvetica', 'normal');
                
                // MEJORA: Manejo de texto largo para la dirección
                if (detail.label === 'Ubicación:' && detail.value.length > 40) {
                    const lines = doc.splitTextToSize(detail.value, 120);
                    doc.text(lines, 60, currentY);
                    currentY += (lines.length - 1) * lineHeight; // Ajustar altura para múltiples líneas
                } else {
                    doc.text(detail.value, 60, currentY);
                }
                
                currentY += lineHeight;
            });

            // Instructions
            currentY += 20;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('INSTRUCCIONES IMPORTANTES:', 20, currentY);

            currentY += 15;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);

            // MEJORA: Instrucciones actualizadas con dirección
            const instructions = [
                '• Llega 10 minutos antes de tu sesión',
                '• Presenta este ticket al llegar al estudio',
                `• Dirígete a: ${STUDIO_CONFIG.address}`,
                '• Para cancelar, avisa con 24 horas de anticipación',
                ...(STUDIO_CONFIG.contact.phone ? [`• Contacto: ${STUDIO_CONFIG.contact.phone}`] : []),
                `• Email: ${STUDIO_CONFIG.contact.email}`
            ];

            instructions.forEach(instruction => {
                // Manejar líneas largas
                if (instruction.length > 60) {
                    const lines = doc.splitTextToSize(instruction, 170);
                    lines.forEach(line => {
                        doc.text(line, 20, currentY);
                        currentY += 8;
                    });
                } else {
                    doc.text(instruction, 20, currentY);
                    currentY += 8;
                }
            });

            // Footer
            doc.setFillColor(245, 245, 245);
            doc.rect(0, 260, 210, 37, 'F');
            doc.setTextColor(...gray);
            doc.setFontSize(8);
            doc.text('Generado: ' + createdAt.toLocaleString('es-ES'), 105, 270, { align: 'center' });
            doc.text(`${STUDIO_CONFIG.name} © 2025 - Sistema de Reservas Musicales`, 105, 280, { align: 'center' });

            // Download PDF
            const filename = `SpinBook-Reserva-${eventId.substring(0, 8)}.pdf`;
            doc.save(filename);
            
            // MEJORA: Cerrar modal y refrescar después de descargar
            hideSuccessModal();
        }
    }

    // --- UI HELPERS ---
    function displayMessage(text, type = 'info') {
        messageArea.innerHTML = '';
        const p = document.createElement('p');
        p.textContent = text;
        p.className = `p-3 rounded-lg font-medium`;
        if (type === 'success') {
            p.className += ' bg-green-900 text-green-300';
        } else if (type === 'error') {
            p.className += ' bg-red-900 text-red-300';
        } else {
            p.className += ' bg-blue-900 text-blue-300';
        }
        messageArea.appendChild(p);
        setTimeout(() => messageArea.innerHTML = '', 5000);
    }

    function setLoadingState(isLoading) {
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.innerHTML = `<div class="flex items-center justify-center"><div class="loader h-5 w-5 rounded-full border-2 border-black border-t-transparent mr-2"></div>Procesando...</div>`;
        } else {
            submitButton.disabled = false;
            submitButton.textContent = 'Confirmar Reserva';
        }
    }

    // --- EVENT LISTENERS ---
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    bookingForm.addEventListener('submit', handleBookingSubmit);

    // Modal event listeners
    modalClose.addEventListener('click', hideSuccessModal);
    downloadPdfBtn.addEventListener('click', generatePDF);

    // Close modal when clicking outside
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) {
            hideSuccessModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !successModal.classList.contains('hidden')) {
            hideSuccessModal();
        }
    });

    // --- INITIALIZATION ---
    renderCalendar();
    renderTimeSlots();
    
    // NUEVA FUNCIONALIDAD: Test de configuración Telegram al cargar (opcional)
    // Descomenta la siguiente línea si quieres probar la configuración al cargar la página
    testTelegramConfiguration();
    
    console.log('🎵 SpinBook initialized with Telegram notifications');
    console.log('Telegram enabled:', TELEGRAM_CONFIG.enabled);
    if (TELEGRAM_CONFIG.enabled && TELEGRAM_CONFIG.botToken !== 'TU_BOT_TOKEN_AQUI') {
        console.log('Telegram bot configured ✅');
    } else {
        console.log('Telegram bot not configured - update TELEGRAM_CONFIG');
    }
});