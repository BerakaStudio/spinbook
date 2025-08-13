# SpinBook - Sistema de Reservas Musical

SpinBook es una aplicación web moderna para gestionar reservas de estudio de grabación musical. Utiliza Google Calendar como backend y está optimizada para desplegarse en Vercel.

## ✨ Características Principales

- **📅 Calendario Interactivo**: Visualización clara de días disponibles
- **⏰ Gestión de Horarios**: Slots horarios configurables (17:00 - 21:00 por defecto)
- **🔒 Prevención de Conflictos**: Verificación en tiempo real de disponibilidad
- **📋 Información Completa**: Datos del cliente guardados en Google Calendar
- **📄 Comprobantes PDF**: Generación automática de tickets de reserva
- **🏢 Dirección Integrada**: Información de ubicación en reservas y PDFs
- **📱 Diseño Responsive**: Funciona perfectamente en móviles y desktop

## 🚀 Configuración Rápida

### 1. Google Calendar API

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Habilitar Google Calendar API
3. Crear cuenta de servicio y generar clave JSON
4. Crear calendario y compartirlo con la cuenta de servicio

### 2. Variables de Entorno (Vercel)

```env
# OBLIGATORIAS
GOOGLE_CALENDAR_ID=tu_calendario_id@group.calendar.google.com
GOOGLE_CLIENT_EMAIL=spinbook@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
STUDIO_TIMEZONE=America/Santiago

# OPCIONALES (valores por defecto incluidos)
STUDIO_NAME=SpinBook Studio
STUDIO_ADDRESS=Tu dirección completa
STUDIO_EMAIL=info@spinbook.com
STUDIO_PHONE=+56 9 1234 5678
```

### 3. Despliegue en Vercel

1. Subir proyecto a GitHub
2. Importar en Vercel
3. Configurar variables de entorno
4. Desplegar automáticamente

## 🗂️ Estructura del Proyecto

```
/
├── api/
│   ├── _utils.js         # Funciones compartidas de Google API
│   ├── create-event.js   # Endpoint para crear reservas
│   └── get-events.js     # Endpoint para obtener horarios ocupados
├── script-sb.js          # Lógica principal de la aplicación
├── index.html            # Interfaz de usuario
├── styles.css            # Estilos personalizados
├── package.json          # Dependencias
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
Usa las variables de entorno o modifica `STUDIO_CONFIG` en `script-sb.js`:
```javascript
const STUDIO_CONFIG = {
    name: 'Mi Estudio Musical',
    address: 'Mi Dirección Completa, Ciudad',
    contact: {
        email: 'contacto@miestudio.com',
        phone: '+56 9 8765 4321'
    }
};
```

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3 (Tailwind), JavaScript ES6+
- **Backend**: Node.js (Serverless Functions)
- **APIs**: Google Calendar API v3
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

## 📄 Funcionalidades del PDF

El sistema genera comprobantes PDF con:
- 📝 Datos completos de la reserva
- 🏢 Dirección del estudio
- 📞 Información de contacto
- 🆔 ID único de reserva
- 📱 Descarga automática desde el modal

## 🔄 Actualización del Sistema

Para migrar de versiones anteriores:
1. Respaldar configuración actual
2. Actualizar archivos del proyecto
3. Añadir nuevas variables de entorno
4. Redesplegar en Vercel

---

**SpinBook v1.0** - Sistema de Reservas Musical Profesional  
Desarrollado con ❤️ por [Beraka Studio](https://beraka.cl/) © 2025