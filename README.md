# SpinBook: App de Reservas de Estudio con Google Calendar

SpinBook es una aplicación web moderna y completa para gestionar reservas de un estudio de grabación musical. Utiliza la API de Google Calendar como backend para almacenar las reservas y está diseñada para ser desplegada fácilmente en Vercel.

## 📝 Ejemplo de Configuración Completa

### Variables de Entorno para Vercel

```env
# Configuración de Google Calendar API (OBLIGATORIAS)
GOOGLE_CALENDAR_ID=tu_calendario_id@group.calendar.google.com
GOOGLE_CLIENT_EMAIL=spinbook@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----
STUDIO_TIMEZONE=America/Santiago

# Configuración del Estudio (OPCIONALES - tienen valores por defecto)
STUDIO_NAME=SpinBook Studio
STUDIO_ADDRESS=Pasaje Las Hortensias 2703, Portal San Francisco, Temuco
STUDIO_EMAIL=info@spinbook.com
STUDIO_PHONE=+56 9 1234 5678
```

### Configuración Local para Desarrollo

Si quieres probar el proyecto localmente, crea un archivo `.env.local`:

```env
GOOGLE_CALENDAR_ID=tu_calendario_id@group.calendar.google.com
GOOGLE_CLIENT_EMAIL=spinbook@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
STUDIO_TIMEZONE=America/Santiago
STUDIO_NAME=Mi Estudio Local
STUDIO_ADDRESS=Mi Dirección Local 123, Mi Ciudad
STUDIO_EMAIL=contacto@miestudio.local
STUDIO_PHONE=+56 9 8765 4321
```

Luego ejecuta:
```bash
npm run dev
```

## 🎨 Personalización Avanzada

### Cambiar el Tema de Colores

Para personalizar completamente los colores, modifica las siguientes clases en `index.html` y `styles.css`:

```css
/* Colores principales */
.text-yellow-400 → .text-blue-400    /* Color primario */
.bg-yellow-500 → .bg-blue-500        /* Fondo primario */
.border-yellow-500 → .border-blue-500 /* Borde primario */

/* Estados de slots */
.border-green-600 → .border-purple-600  /* Disponible */
.bg-green-500 → .bg-purple-500          /* Disponible hover */
```

### Modificar Horarios de Trabajo

```javascript
// En script-sb.js, línea ~29
const availableHours = [9, 10, 11, 14, 15, 16, 17, 18]; // 9 AM a 6 PM
```

### Personalizar el PDF

```javascript
// En la función generatePDF(), puedes modificar:
const colors = {
    primary: [59, 130, 246],    // Azul
    secondary: [16, 185, 129],  // Verde
    accent: [245, 158, 11]      // Amarillo
};

// Cambiar el título
doc.text('Mi Estudio Musical', 105, 25, { align: 'center' });

// Agregar logo (requiere imagen en base64)
// doc.addImage(logoBase64, 'PNG', 15, 10, 30, 30);
```

## 🔄 Actualización del Sistema

### Migrar de Versión Anterior

Si ya tienes una versión anterior de SpinBook:

1. **Respalda tu configuración actual**
2. **Actualiza los archivos**:
   - Reemplaza `script-sb.js` con la nueva versión
   - Actualiza `index.html` con el nuevo modal
   - Actualiza `api/create-event.js` con la configuración del estudio
3. **Añade las nuevas variables de entorno** (opcionales):
   - `STUDIO_ADDRESS`
   - `STUDIO_NAME` 
   - `STUDIO_EMAIL`
   - `STUDIO_PHONE`
4. **Redespliega en Vercel**

### Verificar la Instalación

Después de desplegar, verifica que todo funcione:

1. ✅ El calendario se carga correctamente
2. ✅ Los slots se muestran según disponibilidad
3. ✅ Se puede hacer una reserva de prueba
4. ✅ El modal muestra la dirección del estudio
5. ✅ El PDF incluye la dirección
6. ✅ El evento en Google Calendar tiene toda la información

## 🚀 Optimización y Rendimiento

### Mejores Prácticas Implementadas

- **Caché de Slots**: Los horarios ocupados se cachean para evitar múltiples consultas
- **Validación Doble**: Frontend y backend validan para mejor experiencia
- **Estados de Carga**: Indicadores visuales durante operaciones
- **Manejo de Errores**: Recuperación automática de errores temporales
- **Responsive Design**: Optimizado para todos los dispositivos

### Monitoreo

Para monitorear el sistema en producción:

1. **Logs de Vercel**: Ve a tu proyecto en Vercel > Functions para ver logs
2. **Google Calendar**: Verifica que los eventos se crean correctamente
3. **Errores del Usuario**: Implementa Google Analytics para seguimiento

---

**SpinBook v2.1** - Sistema de Reservas Musical Profesional con Dirección Integrada  
Desarrollado con ❤️ para estudios de grabación modernos

### 📍 Nueva Característica: Dirección del Estudio

La versión incluye integración completa de la dirección del estudio:

- **Modal de Confirmación**: La dirección aparece en los detalles de la reserva
- **Ticket PDF**: Dirección completa incluida en las instrucciones
- **Google Calendar**: Ubicación añadida automáticamente al evento
- **Personalizable**: Configurable mediante variables de entorno
- **Formato Adaptable**: El sistema maneja automáticamente direcciones largas✨ Características Principales

- **📅 Calendario Interactivo**: Visualización clara de días disponibles y ocupados
- **⏰ Gestión de Horarios**: Sistema de slots horarios de 17:00 a 21:00
- **🔒 Prevención de Conflictos**: Verificación en tiempo real de disponibilidad
- **📋 Información Detallada**: Todos los datos del cliente se guardan en Google Calendar
- **📄 Comprobantes PDF**: Generación automática de tickets de reserva
- **🎯 Experiencia de Usuario**: Interfaz moderna con retroalimentación inmediata
- **📱 Diseño Responsive**: Funciona perfectamente en móviles y desktop
- **📍 Dirección del Estudio**: Información de ubicación integrada en reservas y PDF

## 🗂 Estructura del Proyecto

```
/
├── api/
│   ├── _utils.js         # Funciones compartidas de Google API
│   ├── create-event.js   # Endpoint para crear reservas (mejorado)
│   └── get-events.js     # Endpoint para obtener horarios ocupados (mejorado)
├── script-sb.js          # Lógica principal de la aplicación (separada del HTML)
├── index.html            # Interfaz de usuario principal (solo HTML/CSS)
├── package.json          # Dependencias del proyecto
├── .gitignore            # Archivos a ignorar por Git
└── README.md             # Documentación del proyecto
```

## 🚀 Mejoras Implementadas (Versión 2.1)

### 🏢 Configuración del Estudio Personalizable
- **Dirección Integrada**: Dirección del estudio incluida en modal y PDF
- **Variables de Entorno**: Configuración flexible para personalizar el estudio
- **Información Completa**: Dirección, nombre y contacto del estudio modificables

### 📄 Actualización Automática de Estado
- **Refrescado Inmediato**: Al confirmar una reserva, el calendario se actualiza automáticamente
- **Días Completos**: Si todos los slots de un día están reservados, se marca como "completamente reservado"
- **Sincronización**: Los horarios ocupados se reflejan instantáneamente en la interfaz

### 🛡️ Prevención Estricta de Conflictos
- **Verificación Doble**: Chequeo de disponibilidad antes de crear el evento
- **Slots Únicos**: Cada horario solo puede reservarse una vez (sin solapamientos)
- **Manejo de Errores**: Mensajes claros si un horario ya no está disponible

### 📊 Información Completa en Google Calendar
Los eventos creados en Google Calendar ahora incluyen:
- 👤 **Datos del Cliente**: Nombre, email y teléfono
- 📅 **Detalles de la Reserva**: Fecha, horarios e ID único
- 📍 **Ubicación del Estudio**: Dirección completa para llegar al lugar
- 📝 **Descripción Estructurada**: Información formateada y legible
- 🎨 **Identificación Visual**: Color amarillo para destacar reservas SpinBook
- ⏰ **Recordatorios**: Notificaciones automáticas 60 y 15 minutos antes
- 🏢 **Información del Estudio**: Nombre y dirección completa

### 🗂️ Arquitectura Mejorada
- **Separación de Responsabilidades**: JavaScript movido a `script-sb.js`
- **Código Modular**: Funciones organizadas y documentadas
- **Mantenibilidad**: Estructura más limpia y fácil de modificar
- **Configuración Centralizada**: Variables del estudio en una sola ubicación

### 📄 Generación Mejorada de PDF
- **Diseño Profesional**: Layout atractivo con branding SpinBook
- **Información Completa**: Todos los datos de la reserva incluidos
- **Dirección del Estudio**: Ubicación clara en el ticket
- **Instrucciones Detalladas**: Guías completas para el cliente
- **Descarga Automática**: Al cerrar el modal se actualiza el estado

## 📋 Configuración e Instalación

### Paso 1: Configurar Google Calendar API

1. **Crear un Proyecto en Google Cloud Console**
   - Ve a [Google Cloud Console](https://console.cloud.google.com)
   - Crea un nuevo proyecto o selecciona uno existente

2. **Habilitar Google Calendar API**
   - En el panel de APIs, busca "Google Calendar API"
   - Haz clic en "Habilitar"

3. **Crear Credenciales de Cuenta de Servicio**
   - Ve a "Credenciales" > "Crear credenciales" > "Cuenta de servicio"
   - Completa el formulario con nombre y descripción
   - Asigna el rol "Editor" o "Propietario"
   - Genera una clave JSON y descárgala

4. **Configurar el Calendario**
   - Crea un nuevo calendario en Google Calendar
   - Ve a "Configuración" del calendario
   - En "Compartir con personas específicas", añade el email de la cuenta de servicio
   - Asigna permisos de "Hacer cambios en eventos"
   - Copia el ID del calendario (formato: `xxxxx@group.calendar.google.com`)

### Paso 2: Preparar el Proyecto

1. **Clonar o Descargar**
   ```bash
   git clone [tu-repositorio]
   cd spinbook
   ```

2. **Instalar Dependencias**
   ```bash
   npm install
   ```

3. **Estructura de Archivos**
   Asegúrate de que tienes esta estructura:
   ```
   /tu-proyecto
   ├── api/
   │   ├── _utils.js
   │   ├── create-event.js
   │   └── get-events.js
   ├── script-sb.js
   ├── index.html
   ├── package.json
   └── README.md
   ```

### Paso 3: Desplegar en Vercel

1. **Subir a GitHub**
   - Crea un repositorio en GitHub
   - Sube todos los archivos del proyecto

2. **Crear Proyecto en Vercel**
   - Ve a [Vercel](https://vercel.com)
   - Conecta tu repositorio de GitHub
   - Importa el proyecto

3. **Configurar Variables de Entorno**
   En la sección "Settings" > "Environment Variables", añade:

   | Variable | Valor | Descripción |
   |----------|--------|-------------|
   | `GOOGLE_CALENDAR_ID` | `tu_calendario@group.calendar.google.com` | ID del calendario de Google |
   | `GOOGLE_CLIENT_EMAIL` | `tu-servicio@proyecto.iam.gserviceaccount.com` | Email de la cuenta de servicio |
   | `GOOGLE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...` | Clave privada completa (con \n) |
   | `STUDIO_TIMEZONE` | `America/Santiago` | Zona horaria del estudio |
   | `STUDIO_NAME` | `SpinBook Studio` | Nombre del estudio (opcional) |
   | `STUDIO_ADDRESS` | `Pasaje Las Hortensias 2703, Portal San Francisco, Temuco` | Dirección completa del estudio |
   | `STUDIO_EMAIL` | `info@spinbook.com` | Email de contacto (opcional) |
   | `STUDIO_PHONE` | `+56 9 1234 5678` | Teléfono de contacto (opcional) |

   **⚠️ Notas Importantes sobre Variables de Entorno:**
   - **GOOGLE_PRIVATE_KEY**: Copia toda la clave incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`
   - **Saltos de Línea**: Vercel maneja automáticamente los `\n`, no los reemplaces manualmente
   - **Zona Horaria**: Encuentra tu zona en la [Lista de Zonas Horarias IANA](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
   - **Variables Opcionales**: Si no se configuran, se usarán valores por defecto

4. **Desplegar**
   - Una vez configuradas las variables, Vercel desplegará automáticamente
   - Si hay problemas, ve a "Deployments" y haz clic en "Redeploy"

## 🔧 Configuración Avanzada

### Personalización de Horarios

Para cambiar los horarios disponibles, modifica el array `availableHours` en `script-sb.js`:

```javascript
const availableHours = [16, 17, 18, 19, 20, 21, 22]; // Ejemplo: 4 PM a 10 PM
```

### Personalización del Estudio

Para personalizar la información del estudio, modifica el objeto `STUDIO_CONFIG` en `script-sb.js`:

```javascript
const STUDIO_CONFIG = {
    name: 'Mi Estudio Musical',
    address: 'Mi Dirección Completa, Ciudad, País',
    contact: {
        email: 'contacto@miestudio.com',
        phone: '+56 9 8765 4321'
    }
};
```

**O mejor aún**, configura las variables de entorno en Vercel:
- `STUDIO_NAME`: Nombre de tu estudio
- `STUDIO_ADDRESS`: Dirección completa
- `STUDIO_EMAIL`: Email de contacto
- `STUDIO_PHONE`: Teléfono de contacto

### Personalización de Colores

Los colores del tema se pueden modificar en las clases de Tailwind en `index.html`:

- **Amarillo Primario**: `text-yellow-400`, `bg-yellow-500`
- **Fondo Oscuro**: `bg-black`, `bg-gray-900`
- **Acentos**: `text-green-500` (disponible), `text-red-300` (error)

### Personalización del PDF

Modifica la función `generatePDF()` en `script-sb.js` para cambiar:

- Información de contacto del estudio (usa `STUDIO_CONFIG`)
- Logo o imagen (usando `doc.addImage()`)
- Colores y fuentes
- Información adicional

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3 (Tailwind), JavaScript ES6+
- **Backend**: Node.js (Serverless Functions)
- **APIs**: Google Calendar API v3
- **Despliegue**: Vercel
- **Bibliotecas**:
  - `googleapis`: Integración con Google APIs
  - `jspdf`: Generación de PDFs
  - `tailwindcss`: Framework de estilos

## 📱 Funcionalidades Detalladas

### 📅 Sistema de Calendario

- **Navegación Mensual**: Botones para cambiar entre meses
- **Validación de Fechas**: Solo se pueden seleccionar días futuros y entre semana
- **Estados Visuales**:
  - 🟢 **Disponible**: Días con horarios libres
  - 🔴 **Ocupado Completo**: Todos los slots reservados
  - ⚫ **No Disponible**: Fines de semana y días pasados

### ⏰ Gestión de Slots

- **Horarios Fijos**: 17:00 a 21:00 (configurables)
- **Selección Multiple**: Posibilidad de reservar varios slots consecutivos
- **Verificación en Tiempo Real**: Chequeo instantáneo de disponibilidad
- **Feedback Visual**: Colores diferenciados según estado

### 📋 Proceso de Reserva

1. **Selección de Fecha**: Click en día disponible
2. **Elección de Horarios**: Selección de uno o más slots
3. **Datos del Cliente**: Formulario con validación
4. **Confirmación**: Verificación final y creación del evento
5. **Comprobante**: Modal de confirmación con opción de PDF

### 🏢 Información del Estudio

- **Modal de Confirmación**: Dirección visible en los detalles de la reserva
- **Ticket PDF**: Dirección completa incluida en el comprobante
- **Google Calendar**: Ubicación añadida al evento del calendario
- **Instrucciones**: Dirección incluida en las indicaciones para llegar

### 🔒 Seguridad y Validación

- **Validación Frontend**: Chequeos inmediatos en la interfaz
- **Validación Backend**: Verificación en el servidor antes de crear eventos
- **Prevención de Conflictos**: Sistema doble de verificación de disponibilidad
- **Manejo de Errores**: Mensajes claros y acciones de recuperación

## 🐛 Solución de Problemas

### Error: "Authentication failed"
- ✅ Verifica que `GOOGLE_CLIENT_EMAIL` y `GOOGLE_PRIVATE_KEY` estén correctos
- ✅ Asegúrate de que la cuenta de servicio tenga permisos en el calendario
- ✅ Revisa que el proyecto de Google Cloud tenga habilitada la Calendar API

### Error: "Calendar not found"
- ✅ Confirma que `GOOGLE_CALENDAR_ID` sea correcto
- ✅ Verifica que el calendario esté compartido con la cuenta de servicio
- ✅ Asegúrate de que el calendario no haya sido eliminado

### Los horarios no se actualizan
- ✅ Revisa la configuración de zona horaria (`STUDIO_TIMEZONE`)
- ✅ Verifica que los eventos se estén creando correctamente en Google Calendar
- ✅ Limpia el caché del navegador y recarga la página

### PDF no se genera
- ✅ Verifica que la biblioteca jsPDF esté cargando correctamente
- ✅ Revisa la consola del navegador para errores
- ✅ Asegúrate de que `lastBookingData` contenga la información correcta

### La dirección no aparece
- ✅ Verifica que `STUDIO_ADDRESS` esté configurada en las variables de entorno
- ✅ Revisa que el objeto `STUDIO_CONFIG` tenga la dirección correcta
- ✅ Comprueba que el modal tenga el elemento `modal-address`

## 📧 Soporte y Contribución

### 🤝 Contribuir al Proyecto

1. Fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

### 📧 Soporte

Para problemas específicos:
1. Revisa la sección de "Solución de Problemas"
2. Verifica los logs en la consola de Vercel
3. Crea un issue en GitHub con detalles del problema

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Puedes usarlo libremente para proyectos comerciales y personales.

## 

---

**SpinBook** - Sistema de Reservas Musical Profesional  
Desarrollado con ❤️ por Beraka Studio.