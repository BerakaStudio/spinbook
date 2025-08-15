// File: api/test-config.js
// Endpoint para validar la configuración de SpinBook incluyendo Telegram
// Incluye test de calendar access y validación de configuración de Telegram
// © José Lobos Sanhueza, Beraka Studio, 2025

import { validateConfiguration, getEnvironmentInfo } from './_utils.js';

// Configuración de Telegram desde variables de entorno
const TELEGRAM_CONFIG = {
    enabled: process.env.TELEGRAM_ENABLED === 'true' || process.env.TELEGRAM_ENABLED === '1',
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
    silent: process.env.TELEGRAM_SILENT === 'true' || process.env.TELEGRAM_SILENT === '1',
    parseMode: process.env.TELEGRAM_PARSE_MODE || 'Markdown'
};

// Validar configuración de Telegram
async function validateTelegramConfiguration() {
    console.log('🔍 VALIDATING TELEGRAM CONFIGURATION...');
    
    const validation = {
        isConfigured: false,
        isEnabled: TELEGRAM_CONFIG.enabled,
        hasToken: !!TELEGRAM_CONFIG.botToken,
        hasChatId: !!TELEGRAM_CONFIG.chatId,
        tokenFormat: 'invalid',
        chatIdFormat: 'invalid',
        apiTest: 'not_tested',
        errors: [],
        warnings: []
    };

    // Verificar si está habilitado
    if (!TELEGRAM_CONFIG.enabled) {
        validation.warnings.push('Telegram notifications are disabled');
        return validation;
    }

    // Verificar token
    if (!TELEGRAM_CONFIG.botToken) {
        validation.errors.push('TELEGRAM_BOT_TOKEN is not set');
    } else if (!TELEGRAM_CONFIG.botToken.includes(':')) {
        validation.errors.push('Invalid bot token format. Should be: XXXXXXXXX:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
    } else {
        validation.tokenFormat = 'valid';
    }

    // Verificar chat ID
    if (!TELEGRAM_CONFIG.chatId) {
        validation.errors.push('TELEGRAM_CHAT_ID is not set');
    } else if (!/^-?\d+$/.test(TELEGRAM_CONFIG.chatId)) {
        validation.warnings.push('Chat ID format may be incorrect. Should be a number (positive for users, negative for groups)');
    } else {
        validation.chatIdFormat = 'valid';
    }

    // Si hay errores críticos, no hacer test de API
    if (validation.errors.length > 0) {
        return validation;
    }

    // Test de API de Telegram
    try {
        console.log('Testing Telegram Bot API...');
        
        const testMessage = `🧪 *TEST SPINBOOK TELEGRAM*

Este es un mensaje de prueba del sistema de notificaciones.

✅ La configuración de Telegram está funcionando correctamente.

⚙️ *Configuración:*
• Bot Token: ${TELEGRAM_CONFIG.botToken.substring(0, 10)}...
• Chat ID: ${TELEGRAM_CONFIG.chatId}
• Parse Mode: ${TELEGRAM_CONFIG.parseMode}
• Silent: ${TELEGRAM_CONFIG.silent}

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
            const result = await response.json();
            validation.apiTest = 'success';
            validation.isConfigured = true;
            console.log('✅ Telegram test message sent successfully:', result.result.message_id);
        } else {
            const errorData = await response.json();
            validation.apiTest = 'failed';
            validation.errors.push(`Telegram API test failed: ${errorData.description || 'Unknown error'}`);
            
            // Errores específicos
            if (errorData.error_code === 400) {
                validation.errors.push('Bad Request - Check your bot token and chat ID');
            } else if (errorData.error_code === 401) {
                validation.errors.push('Unauthorized - Invalid bot token');
            } else if (errorData.error_code === 403) {
                validation.errors.push('Forbidden - Bot was blocked by user or chat not found');
            }
            
            console.error('❌ Telegram test failed:', errorData);
        }

    } catch (error) {
        validation.apiTest = 'error';
        validation.errors.push(`Telegram API test error: ${error.message}`);
        console.error('Error testing Telegram configuration:', error);
    }

    return validation;
}

export default async function handler(request, response) {
    // CORS headers
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }
    
    if (request.method !== 'GET') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        console.log('=== SPINBOOK CONFIGURATION TEST START v2.2 ===');
        
        // Obtener información del entorno
        const envInfo = getEnvironmentInfo();
        
        // Validar configuración completa con test de calendar
        const config = await validateConfiguration();
        
        // Validar configuración de Telegram
        const telegramValidation = await validateTelegramConfiguration();
        
        const result = {
            status: 'success',
            message: 'SpinBook configuration is valid and ready!',
            environment: envInfo,
            configuration: {
                calendarId: config.calendarId,
                timeZone: config.timeZone,
                calendarSummary: config.calendarAccess.summary,
                calendarTimeZone: config.calendarAccess.timeZone,
                accessRole: config.calendarAccess.accessRole,
                validatedAt: config.timestamp
            },
            // Información de Telegram
            telegram: {
                enabled: telegramValidation.isEnabled,
                configured: telegramValidation.isConfigured,
                hasToken: telegramValidation.hasToken,
                hasChatId: telegramValidation.hasChatId,
                tokenFormat: telegramValidation.tokenFormat,
                chatIdFormat: telegramValidation.chatIdFormat,
                apiTest: telegramValidation.apiTest,
                errors: telegramValidation.errors,
                warnings: telegramValidation.warnings
            },
            recommendations: [],
            healthChecks: {
                googleAuth: 'âœ… Passed',
                calendarAccess: 'âœ… Passed',
                timezoneValidation: 'âœ… Passed',
                environmentVariables: 'âœ… All required variables present',
                telegramNotifications: telegramValidation.isConfigured ? 'âœ… Configured and working' : 
                                     telegramValidation.isEnabled ? 'âŒ Enabled but not working' : 
                                     'ðŸ"´ Disabled'
            }
        };
        
        // Análisis más detallado de la configuración
        if (!envInfo.hasStudioName) {
            result.recommendations.push('ðŸ'¡ Consider setting STUDIO_NAME environment variable for customization');
        }
        
        if (!envInfo.hasStudioAddress) {
            result.recommendations.push('ðŸ'¡ Consider setting STUDIO_ADDRESS environment variable for location info');
        }
        
        if (!envInfo.hasStudioEmail) {
            result.recommendations.push('ðŸ'¡ Consider setting STUDIO_EMAIL environment variable for contact info');
        }
        
        if (!envInfo.hasStudioPhone) {
            result.recommendations.push('ðŸ'¡ Consider setting STUDIO_PHONE environment variable for contact info');
        }
        
        // Recomendaciones para Telegram
        if (!telegramValidation.isEnabled) {
            result.recommendations.push('ðŸ'¡ Enable Telegram notifications by setting TELEGRAM_ENABLED=true');
        } else if (!telegramValidation.isConfigured) {
            result.recommendations.push('âŒ Configure Telegram by setting TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID');
        }
        
        if (telegramValidation.errors.length > 0) {
            result.recommendations.push(...telegramValidation.errors.map(err => `âŒ Telegram: ${err}`));
        }
        
        if (telegramValidation.warnings.length > 0) {
            result.recommendations.push(...telegramValidation.warnings.map(warn => `âš ï¸ Telegram: ${warn}`));
        }
        
        // Comparación de timezone entre calendar y estudio
        if (config.calendarAccess.timeZone && config.calendarAccess.timeZone !== config.timeZone) {
            result.recommendations.push(`âš ï¸ Calendar timezone (${config.calendarAccess.timeZone}) differs from studio timezone (${config.timeZone}). This may cause scheduling conflicts.`);
            result.healthChecks.timezoneConsistency = 'âš ï¸ Warning - Timezone mismatch';
        } else {
            result.healthChecks.timezoneConsistency = 'âœ… Timezones aligned';
        }
        
        // Verificar permisos de calendar
        if (config.calendarAccess.accessRole) {
            if (['owner', 'writer'].includes(config.calendarAccess.accessRole)) {
                result.healthChecks.calendarPermissions = 'âœ… Sufficient permissions';
            } else if (config.calendarAccess.accessRole === 'reader') {
                result.healthChecks.calendarPermissions = 'âŒ Insufficient permissions - needs write access';
                result.recommendations.push('âŒ Service account has read-only access. Grant "Make changes to events" permission.');
            } else {
                result.healthChecks.calendarPermissions = `âš ï¸ Unknown access level: ${config.calendarAccess.accessRole}`;
            }
        }
        
        // Test de fecha/hora actual
        try {
            const now = new Date();
            const studioTime = now.toLocaleString('es-ES', { 
                timeZone: config.timeZone,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            result.currentStudioTime = studioTime;
            result.healthChecks.timezoneFormatting = 'âœ… Timezone formatting works';
        } catch (timeError) {
            result.healthChecks.timezoneFormatting = 'âŒ Timezone formatting failed';
            result.recommendations.push('âŒ Timezone formatting error. Check STUDIO_TIMEZONE value.');
        }
        
        console.log('âœ… Configuration test completed successfully');
        console.log('=== SPINBOOK CONFIGURATION TEST END ===');
        
        return response.status(200).json(result);
        
    } catch (error) {
        console.error('=== SPINBOOK CONFIGURATION TEST ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        // Diagnóstico más específico de errores
        const errorResult = {
            status: 'error',
            message: 'SpinBook configuration validation failed',
            error: error.message,
            environment: getEnvironmentInfo(),
            failedChecks: [],
            troubleshooting: []
        };
        
        // Análisis específico del tipo de error
        if (error.message.includes('GOOGLE_CLIENT_EMAIL')) {
            errorResult.failedChecks.push('âŒ Google Service Account Email missing');
            errorResult.troubleshooting.push('Set GOOGLE_CLIENT_EMAIL environment variable in Vercel');
        }
        
        if (error.message.includes('GOOGLE_PRIVATE_KEY')) {
            errorResult.failedChecks.push('âŒ Google Service Account Private Key missing');
            errorResult.troubleshooting.push('Set GOOGLE_PRIVATE_KEY environment variable in Vercel');
        }
        
        if (error.message.includes('GOOGLE_CALENDAR_ID')) {
            errorResult.failedChecks.push('âŒ Google Calendar ID missing');
            errorResult.troubleshooting.push('Set GOOGLE_CALENDAR_ID environment variable in Vercel');
        }
        
        if (error.message.includes('STUDIO_TIMEZONE')) {
            errorResult.failedChecks.push('âŒ Studio Timezone missing or invalid');
            errorResult.troubleshooting.push('Set STUDIO_TIMEZONE to valid IANA timezone (e.g., America/Santiago)');
        }
        
        if (error.message.includes('authentication failed') || error.message.includes('credentials')) {
            errorResult.failedChecks.push('âŒ Google Authentication failed');
            errorResult.troubleshooting.push('Verify service account credentials are correct');
            errorResult.troubleshooting.push('Ensure private key format includes BEGIN/END markers');
        }
        
        if (error.message.includes('Calendar access test failed') || error.message.includes('Calendar not found')) {
            errorResult.failedChecks.push('âŒ Calendar access failed');
            errorResult.troubleshooting.push('Verify calendar ID is correct');
            errorResult.troubleshooting.push('Ensure service account has access to the calendar');
            errorResult.troubleshooting.push('Check calendar sharing settings');
        }
        
        if (error.message.includes('API')) {
            errorResult.failedChecks.push('âŒ Google Calendar API error');
            errorResult.troubleshooting.push('Confirm Google Calendar API is enabled in Google Cloud Console');
            errorResult.troubleshooting.push('Check API quotas and limits');
        }
        
        // Troubleshooting general si no se identificó el error específico
        if (errorResult.troubleshooting.length === 0) {
            errorResult.troubleshooting = [
                'Verify all environment variables are set in Vercel',
                'Ensure the service account has access to the calendar',
                'Check that the calendar ID is correct and accessible',
                'Validate timezone format (use IANA timezone identifiers)',
                'Confirm Google Calendar API is enabled in Google Cloud Console',
                'Test service account credentials in Google Cloud Console'
            ];
        }
        
        // Agregar troubleshooting para Telegram
        errorResult.troubleshooting.push('For Telegram notifications, set TELEGRAM_ENABLED=true, TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID');
        errorResult.troubleshooting.push('Check Vercel function logs for detailed error information');
        errorResult.troubleshooting.push('Use the browser console to see client-side errors');
        
        return response.status(500).json(errorResult);
    }
}