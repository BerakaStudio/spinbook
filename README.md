# SpinBook: App de Reservas de Estudio con Google Calendar

Esta es una aplicación web sencilla y moderna para gestionar reservas de un estudio de grabación. Utiliza la API de Google Calendar como backend y está diseñada para ser desplegada fácilmente en Vercel.

## Estructura del Proyecto

```
/
├── api/
│   ├── _utils.js         # Lógica compartida de la API de Google
│   ├── create-event.js   # Función para crear reservas
│   └── get-events.js     # Función para obtener horarios ocupados
├── .gitignore
├── index.html            # La aplicación web principal
├── package.json          # Dependencias del proyecto
└── README.md             # Este archivo
```

## Paso 1: Configurar Google Calendar API

(Esta sección no ha cambiado, los pasos siguen siendo los mismos)

## Paso 2: Desplegar en Vercel

1.  **Sube tu proyecto a GitHub.**
2.  **Crea un Proyecto en Vercel.**
3.  **Configurar las Variables de Entorno:**
    * Antes de desplegar, ve a la pestaña `Settings > Environment Variables` en tu proyecto de Vercel.
    * Necesitas agregar las siguientes **cuatro** variables.

| Nombre de la Variable     | Valor                                         | Descripción                            |
| :------------------------ | :-------------------------------------------- | :------------------------------------- |
| `GOOGLE_CALENDAR_ID`      | El ID de tu calendario.                       | `xxxx@group.calendar.google.com`       |
| `GOOGLE_CLIENT_EMAIL`     | El `client_email` de tu archivo JSON.         | `spinbook-service-account@...`         |
| `GOOGLE_PRIVATE_KEY`      | El `private_key` completo de tu archivo JSON. | `-----BEGIN PRIVATE KEY-----...`       |
| `STUDIO_TIMEZONE`         | La zona horaria de tu estudio.                | Ej: `America/Santiago` para Chile      |

    **Importante:** Busca tu zona horaria en la [lista de zonas horarias IANA](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).

4.  **Desplegar:**
    * Ve a la pestaña `Deployments` y haz clic en el botón `Redeploy` para aplicar los cambios y las nuevas variables de entorno.

¡Y listo! Con estos cambios, la aplicación debería funcionar correctamente.