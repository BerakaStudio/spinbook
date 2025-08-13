// File: api/test-config.js
// MEJORADO: Endpoint para validar la configuración de SpinBook
// Incluye test de calendar access y mejor diagnóstico de errores
// © José Lobos Sanhueza, Beraka Studio, 2025

import { validateConfiguration, getEnvironmentInfo } from './_utils.js';

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
        console.log('=== SPINBOOK CONFIGURATION TEST START v2.1 ===');
        
        // Obtener información del entorno
        const envInfo = getEnvironmentInfo();
        
        // Validar configuración completa con test de calendar
        const config = await validateConfiguration();
        
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
            recommendations: [],
            healthChecks: {
                googleAuth: '✅ Passed',
                calendarAccess: '✅ Passed',
                timezoneValidation: '✅ Passed',
                environmentVariables: '✅ All required variables present'
            }
        };
        
        // MEJORADO: Análisis más detallado de la configuración
        if (!envInfo.hasStudioName) {
            result.recommendations.push('💡 Consider setting STUDIO_NAME environment variable for customization');
        }
        
        if (!envInfo.hasStudioAddress) {
            result.recommendations.push('💡 Consider setting STUDIO_ADDRESS environment variable for location info');
        }
        
        if (!envInfo.hasStudioEmail) {
            result.recommendations.push('💡 Consider setting STUDIO_EMAIL environment variable for contact info');
        }
        
        if (!envInfo.hasStudioPhone) {
            result.recommendations.push('💡 Consider setting STUDIO_PHONE environment variable for contact info');
        }
        
        // NUEVO: Comparación de timezone entre calendar y estudio
        if (config.calendarAccess.timeZone && config.calendarAccess.timeZone !== config.timeZone) {
            result.recommendations.push(`⚠️ Calendar timezone (${config.calendarAccess.timeZone}) differs from studio timezone (${config.timeZone}). This may cause scheduling conflicts.`);
            result.healthChecks.timezoneConsistency = '⚠️ Warning - Timezone mismatch';
        } else {
            result.healthChecks.timezoneConsistency = '✅ Timezones aligned';
        }
        
        // NUEVO: Verificar permisos de calendar
        if (config.calendarAccess.accessRole) {
            if (['owner', 'writer'].includes(config.calendarAccess.accessRole)) {
                result.healthChecks.calendarPermissions = '✅ Sufficient permissions';
            } else if (config.calendarAccess.accessRole === 'reader') {
                result.healthChecks.calendarPermissions = '❌ Insufficient permissions - needs write access';
                result.recommendations.push('❌ Service account has read-only access. Grant "Make changes to events" permission.');
            } else {
                result.healthChecks.calendarPermissions = `⚠️ Unknown access level: ${config.calendarAccess.accessRole}`;
            }
        }
        
        // NUEVO: Test de fecha/hora actual
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
            result.healthChecks.timezoneFormatting = '✅ Timezone formatting works';
        } catch (timeError) {
            result.healthChecks.timezoneFormatting = '❌ Timezone formatting failed';
            result.recommendations.push('❌ Timezone formatting error. Check STUDIO_TIMEZONE value.');
        }
        
        console.log('✅ Configuration test completed successfully');
        console.log('=== SPINBOOK CONFIGURATION TEST END ===');
        
        return response.status(200).json(result);
        
    } catch (error) {
        console.error('=== SPINBOOK CONFIGURATION TEST ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        // MEJORADO: Diagnóstico más específico de errores
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
            errorResult.failedChecks.push('❌ Google Service Account Email missing');
            errorResult.troubleshooting.push('Set GOOGLE_CLIENT_EMAIL environment variable in Vercel');
        }
        
        if (error.message.includes('GOOGLE_PRIVATE_KEY')) {
            errorResult.failedChecks.push('❌ Google Service Account Private Key missing');
            errorResult.troubleshooting.push('Set GOOGLE_PRIVATE_KEY environment variable in Vercel');
        }
        
        if (error.message.includes('GOOGLE_CALENDAR_ID')) {
            errorResult.failedChecks.push('❌ Google Calendar ID missing');
            errorResult.troubleshooting.push('Set GOOGLE_CALENDAR_ID environment variable in Vercel');
        }
        
        if (error.message.includes('STUDIO_TIMEZONE')) {
            errorResult.failedChecks.push('❌ Studio Timezone missing or invalid');
            errorResult.troubleshooting.push('Set STUDIO_TIMEZONE to valid IANA timezone (e.g., America/Santiago)');
        }
        
        if (error.message.includes('authentication failed') || error.message.includes('credentials')) {
            errorResult.failedChecks.push('❌ Google Authentication failed');
            errorResult.troubleshooting.push('Verify service account credentials are correct');
            errorResult.troubleshooting.push('Ensure private key format includes BEGIN/END markers');
        }
        
        if (error.message.includes('Calendar access test failed') || error.message.includes('Calendar not found')) {
            errorResult.failedChecks.push('❌ Calendar access failed');
            errorResult.troubleshooting.push('Verify calendar ID is correct');
            errorResult.troubleshooting.push('Ensure service account has access to the calendar');
            errorResult.troubleshooting.push('Check calendar sharing settings');
        }
        
        if (error.message.includes('API')) {
            errorResult.failedChecks.push('❌ Google Calendar API error');
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
        
        // Agregar información sobre cómo acceder a logs
        errorResult.troubleshooting.push('Check Vercel function logs for detailed error information');
        errorResult.troubleshooting.push('Use the browser console to see client-side errors');
        
        return response.status(500).json(errorResult);
    }
}