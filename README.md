# SpinBook - Sistema de Reservas Musical

SpinBook es una aplicación web para gestionar reservas de estudio de grabación musical. Utiliza Google Calendar como backend, incluye notificaciones automáticas por Telegram y está optimizada para desplegarse en Vercel.

## ✨ Características Principales

- **📅 Calendario Interactivo**: Visualización clara de días disponibles
- **⏰ Gestión de Horarios**: Slots horarios configurables (17:00 - 21:00 por defecto)
- **🔒 Prevención de Conflictos**: Verificación en tiempo real de disponibilidad
- **📋 Información Completa**: Datos del cliente guardados en Google Calendar
- **📄 Comprobantes PDF**: Generación automática de tickets de reserva
- **🏢 Dirección Integrada**: Información de ubicación en reservas y PDFs
- **📱 Diseño Responsive**: Funciona perfectamente en móviles y desktop
- **🤖 Notificaciones Telegram**: Alertas automáticas y seguras de nuevas reservas
- **🛡️ Seguridad Mejorada**: Tokens sensibles manejados exclusivamente en el backend
- **🌍 Timezone Inteligente**: Manejo preciso de zonas horarias para evitar conflictos

## 🚀 Configuración Rápida

### 1. Google Calendar API

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Habilitar Google Calendar API
3. Crear cuenta de servicio y generar clave JSON
4. Crear calendario y compartirlo con la cuenta de servicio

### 2. Bot de Telegram (Opcional)

1. Buscar el bot @SpinBookBot
2. Iniciar chat con SpinBookBot
3. Obtener el Chat ID donde recibir notificaciones
4. Configurar las variables de Telegram en Vercel

### 3. Variables de Entorno (Vercel)

```env
# OBLIGATORIAS - Google Calendar
GOOGLE_CALENDAR_ID=tu_calendario_id@group.calendar.google.com
GOOGLE_CLIENT_EMAIL=spinbook@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
STUDIO_TIMEZONE=America/Santiago

# OPCIONALES - Información del Estudio
STUDIO_NAME=Nombre del Estudio - SpinBook
STUDIO_ADDRESS=Dirección
STUDIO_EMAIL=direccion de Email
STUDIO_PHONE=Teléfono con código de país

# OPCIONALES - Notificaciones Telegram
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyZ
TELEGRAM_CHAT_ID=-0001234567890
TELEGRAM_SILENT=false
TELEGRAM_PARSE_MODE=Markdown
```

### 4. Despliegue en Vercel

1. Subir proyecto a GitHub
2. Importar en Vercel
3. Configurar variables de entorno
4. Desplegar automáticamente

## 🤖 Configuración de Telegram

### Obtener Chat ID
**Para chat personal:**
1. Enviar mensaje a tu bot
2. Visitar: `https://api.telegram.org/bot<TU_TOKEN>/getUpdates`
3. Buscar el `chat.id` en la respuesta

### Variables de Telegram

| Variable | Descripción | Ejemplo | Requerido |
|----------|-------------|---------|-----------|
| `TELEGRAM_ENABLED` | Activar/desactivar notificaciones | `true` o `false` | No |
| `TELEGRAM_BOT_TOKEN` | Token del bot de Telegram | `1234567890:ABC...` | Sí* |
| `TELEGRAM_CHAT_ID` | ID del chat donde enviar mensajes | `-1001234567890` | Sí* |
| `TELEGRAM_SILENT` | Notificaciones silenciosas | `true` o `false` | No |
| `TELEGRAM_PARSE_MODE` | Formato del mensaje | `Markdown` o `HTML` | No |

*_Requerido solo si `TELEGRAM_ENABLED=true`_

## 🗂️ Estructura del Proyecto

```
/
├── api/
│   ├── _utils.js         # Funciones compartidas de Google API
│   ├── create-event.js   # Endpoint para crear reservas + Telegram
│   └── get-events.js     # Endpoint para obtener horarios ocupados
├── script-sb.js          # Lógica principal de la aplicación
├── index.html            # Interfaz de usuario
├── styles.css            # Estilos personalizados
├── package.json          # Dependencias
├── icon.png              # Icono para PDFs y favicon
└── README.md             # Documentación
```

## 🎨 Personalización

### Cambiar Horarios
```javascript
// En script-sb.js
const availableHours = [9, 10, 11, 14, 15, 16, 17, 18]; // 9 AM a 6 PM
```

### Modificar Colores del Tema
```css
/* En styles.css - cambiar colores principales */
.text-yellow-400 → .text-blue-400    /* Color primario */
.bg-yellow-500 → .bg-blue-500        /* Fondo primario */
```

### Personalizar Información del Estudio
Modifica las variables de entorno o la configuración en los archivos:

**En script-sb.js:**
```javascript
const STUDIO_CONFIG = {
    name: 'Mi Estudio Musical - SpinBook',
    address: 'Mi Dirección Completa, Ciudad, País',
    contact: {
        email: 'contacto@miestudio.com',
        phone: '+56 9 1234 5678'
    }
};
```

**En create-event.js:**
```javascript
const STUDIO_CONFIG = {
    name: process.env.STUDIO_NAME || 'Mi Estudio Musical - SpinBook',
    address: process.env.STUDIO_ADDRESS || 'Mi Dirección Completa, Ciudad, País',
    contact: {
        email: process.env.STUDIO_EMAIL || 'contacto@miestudio.com',
        phone: process.env.STUDIO_PHONE || '+56 9 1234 5678'
    }
};
```

### Personalizar Mensajes de Telegram
Modifica la función `sendTelegramNotification` en `create-event.js` para cambiar el formato del mensaje:

```javascript
const message = `🎵 *NUEVA RESERVA ${STUDIO_CONFIG.name.toUpperCase()}* 🎵

📋 *DETALLES DE LA RESERVA:*
// ... personaliza el mensaje aquí
`;
```

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3 (Tailwind), JavaScript ES6+
- **Backend**: Node.js (Serverless Functions)
- **APIs**: Google Calendar API v3, Telegram Bot API
- **Despliegue**: Vercel
- **Bibliotecas**: googleapis, jspdf, tailwindcss

## 🛡️ Solución de Problemas

### Authentication failed
- ✅ Verifica credenciales de Google (`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`)
- ✅ Confirma permisos de la cuenta de servicio en el calendario

### Calendar not found
- ✅ Verifica `GOOGLE_CALENDAR_ID` correcto
- ✅ Asegúrate de que el calendario esté compartido

### Los horarios no se actualizan
- ✅ Revisa configuración de zona horaria (`STUDIO_TIMEZONE`)
- ✅ Limpia caché del navegador

### La dirección no aparece
- ✅ Verifica variable `STUDIO_ADDRESS` en Vercel
- ✅ Revisa que `STUDIO_CONFIG` tenga la dirección correcta

### Telegram no funciona
- ✅ Verifica `TELEGRAM_BOT_TOKEN` (formato: `números:letras`)
- ✅ Confirma `TELEGRAM_CHAT_ID` correcto (puede ser negativo)
- ✅ Asegúrate de que `TELEGRAM_ENABLED=true`
- ✅ Revisa que el bot tenga permisos en el grupo/canal
- ✅ Verifica logs en Vercel Functions para errores específicos

### Errores Comunes de Telegram

| Error | Causa | Solución |
|-------|-------|----------|
| `Unauthorized` | Token inválido | Verificar `TELEGRAM_BOT_TOKEN` |
| `Forbidden` | Bot bloqueado | Desbloquear bot o verificar Chat ID |
| `Bad Request` | Chat ID inválido | Obtener Chat ID correctamente |

## 📄 Funcionalidades del PDF

El sistema genera comprobantes PDF con:
- 📝 Datos completos de la reserva
- 🏢 Dirección del estudio
- 📞 Información de contacto
- 🆔 ID único de reserva
- 🖼️ Logo/icono del estudio (icon.png)
- 📱 Descarga automática desde el modal

## 📱 Notificaciones Telegram

### Información Incluida
- 🎵 Identificación del estudio
- 👤 Datos del cliente (nombre, email, teléfono)
- 📅 Fecha y horario de la reserva
- 🏢 Dirección del estudio
- 🆔 ID único de la reserva
- ⏰ Timestamp de cuando se realizó la reserva

### Seguridad
- 🔒 Tokens manejados exclusivamente en el backend
- 🛡️ Variables sensibles no expuestas al frontend
- ✅ Validación de configuración antes de enviar
- 🔄 Sistema de respaldo: la reserva se confirma aunque Telegram falle


## 📊 Monitoreo y Logs

El sistema incluye logging detallado para:
- ✅ Eventos de reserva exitosos
- ❌ Errores de configuración
- 🤖 Estado de notificaciones Telegram
- 🌍 Validación de timezone
- 📅 Conflictos de horarios

Revisa los logs en la sección **Functions** de tu dashboard de Vercel.

---

**SpinBook** - Sistema de Reservas Musical con Notificaciones  
Desarrollado con 💚 por [Beraka Studio](https://beraka.cl/) © 2025