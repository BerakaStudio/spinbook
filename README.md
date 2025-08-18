# SpinBook - Sistema de Reservas Musical
![Version](https://img.shields.io/badge/version-1.0.2-green.svg?style=flat-square)
[![License](https://img.shields.io/badge/license-AGPLv3-blue.svg?style=flat-square)](LICENSE)

SpinBook es una aplicación web para gestionar reservas de estudio de grabación musical. Utiliza Google Calendar como backend y incluye notificaciones automáticas por Telegram.

## ✨ Características

- 📅 **Calendario interactivo** con días disponibles y ocupados
- ⏰ **Gestión de horarios** configurables (17:00 - 21:00 por defecto)
- 🎵 **Selección de servicios** (Producción, Grabación, Mix/Mastering)
- 📋 **Comprobantes PDF** automáticos con información completa
- 🤖 **Notificaciones Telegram** seguras para nuevas reservas
- 📱 **Diseño responsive** para móviles y desktop
- 🛡️ **Prevención de conflictos** en tiempo real

## 🚀 Configuración Rápida

### 1. Google Calendar API
1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Habilitar Google Calendar API
3. Crear cuenta de servicio y generar clave JSON
4. Crear calendario y compartirlo con la cuenta de servicio

### 2. Variables de Entorno (Vercel)

**Obligatorias:**
```env
GOOGLE_CALENDAR_ID=tu_calendario_id@group.calendar.google.com
GOOGLE_CLIENT_EMAIL=spinbook@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
STUDIO_TIMEZONE=America/Santiago
```

**Opcionales:**
```env
# Información del Estudio
STUDIO_NAME=Mi Estudio - SpinBook
STUDIO_ADDRESS=Dirección completa
STUDIO_EMAIL=contacto@miestudio.com
STUDIO_PHONE=+56 9 1234 5678

# Notificaciones Telegram
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHI...
TELEGRAM_CHAT_ID=-1001234567890
```

### 3. Despliegue en Vercel
1. Subir proyecto a GitHub
2. Importar en Vercel
3. Configurar variables de entorno
4. ¡Listo!

## 🤖 Configuración de Telegram

### Obtener Chat ID
1. Crear bot con @BotFather
2. Enviar mensaje a tu bot
3. Visitar: `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Copiar el `chat.id` de la respuesta

### Para Grupos/Canales
- El Chat ID será negativo (ej: `-1001234567890`)
- Agregar el bot como administrador del grupo

## 🎨 Personalización

### Cambiar Horarios
```javascript
// En src/script-sb.js
const availableHours = [9, 10, 11, 14, 15, 16, 17, 18];
```

### Modificar Servicios
```javascript
// En src/script-sb.js
const AVAILABLE_SERVICES = {
    'produccion': 'Producción Musical',
    'grabacion': 'Grabación de Voces/Instrumentos',
    'mixmastering': 'Mix/Mastering',
    'nuevo_servicio': 'Mi Nuevo Servicio'  // Agregar aquí
};
```

### Personalizar Información del Estudio
Modifica las variables de entorno o directamente en `script-sb.js`:

```javascript
const STUDIO_CONFIG = {
    name: 'Mi Estudio Musical - SpinBook',
    logo: 'src/icon.png',
    address: 'Mi Dirección Completa',
    contact: {
        email: 'contacto@miestudio.com',
        phone: '+56 9 1234 5678'
    }
};
```

## 🗂️ Estructura del Proyecto

```
/
├── api/
│   ├── create-event.js   # Crear reservas + Telegram
│   ├── get-events.js     # Obtener horarios ocupados
│   └── _utils.js         # Utilidades Google API
├── src/
│   ├── script-sb.js      # Lógica principal
│   ├── styles.css        # Estilos personalizados
│   └── icon.png          # Logo/icono
├── index.html            # Interfaz de usuario
└── package.json          # Dependencias
```

## 🛠️ Tecnologías

- **Frontend**: HTML5, Tailwind CSS, JavaScript ES6+
- **Backend**: Node.js (Serverless Functions)
- **APIs**: Google Calendar API v3, Telegram Bot API
- **Despliegue**: Vercel
- **PDF**: jsPDF para comprobantes

## 🛡️ Solución de Problemas

### Errores Comunes

| Problema | Solución |
|----------|----------|
| Authentication failed | Verificar credenciales de Google |
| Calendar not found | Verificar `GOOGLE_CALENDAR_ID` |
| Horarios no se actualizan | Revisar timezone en `STUDIO_TIMEZONE` |
| Telegram no funciona | Verificar token y chat ID |

### Debugging
- Revisa los logs en **Functions** del dashboard de Vercel
- Verifica que el calendario esté compartido con la cuenta de servicio
- Asegúrate de que todas las variables de entorno estén configuradas

## 📋 Funcionalidades del PDF

Los comprobantes incluyen:
- ✅ Datos completos de la reserva
- 🏢 Dirección del estudio
- 📞 Información de contacto
- 🆔 ID único de reserva
- 🖼️ Logo del estudio
- 📱 Descarga automática

## 🔧 Desarrollo Local

```bash
# Instalar Vercel CLI
npm i -g vercel

# Clonar proyecto
git clone tu-repo-url
cd spinbook

# Desarrollo local
vercel dev --listen 3000
```

## 📊 Monitoreo

El sistema registra:
- ✅ Reservas exitosas
- ❌ Errores de configuración
- 🤖 Estado de notificaciones Telegram
- 🕐 Conflictos de horarios

---

**SpinBook** - Sistema de Reservas Musical  
Desarrollado con 💚 por [Beraka Studio](https://beraka.cl/) © 2025