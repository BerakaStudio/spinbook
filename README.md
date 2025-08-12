# SpinBook: Sistema Avanzado de Reservas de Estudio con Google Calendar

SpinBook es una aplicación web moderna y completa para gestionar reservas de un estudio de grabación. Utiliza la API de Google Calendar como backend y está optimizada para ser desplegada fácilmente en Vercel con funcionalidades avanzadas de prevención de conflictos y gestión de reservas en tiempo real.

## 🎵 Características Principales

### ✨ Funcionalidades Core
- **Calendario interactivo** con navegación por meses
- **Selección múltiple de horarios** en el mismo día
- **Prevención de conflictos** - imposibilidad de reservar horarios ya ocupados
- **Validación en tiempo real** de disponibilidad
- **Formulario de reserva** con datos completos del cliente
- **Modal de confirmación** con todos los detalles
- **Generación de PDF** con comprobante de reserva
- **Integración completa** con Google Calendar

### 🔒 Sistema Anti-Conflictos
- **Verificación en tiempo real** de horarios ocupados
- **Bloqueo automático** de slots reservados
- **Actualización inmediata** del calendario tras confirmar reserva
- **Validación server-side** antes de crear eventos
- **Manejo de errores** específicos para conflictos

### 📊 Gestión de Datos
- **Información completa del cliente** guardada en Google Calendar
- **IDs únicos de reserva** para fácil seguimiento
- **Detalles extendidos** en la descripción del evento
- **Propiedades privadas** para datos sensibles
- **Formato profesional** en el calendario

### 🎨 Interfaz de Usuario
- **Diseño moderno** con tema oscuro y acentos amarillos
- **Responsive design** optimizado para móviles y desktop
- **Animaciones suaves** y transiciones fluidas
- **Estados de carga** con indicadores visuales
- **Feedback inmediato** para todas las acciones

## 📁 Estructura del Proyecto

```
/
├── api/
│   ├── _utils.js           # Utilidades compartidas para Google API
│   ├── create-event.js     # Función para crear reservas con validación
│   └── get-events.js       # Función para obtener horarios ocupados
├── public/
│   ├── index.html          # Interfaz de usuario principal
│   ├── styles.css          # Estilos personalizados (si existe)
│   └── script-sb.js        # Lógica principal de la aplicación
├── package.json            # Dependencias del proyecto
├── .gitignore              # Archivos a ignorar en Git
└── README.md               # Documentación del proyecto
```

## 🚀 Configuración e Instalación

### Paso 1: Configurar Google Calendar API

1. **Crear un Proyecto en Google Cloud Console:**
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un nuevo proyecto o selecciona uno existente
   - Habilita la Google Calendar API

2. **Crear una Cuenta de Servicio:**
   - Ve a `APIs y servicios > Credenciales`
   - Haz clic en `+ CREAR CREDENCIALES > Cuenta de servicio`
   - Completa el nombre y descripción
   - Descarga el archivo JSON con las credenciales

3. **Configurar el Calendario:**
   - Crea un nuevo calendario en Google Calendar
   - Comparte el calendario con la cuenta de servicio (email de la cuenta de servicio)
   - Dale permisos de "Realizar cambios en los eventos"
   - Copia el ID del calendario (Configuración del calendario > ID del calendario)

### Paso 2: Configurar Variables de Entorno

En Vercel, ve a `Settings > Environment Variables` y configura:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `GOOGLE_CALENDAR_ID` | `xxxx@group.calendar.google.com` | ID del calendario de Google |
| `GOOGLE_CLIENT_EMAIL` | `xxxx@xxxx.iam.gserviceaccount.com` | Email de la cuenta de servicio |
| `GOOGLE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----...` | Clave privada completa de la cuenta de servicio |
| `STUDIO_TIMEZONE` | `America/Santiago` | Zona horaria del estudio ([Lista IANA](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)) |

> **⚠️ Importante:** 
> - La clave privada debe incluir las líneas `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`
> - Si la clave contiene `\n`, Vercel los manejará automáticamente
> - Asegúrate de que la zona horaria sea exactamente como aparece en la lista IANA

### Paso 3: Desplegar en Vercel

1. **Conecta tu repositorio:**
   - Sube el proyecto a GitHub/GitLab/Bitbucket
   - Conecta el repositorio a Vercel

2. **Configurar el proyecto:**
   - Vercel detectará automáticamente que es un proyecto Node.js
   - Las variables de entorno deben estar configuradas antes del deploy

3. **Desplegar:**
   - Haz push a la rama principal
   - Vercel desplegará automáticamente
   - Verifica que todas las variables estén configuradas correctamente

## 🔧 Características Técnicas Avanzadas

### Prevención de Conflictos
```javascript
// El sistema verifica conflictos antes de crear eventos
const conflicts = await checkExistingEvents(date, selectedSlots);
if (conflicts.length > 0) {
    return error('Horarios ya ocupados');
}
```

### Actualización en Tiempo Real
- Al confirmar una reserva, el calendario se actualiza inmediatamente
- Los horarios ocupados se marcan como no disponibles
- No es necesario recargar la página

### Validación Robusta
- **Frontend:** Validación inmediata de formularios
- **Backend:** Verificación de conflictos server-side
- **API:** Manejo de errores específicos de Google Calendar

### Datos Completos en Google Calendar
Cada reserva incluye en Google Calendar:
- **Título:** Nombre del cliente y horarios
- **Descripción:** Datos completos del cliente, servicios, términos
- **Propiedades extendidas:** Datos estructurados para consultas
- **Recordatorios:** 24 horas y 1 hora antes
- **Color:** Amarillo para fácil identificación

## 📱 Uso de la Aplicación

### Para Clientes:
1. **Seleccionar fecha** en el calendario
2. **Elegir horarios** disponibles (múltiple selección posible)
3. **Completar datos** personales
4. **Confirmar reserva** y recibir comprobante PDF
5. **Automáticamente** el horario queda bloqueado para otros

### Para el Estudio:
- **Visualizar reservas** directamente en Google Calendar
- **Acceder a datos completos** del cliente en cada evento
- **Gestionar horarios** desde cualquier dispositivo
- **Recibir notificaciones** automáticas

## 🛠️ Personalización

### Horarios de Funcionamiento
Modificar en `script-sb.js`:
```javascript
// Actualmente: 9 AM a 9 PM
const startHour = 9;
const endHour = 21;
```

### Colores y Tema
Los colores principales se pueden modificar en las clases de Tailwind:
- `text-yellow-400` - Color principal (amarillo)
- `bg-gray-900` - Fondo principal
- `bg-gray-800` - Fondo secundario

### Textos y Idioma
Todos los textos están en español y se pueden modificar directamente en los archivos:
- `index.html` - Textos de la interfaz
- `script-sb.js` - Mensajes y etiquetas dinámicas
- `api/create-event.js` - Descripciones de eventos

### Información del Estudio
Personalizar en `api/create-event.js`:
```javascript
location: 'Tu Estudio Aquí',
// Modificar la descripción del evento con tu información
```

## 🔍 Solución de Problemas

### Errores Comunes

**1. Error de Autenticación**
```
Error: GOOGLE_CLIENT_EMAIL is not configured
```
- **Solución:** Verificar que todas las variables de entorno estén configuradas correctamente
- Revisar que el email de la cuenta de servicio sea correcto

**2. Calendar Not Found**
```
Error: Calendar not found
```
- **Solución:** 
  - Verificar que el Calendar ID sea correcto
  - Asegurar que la cuenta de servicio tenga acceso al calendario
  - Confirmar que el calendario no esté eliminado

**3. Timezone Error**
```
Error: Invalid studio timezone
```
- **Solución:** Usar una zona horaria válida de la [lista IANA](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
- Ejemplos válidos: `America/Santiago`, `America/New_York`, `Europe/Madrid`

**4. Private Key Format Error**
```
Error: Private key format is invalid
```
- **Solución:** 
  - Asegurar que la clave incluya `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`
  - No modificar manualmente los saltos de línea
  - Copiar la clave completa del archivo JSON

**5. Conflictos de Horarios**
```
Error: Los siguientes horarios ya no están disponibles
```
- **Comportamiento esperado:** El sistema previene automáticamente las reservas duplicadas
- El usuario debe seleccionar otros horarios disponibles

### Logs y Debugging

Para ver logs detallados en Vercel:
1. Ve a tu proyecto en Vercel
2. Dirígete a la pestaña `Functions`
3. Haz clic en cualquier función para ver los logs
4. Los errores aparecerán con detalles específicos

### Verificación de Configuración

**Verificar Variables de Entorno:**
```bash
# En la consola de Vercel Functions, verifica:
console.log('Calendar ID:', process.env.GOOGLE_CALENDAR_ID);
console.log('Client Email:', process.env.GOOGLE_CLIENT_EMAIL);
console.log('Timezone:', process.env.STUDIO_TIMEZONE);
```

## 📊 Monitoreo y Mantenimiento

### Métricas Importantes
- **Reservas exitosas** vs errores
- **Tiempo de respuesta** de la API
- **Uso de cuota** de Google Calendar API
- **Errores de conflicto** (deben ser raros)

### Mantenimiento Regular
- **Revisar logs** semanalmente para detectar errores
- **Verificar cuotas** de Google Calendar API
- **Limpiar eventos antiguos** si es necesario
- **Actualizar credenciales** antes de que expiren

### Backup y Seguridad
- **Los datos** están respaldados en Google Calendar
- **Credenciales** deben mantenerse seguras
- **Variables de entorno** no deben exponerse públicamente
- **Logs** pueden contener información sensible

## 🔗 APIs y Dependencias

### Google Calendar API
- **Versión:** v3
- **Límites:** 1,000,000 requests/día (gratis)
- **Documentación:** [Google Calendar API](https://developers.google.com/calendar/api)

### Dependencias Frontend
- **Tailwind CSS:** Para estilos
- **jsPDF:** Para generación de PDFs
- **Vanilla JavaScript:** Sin frameworks adicionales

### Dependencias Backend
- **googleapis:** Cliente oficial de Google
- **Vercel:** Plataforma de despliegue
- **Node.js:** Runtime del servidor

## 🚀 Funcionalidades Avanzadas Implementadas

### 1. Sistema de Prevención de Conflictos
- ✅ Verificación en tiempo real de disponibilidad
- ✅ Bloqueo inmediato de slots reservados
- ✅ Validación server-side antes de crear eventos
- ✅ Manejo de errores específicos para conflictos
- ✅ Actualización automática del calendario

### 2. Gestión Completa de Datos
- ✅ Información detallada del cliente en Google Calendar
- ✅ IDs únicos de reserva para seguimiento
- ✅ Propiedades extendidas para consultas avanzadas
- ✅ Formato profesional en descripciones de eventos
- ✅ Metadatos estructurados para análisis

### 3. Experiencia de Usuario Mejorada
- ✅ Modal de confirmación con todos los detalles
- ✅ Generación automática de PDFs
- ✅ Cierre automático tras confirmar/descargar
- ✅ Estados de carga y feedback visual
- ✅ Manejo robusto de errores

### 4. Arquitectura Escalable
- ✅ Separación clara de responsabilidades
- ✅ Código JavaScript modular en archivo separado
- ✅ APIs RESTful bien estructuradas
- ✅ Manejo de errores granular
- ✅ Logging detallado para debugging

## 📈 Próximas Mejoras Sugeridas

### Funcionalidades Adicionales
- [ ] Sistema de notificaciones por email
- [ ] Panel de administración para gestionar reservas
- [ ] Integración con sistemas de pago
- [ ] Reservas recurrentes
- [ ] Sistema de comentarios/valoraciones

### Optimizaciones Técnicas
- [ ] Cache de horarios ocupados
- [ ] Lazy loading del calendario
- [ ] Progressive Web App (PWA)
- [ ] Análisis y métricas de uso
- [ ] Tests automatizados

## 🤝 Contribución

### Estructura para Contribuir
1. Fork del repositorio
2. Crear rama para la funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Estándares de Código
- **JavaScript:** ES6+ con async/await
- **Comentarios:** Documentar funciones complejas
- **Naming:** Variables y funciones en camelCase
- **Errores:** Manejo robusto con logs detallados

## 📞 Soporte

Para problemas o preguntas:
1. **Revisar** esta documentación primero
2. **Verificar** los logs en Vercel Functions
3. **Consultar** la documentación de Google Calendar API
4. **Abrir issue** en el repositorio con detalles específicos

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver archivo `LICENSE` para más detalles.

---

**SpinBook** - Sistema Avanzado de Reservas de Estudio
Desarrollado con ❤️ por Beraka Studio para estudios de grabación profesionales.