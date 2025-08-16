// script-sb.js - SpinBook Main Application Script
// © José Lobos Sanhueza, Beraka Studio, 2025

document.addEventListener('DOMContentLoaded', function() {
    // --- CONFIGURACIÓN DEL ESTUDIO (Variable modificable) ---
    const STUDIO_CONFIG = {
        name: 'Nombre Estudio - SpinBook', //AGREGA NOMBRE DEL ESTUDIO/PRODUCTOR ANTES DEL GUION
        logo: 'icon.png', // AGREGA LA RUTA DEL LOGO/ICONO DEL ESTUDIO
        address: 'Dirección Estudio', // AGREGA LA DIRECCIÓN DEL ESTUDIO/PRODUCTOR
        contact: {
            email: 'nombre@direccion.mail', // AGREGA EL EMAIL DEL ESTUDIO/PRODUCTOR
            phone: '+56 0 1234 5678' // AGREGA EL TELÉFONO DEL ESTUDIO/PRODUCTOR
        }
    };

    // --- CONFIGURACIÓN DE NOTIFICACIONES TELEGRAM (MOVIDA AL BACKEND) ---
    // Ya no se almacenan datos sensibles en el frontend
    const TELEGRAM_CONFIG = {
        enabled: true, // Se puede mantener aquí para controlar si mostrar opciones de Telegram en el UI
    };

    // --- SERVICIOS DISPONIBLES ---
    const AVAILABLE_SERVICES = {
        'produccion': 'Producción Musical',
        'grabacion': 'Grabación de Voces/Instrumentos',
        'mixmastering': 'Mix/Mastering'
    };

    // --- FUNCIÓN PARA OBTENER VERSIÓN DESDE PACKAGE.JSON ---
    async function getAppVersion() {
        try {
            const response = await fetch('/package.json');
            const packageData = await response.json();
            return packageData.version || '1.0.2';
        } catch (error) {
            console.warn('Could not fetch version from package.json:', error);
            return '1.0.2'; // Fallback version
        }
    }

    // --- FUNCIÓN PARA INICIALIZAR ELEMENTOS DINÁMICOS ---
    async function initializeDynamicElements() {
        // Actualizar logo
        const logoElement = document.getElementById('studio-logo');
        if (logoElement) {
            logoElement.src = STUDIO_CONFIG.logo;
            logoElement.alt = `${STUDIO_CONFIG.name} Logo`;
        }

        // Actualizar título
        const titleElement = document.getElementById('studio-title');
        if (titleElement) {
            titleElement.textContent = STUDIO_CONFIG.name;
        }

        // Actualizar versión desde package.json
        const version = await getAppVersion();
        const versionElement = document.getElementById('app-version');
        if (versionElement) {
            versionElement.textContent = `Version ${version}`;
        }
    }

    // --- STATE MANAGEMENT ---
    let currentDate = new Date();
    let selectedDate = null;
    let selectedSlots = [];
    let selectedServices = []; // NUEVO: Array de servicios seleccionados
    let showObservations = false; // NUEVO: Toggle para observaciones
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
    
    // Elementos de servicios
    const servicesContainer = document.getElementById('services-container');
    const serviceCards = document.querySelectorAll('.service-card');
    const serviceCheckboxes = document.querySelectorAll('.service-checkbox');
    
    const bookingFormContainer = document.getElementById('booking-form-container');
    const bookingForm = document.getElementById('booking-form');
    const messageArea = document.getElementById('message-area');
    const submitButton = document.getElementById('submit-booking');

    // Elementos de observaciones
    const toggleObservations = document.getElementById('toggle-observations');
    const observationsField = document.getElementById('observations-field');
    const observationsTextarea = document.getElementById('observations');

    // Modal elements
    const successModal = document.getElementById('success-modal');
    const downloadPdfBtn = document.getElementById('download-pdf');

    const availableHours = [17, 18, 19, 20, 21];

    // --- UTILITY FUNCTIONS ---
    // Formatear fecha correctamente evitando problemas de timezone
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

    // Crear objeto Date correcto desde string YYYY-MM-DD
    function createDateFromString(dateString) {
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        return new Date(year, month - 1, day); // mes es 0-indexed en JavaScript
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
        selectedServices = []; // Reset servicios
        renderCalendar();
        
        // Ocultar pasos posteriores
        servicesContainer.classList.add('hidden');
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
            currentBusySlots = [...busySlots];
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
            servicesContainer.classList.remove('hidden');
            // Reset servicios al cambiar horarios
            selectedServices = [];
            updateServiceSelection();
            checkFormCompletion();
        } else {
            servicesContainer.classList.add('hidden');
            bookingFormContainer.classList.add('hidden');
        }
    }

    // --- NUEVA LÓGICA DE SERVICIOS ---
    function initializeServiceSelection() {
        // Agregar event listeners a las tarjetas de servicios
        serviceCards.forEach(card => {
            const checkbox = card.querySelector('.service-checkbox');
            const serviceValue = checkbox.value;

            // Click en la tarjeta o checkbox
            card.addEventListener('click', (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                }
                toggleServiceSelection(serviceValue, checkbox.checked);
            });

            checkbox.addEventListener('change', (e) => {
                toggleServiceSelection(serviceValue, e.target.checked);
            });
        });
    }

    function toggleServiceSelection(serviceValue, isSelected) {
        const index = selectedServices.indexOf(serviceValue);
        
        if (isSelected && index === -1) {
            selectedServices.push(serviceValue);
        } else if (!isSelected && index > -1) {
            selectedServices.splice(index, 1);
        }

        updateServiceSelection();
        checkFormCompletion();
    }

    function updateServiceSelection() {
        serviceCards.forEach(card => {
            const checkbox = card.querySelector('.service-checkbox');
            const serviceValue = checkbox.value;
            const isSelected = selectedServices.includes(serviceValue);

            // Actualizar estado visual de la tarjeta
            if (isSelected) {
                card.classList.remove('border-gray-600', 'hover:border-yellow-400');
                card.classList.add('border-yellow-400', 'bg-yellow-400/10');
                checkbox.checked = true;
            } else {
                card.classList.remove('border-yellow-400', 'bg-yellow-400/10');
                card.classList.add('border-gray-600', 'hover:border-yellow-400');
                checkbox.checked = false;
            }
        });
    }

    function checkFormCompletion() {
        if (selectedServices.length > 0) {
            bookingFormContainer.classList.remove('hidden');
        } else {
            bookingFormContainer.classList.add('hidden');
        }
    }

    // --- NUEVA LÓGICA DE OBSERVACIONES ---
    function initializeObservationsToggle() {
        const toggleContainer = document.getElementById('observations-toggle-container');
        const toggleSwitch = toggleContainer.querySelector('.toggle-switch');
        const toggleDot = toggleSwitch.querySelector('.toggle-dot');

        // Función para alternar el estado
        function toggleObservationsState() {
            showObservations = !showObservations;
            toggleObservations.checked = showObservations;
            
            if (showObservations) {
                // Mostrar campo de observaciones
                observationsField.classList.remove('hidden');
                setTimeout(() => {
                    observationsField.classList.remove('opacity-0');
                    observationsField.classList.add('opacity-100');
                }, 10);
                
                // Animar toggle switch
                toggleSwitch.classList.remove('bg-gray-600');
                toggleSwitch.classList.add('bg-yellow-500');
                toggleDot.classList.add('translate-x-6');
                
                // Focus en textarea
                setTimeout(() => observationsTextarea.focus(), 300);
            } else {
                // Ocultar campo de observaciones
                observationsField.classList.remove('opacity-100');
                observationsField.classList.add('opacity-0');
                setTimeout(() => {
                    observationsField.classList.add('hidden');
                }, 300);
                
                // Animar toggle switch
                toggleSwitch.classList.remove('bg-yellow-500');
                toggleSwitch.classList.add('bg-gray-600');
                toggleDot.classList.remove('translate-x-6');
                
                // Limpiar textarea
                observationsTextarea.value = '';
            }
        }

        // Event listener para el contenedor completo (incluye tanto el switch como el texto)
        toggleContainer.addEventListener('click', (e) => {
            e.preventDefault();
            toggleObservationsState();
        });

        // Event listener específico para el checkbox (por si se accede programáticamente)
        toggleObservations.addEventListener('change', (e) => {
            // Solo actuar si el cambio no vino del click del contenedor
            if (e.isTrusted && showObservations !== e.target.checked) {
                toggleObservationsState();
            }
        });
    }
    
    // --- BOOKING LOGIC ---
    async function handleBookingSubmit(event) {
        event.preventDefault();
        
        if (selectedSlots.length === 0) {
            displayMessage('Por favor, selecciona al menos un horario.', 'error');
            return;
        }

        if (selectedServices.length === 0) {
            displayMessage('Por favor, selecciona al menos un servicio.', 'error');
            return;
        }

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const observations = showObservations ? observationsTextarea.value.trim() : '';

        const bookingData = {
            date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
            slots: selectedSlots,
            services: selectedServices,
            userData: { 
                name, 
                email, 
                phone,
                observations
            }
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
            // Almacenar la fecha correctamente sin problemas de timezone
            lastBookingData = {
                userData: bookingData.userData,
                date: bookingData.date, // Mantenemos el formato YYYY-MM-DD
                selectedDateObject: selectedDate, // Agregamos el objeto Date original para referencia
                slots: selectedSlots,
                services: selectedServices, // Almacenar servicios para PDF
                eventId: result.event.id, // Usar el ID consistente del backend
                createdAt: new Date()
            };
            
            // La notificación de Telegram ahora se envía desde el backend
            console.log('✅ Booking created successfully. Telegram notification sent from backend.');
            
            // Show success modal instead of message
            showSuccessModal();
            
            // Reset form and state
            bookingForm.reset();
            bookingFormContainer.classList.add('hidden');
            servicesContainer.classList.add('hidden');
            selectedSlots = [];
            selectedServices = [];
            showObservations = false;
            
            // Reset observaciones toggle
            toggleObservations.checked = false;
            observationsField.classList.add('hidden', 'opacity-0');
            const toggleSwitch = toggleObservations.parentElement.querySelector('.toggle-switch');
            const toggleDot = toggleSwitch.querySelector('.toggle-dot');
            toggleSwitch.classList.remove('bg-yellow-500');
            toggleSwitch.classList.add('bg-gray-600');
            toggleDot.classList.remove('translate-x-6');
            
            updateServiceSelection();

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

        const { userData, date, slots, services, eventId } = lastBookingData;
        
        // Populate modal data
        document.getElementById('modal-name').textContent = userData.name;
        document.getElementById('modal-email').textContent = userData.email;
        document.getElementById('modal-phone').textContent = userData.phone;
        
        // Usar la función que formatea correctamente la fecha
        document.getElementById('modal-date').textContent = formatDateCorrectly(date);
        
        document.getElementById('modal-time').textContent = slots.map(h => `${h}:00-${h+1}:00`).join(', ');
        
        // Mostrar servicios seleccionados
        const serviceNames = services.map(service => AVAILABLE_SERVICES[service]).join(', ');
        document.getElementById('modal-services').textContent = serviceNames;
        
        // Mostrar observaciones si existen
        const observationsContainer = document.getElementById('modal-observations-container');
        const observationsEl = document.getElementById('modal-observations');
        if (userData.observations && userData.observations.trim()) {
            observationsEl.textContent = userData.observations;
            observationsContainer.classList.remove('hidden');
        } else {
            observationsContainer.classList.add('hidden');
        }
        
        // Mostrar el ID consistente (sin substring ya que ahora es SB-XXXXXXXX)
        document.getElementById('modal-id').textContent = eventId;
        
        // Agregar dirección del estudio en el modal
        document.getElementById('modal-address').textContent = STUDIO_CONFIG.address;
        
        // Show modal
        successModal.classList.remove('hidden');
        successModal.classList.add('flex');
    }

    function hideSuccessModal() {
        successModal.classList.add('hidden');
        successModal.classList.remove('flex');
        
        // Refrescar horarios después de cerrar el modal
        refreshBookingState();
    }

    // --- REFRESH BOOKING STATE ---
    async function refreshBookingState() {
        if (selectedDate) {
            // Refresh the selected date to show new busy slots
            await selectDate(selectedDate);
        }
        
        // Refresh the calendar to update fully booked days
        renderCalendar();
    }

    // --- FUNCIÓN PARA VERIFICAR SI jsPDF ESTÁ DISPONIBLE ---
    function checkJsPDFAvailability() {
        // Diferentes formas en que jsPDF puede estar disponible
        if (typeof window.jsPDF !== 'undefined') {
            return window.jsPDF;
        }
        if (typeof jsPDF !== 'undefined') {
            return jsPDF;
        }
        if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
            return window.jspdf.jsPDF;
        }
        // Para la versión UMD
        if (typeof window.jspdf !== 'undefined') {
            return window.jspdf;
        }
        return null;
    }

    // --- FUNCIÓN ALTERNATIVA PARA CARGAR jsPDF DINÁMICAMENTE ---
    function loadJsPDFDynamically() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js';
            script.onload = () => {
                console.log('jsPDF loaded dynamically');
                resolve(checkJsPDFAvailability());
            };
            script.onerror = () => reject(new Error('Failed to load jsPDF'));
            document.head.appendChild(script);
        });
    }

    // --- PDF GENERATION ---
    async function generatePDF() {
        if (!lastBookingData) return;

        // Verificar disponibilidad de jsPDF con múltiples métodos
        let jsPDFConstructor = checkJsPDFAvailability();
        
        // Si no está disponible, intentar cargar dinámicamente
        if (!jsPDFConstructor) {
            try {
                displayMessage('Cargando generador de PDF...', 'info');
                jsPDFConstructor = await loadJsPDFDynamically();
            } catch (error) {
                console.error('Failed to load jsPDF dynamically:', error);
            }
        }
        
        if (!jsPDFConstructor) {
            console.error('jsPDF library is not available');
            displayMessage('Error: No se pudo cargar el generador de PDF. Por favor, recarga la página e inténtalo de nuevo.', 'error');
            return;
        }

        try {
            // Limpiar mensaje de carga
            messageArea.innerHTML = '';
            
            // Usar el constructor encontrado
            const doc = new jsPDFConstructor();
            
            const { userData, date, slots, services, eventId, createdAt } = lastBookingData;

            // Colors (SpinBook theme)
            const yellow = [250, 204, 21]; // #facc15
            const black = [0, 0, 0];
            const gray = [107, 114, 128]; // #6B7280

            // Header background (reducido de 45 a 35)
            doc.setFillColor(...yellow);
            doc.rect(0, 0, 210, 35, 'F');

            // Add logo/icon in top left corner (ajustado para header más pequeño)
            try {
                // Create an image element to load the icon
                const img = new Image();
                img.onload = function() {
                    // Add the image to PDF once loaded (reducido tamaño: 25x25)
                    doc.addImage(img, 'PNG', 15, 5, 25, 25); // x, y, width, height
                    
                    // Continue with the rest of the PDF generation
                    completePDFGeneration();
                };
                img.onerror = function() {
                    // If image fails to load, continue without icon
                    console.warn('Could not load icon.png, continuing without logo');
                    completePDFGeneration();
                };
                img.src = STUDIO_CONFIG.logo;
            } catch (error) {
                console.warn('Error loading icon:', error);
                completePDFGeneration();
            }

            function completePDFGeneration() {
                // Title (ajustado para header más pequeño)
                doc.setTextColor(...black);
                doc.setFontSize(26); // Reducido de 30 a 26
                doc.setFont('helvetica', 'bold');
                doc.text('SpinBook', 105, 20, { align: 'center' }); // Ajustado Y
                
                doc.setFontSize(12); // Reducido de 14 a 12
                doc.setFont('helvetica', 'bold');
                doc.text('Ticket de Reserva', 105, 30, { align: 'center' }); // Ajustado Y

                // Reset text color
                doc.setTextColor(...black);

                // Confirmation title (más cerca del header)
                doc.setFontSize(16); // Reducido de 18 a 16
                doc.setFont('helvetica', 'bold');
                doc.text('CONFIRMACIÓN DE RESERVA', 105, 50, { align: 'center' }); // Reducido Y de 65 a 50

                // Calculate box height dynamically based on content (más compacto)
                let baseHeight = 85; // Reducido de 110 a 85
                // Add extra height if observations exist
                if (userData.observations && userData.observations.trim()) {
                    const observationsLines = Math.ceil(userData.observations.length / 60); // Más caracteres por línea
                    baseHeight += observationsLines * 8; // Reducido espacio por línea de observaciones
                }

                // Booking details box with dynamic height (posición más alta)
                doc.setFillColor(248, 249, 250); // Light gray
                doc.rect(15, 58, 180, baseHeight, 'F'); // Y reducido de 75 a 58
                doc.setDrawColor(...gray);
                doc.rect(15, 58, 180, baseHeight, 'S');

                // Details (interlineado más compacto)
                const startY = 70; // Reducido de 90 a 70
                const lineHeight = 8; // Reducido de 12 a 8
                let currentY = startY;

                // Usar la función que formatea correctamente la fecha
                const formattedDate = formatDateCorrectly(date);

                const timeSlots = slots.map(hour => `${hour}:00-${hour+1}:00`).join(', ');
                
                // Formatear servicios para PDF
                const serviceNames = services.map(service => AVAILABLE_SERVICES[service]).join(', ');

                const details = [
                    { label: 'Cliente:', value: userData.name },
                    { label: 'Email:', value: userData.email },
                    { label: 'Teléfono:', value: userData.phone },
                    { label: 'Fecha:', value: formattedDate },
                    { label: 'Horario:', value: timeSlots },
                    { label: 'Servicios:', value: serviceNames }, // NUEVO: Servicios en PDF
                    { label: 'Ubicación:', value: STUDIO_CONFIG.address }, 
                    { label: 'ID de Reserva:', value: eventId }
                ];

                // NUEVO: Agregar observaciones si existen
                if (userData.observations && userData.observations.trim()) {
                    details.push({ label: 'Observaciones:', value: userData.observations });
                }

                doc.setFontSize(10); // Reducido de 11 a 10
                details.forEach(detail => {
                    doc.setFont('helvetica', 'bold');
                    doc.text(detail.label, 20, currentY);
                    doc.setFont('helvetica', 'normal');
                    
                    // Manejo de texto largo para campos que pueden ser extensos
                    if ((detail.label === 'Ubicación:' || detail.label === 'Servicios:' || detail.label === 'Observaciones:') && detail.value.length > 50) {
                        const lines = doc.splitTextToSize(detail.value, 120);
                        doc.text(lines, 55, currentY); // Ajustado X para más espacio
                        currentY += (lines.length - 1) * lineHeight; // Ajustar altura para múltiples líneas
                    } else {
                        doc.text(detail.value, 55, currentY); // Ajustado X
                    }
                    
                    currentY += lineHeight;
                });

                // Instructions (más cerca del contenido anterior)
                currentY += 12; // Reducido de 20 a 12
                
                // Ensure instructions start below the box but más compacto
                const minInstructionsY = 58 + baseHeight + 15; // Reducido margin de 25 a 15
                if (currentY < minInstructionsY) {
                    currentY = minInstructionsY;
                }
                
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11); // Reducido de 12 a 11
                doc.text('INSTRUCCIONES IMPORTANTES:', 20, currentY);

                currentY += 10; // Reducido de 15 a 10
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9); // Reducido de 10 a 9

                // Instrucciones actualizadas con dirección
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
                    if (instruction.length > 70) { // Aumentado de 60 a 70
                        const lines = doc.splitTextToSize(instruction, 170);
                        lines.forEach(line => {
                            doc.text(line, 20, currentY);
                            currentY += 6; // Reducido de 8 a 6
                        });
                    } else {
                        doc.text(instruction, 20, currentY);
                        currentY += 6; // Reducido de 8 a 6
                    }
                });

                // Footer fijo en la parte inferior (compacto, una línea)
                const footerY = 277; // Posición fija cerca del final de la página
                
                doc.setFillColor(245, 245, 245);
                doc.rect(0, footerY, 210, 20, 'F'); // Altura reducida a 20
                doc.setTextColor(...gray);
                doc.setFontSize(8);
                
                // Todo el footer en una línea compacta
                const footerText = `Generado: ${createdAt.toLocaleString('es-ES')} | ${STUDIO_CONFIG.name} © 2025 - Sistema de Reservas Musicales`;
                doc.text(footerText, 105, footerY + 12, { align: 'center' });

                // Download PDF
                const filename = `SpinBook-Reserva-${eventId}.pdf`;
                doc.save(filename);
                
                // Cerrar modal y refrescar después de descargar
                hideSuccessModal();
            }

        } catch (error) {
            console.error('Error generating PDF:', error);
            displayMessage('Error al generar el PDF. Por favor, inténtalo de nuevo.', 'error');
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
    // Inicializar elementos dinámicos primero
    initializeDynamicElements().then(() => {
        renderCalendar();
        renderTimeSlots();
        
        // Inicializar lógica de servicios y observaciones
        initializeServiceSelection();
        initializeObservationsToggle();
        
        console.log('🎵 SpinBook initialized with secure Telegram notifications');
        console.log('Telegram notifications handled securely by backend ✅');
        console.log('🔧 Dynamic elements initialized:', {
            studioName: STUDIO_CONFIG.name,
            studioLogo: STUDIO_CONFIG.logo,
            studioAddress: STUDIO_CONFIG.address
        });
        console.log('🎯 New features initialized: Services selection & Observations toggle');
        
        // Verificar disponibilidad de jsPDF al inicializar
        const jsPDFConstructor = checkJsPDFAvailability();
        if (jsPDFConstructor) {
            console.log('✅ jsPDF library loaded successfully');
        } else {
            console.warn('⚠️ jsPDF library not found - PDF generation may not work');
        }
    });
});