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

Necesitas una **Cuenta de Servicio** de Google para que tu aplicación pueda interactuar con tu calendario de forma segura y automática.

1.  **Crear un Proyecto en Google Cloud:**
    * Ve a la [Consola de Google Cloud](https://console.cloud.google.com/).
    * Crea un nuevo proyecto (ej. "SpinBook Reservas").

2.  **Habilitar la API de Google Calendar:**
    * En el menú de navegación, ve a `APIs y servicios > Biblioteca`.
    * Busca "Google Calendar API" y haz clic en **Habilitar**.

3.  **Crear una Cuenta de Servicio:**
    * Ve a `APIs y servicios > Credenciales`.
    * Haz clic en `+ CREAR CREDENCIALES` y selecciona `Cuenta de servicio`.
    * Dale un nombre (ej. "spinbook-service-account") y haz clic en `CREAR Y CONTINUAR`.
    * En "Otorga a esta cuenta de servicio acceso al proyecto", selecciona el rol `Básico > Propietario` (para simplificar) y haz clic en `Continuar` y luego en `LISTO`.

4.  **Generar una Clave JSON:**
    * En la lista de credenciales, busca la cuenta de servicio que acabas de crear y haz clic en ella.
    * Ve a la pestaña `CLAVES`.
    * Haz clic en `AGREGAR CLAVE > Crear nueva clave`.
    * Selecciona `JSON` y haz clic en `CREAR`. Se descargará un archivo JSON. **¡Guárdalo bien, lo necesitarás!**

5.  **Configurar el Calendario de Google:**
    * Abre el archivo JSON que descargaste. Busca el valor de `"client_email"`. Se verá algo como `spinbook-service-account@...iam.gserviceaccount.com`.
    * Ve a [Google Calendar](https://calendar.google.com/).
    * Crea un nuevo calendario (ej. "Reservas SpinBook") o usa uno existente.
    * Ve a la configuración del calendario y busca la sección "Compartir con personas específicas".
    * Haz clic en `+ Agregar personas`.
    * Pega el `client_email` de tu cuenta de servicio en el campo.
    * En "Permisos", selecciona **`Hacer cambios en los eventos`**.
    * Haz clic en `Enviar`.
    * Finalmente, en la configuración del calendario, ve a "Integrar el calendario" y copia el **ID del calendario**. Se verá como un correo electrónico largo.

## Paso 2: Desplegar en Vercel

1.  **Sube tu proyecto a GitHub:**
    * Crea un nuevo repositorio en GitHub y sube todos los archivos de este proyecto.

2.  **Crear un Proyecto en Vercel:**
    * Regístrate o inicia sesión en [Vercel](https://vercel.com/).
    * Haz clic en `Add New... > Project`.
    * Importa el repositorio que creaste en GitHub. Vercel detectará la configuración automáticamente.

3.  **Configurar las Variables de Entorno:**
    * Antes de desplegar, ve a la pestaña `Settings > Environment Variables`.
    * Necesitas agregar las siguientes tres variables. Los valores los sacarás del archivo JSON que descargaste y del ID de tu calendario.

| Nombre de la Variable     | Valor                                                                                                                              |
| :------------------------ | :--------------------------------------------------------------------------------------------------------------------------------- |
| `GOOGLE_CALENDAR_ID`      | El ID de tu calendario que copiaste en el último paso.                                                                             |
| `GOOGLE_CLIENT_EMAIL`     | El valor de `client_email` de tu archivo JSON.                                                                                     |
| `GOOGLE_PRIVATE_KEY`      | El valor completo de `private_key` de tu archivo JSON. **Importante:** Copia todo el contenido, incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`. |

4.  **Desplegar:**
    * Ve a la pestaña `Deployments` y haz clic en el botón `Deploy` más reciente para (re)desplegar el proyecto con las variables de entorno ya configuradas.

¡Y listo! Tu aplicación SpinBook estará en línea, funcionando de manera segura y conectada a tu Google Calendar.