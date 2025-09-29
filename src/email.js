import { Resend } from 'resend';
import EmailTemplate from './email-template.js';

/**
 * Enhanced email delivery with React Email template
 */
export async function sendEmailDigest(apiKey, content, marketContext) {
    try {
        console.log("Preparing enhanced email digest...");
        
        const resend = new Resend(apiKey);
        const today = new Date().toDateString();
        const audienceId = '085abd2c-38b7-4871-9946-b087255ec292';

        // Generate HTML content from our template (already returns HTML string)
        const htmlContent = EmailTemplate({
            opportunities: content,
            marketContext: marketContext,
            date: today
        });

        console.log("Creating broadcast draft with React Email template...");
        const { data: createData, error: createError } = await resend.broadcasts.create({
            from: 'newsletter@ravishankars.com',
            audienceId: audienceId,
            subject: `🎯 Options Insight - ${today} (${content.length} Opportunities)`,
            html: htmlContent,
        });

        if (createError) {
            throw new Error(`Resend API (create) failed: ${JSON.stringify(createError)}`);
        }

        console.log(`Successfully created broadcast draft ${createData.id}. Sending...`);

        const { data: sendData, error: sendError } = await resend.broadcasts.send(createData.id);

        if (sendError) {
            throw new Error(`Resend API (send) failed: ${JSON.stringify(sendError)}`);
        }

        console.log(`✅ Successfully triggered send for broadcast ${sendData.id}`);
        return {
            success: true,
            broadcastId: sendData.id,
            recipientCount: content.length,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('❌ Error sending email digest:', error);
        throw error;
    }
}

/**
 * Preview email template (for testing)
 */
export function previewEmailTemplate(content, marketContext) {
    const today = new Date().toDateString();
    
    return EmailTemplate({
        opportunities: content,
        marketContext: marketContext,
        date: today
    });
}

/**
 * Send a post-run summary email to the maintainer.
 */
export async function sendRunSummaryEmail(apiKey, summary, recipientEmail, options = {}) {
    if (!apiKey) {
        throw new Error('RESEND_API_KEY is required to send summary emails');
    }

    if (!recipientEmail) {
        throw new Error('Recipient email is required for run summary notifications');
    }

    const resend = new Resend(apiKey);
    const statusEmoji = summary.success ? '✅' : '❌';
    const startedAt = formatDate(summary.startedAt);
    const finishedAt = formatDate(summary.finishedAt);
    const subject = `${statusEmoji} Options Insight Run Summary (${startedAt})`;
    const from = options.from || 'alerts@ravishankars.com';

    const htmlBody = buildSummaryHtml(summary, { startedAt, finishedAt, statusEmoji });
    const textBody = buildSummaryText(summary, { startedAt, finishedAt, statusEmoji });

    const { data, error } = await resend.emails.send({
        from,
        to: recipientEmail,
        subject,
        html: htmlBody,
        text: textBody
    });

    if (error) {
        throw new Error(`Resend summary email failed: ${JSON.stringify(error)}`);
    }

    return data;
}

function buildSummaryHtml(summary, context) {
    const { startedAt, finishedAt, statusEmoji } = context;
    const rows = summary.steps.map(step => `
        <tr>
            <td style="padding:6px 12px;border:1px solid #eaeaea;font-weight:600;">${escapeHtml(step.name)}</td>
            <td style="padding:6px 12px;border:1px solid #eaeaea;color:${statusColor(step.status)};text-transform:uppercase;font-size:12px;letter-spacing:0.08em;">${escapeHtml(step.status)}</td>
            <td style="padding:6px 12px;border:1px solid #eaeaea;">${escapeHtml(step.detail || '')}</td>
        </tr>`).join('') || `<tr><td colspan="3" style="padding:6px 12px;border:1px solid #eaeaea;">No step details recorded.</td></tr>`;

    const metrics = Object.entries(summary.metrics || {}).map(([key, value]) => `
        <li><strong>${escapeHtml(formatKey(key))}:</strong> ${escapeHtml(formatValue(value))}</li>
    `).join('');

    const errorsList = (summary.errors || []).map(error => `
        <li><strong>${escapeHtml(error.message)}</strong>${error.stack ? `<pre style="background:#f7f7f7;padding:8px;border-radius:4px;white-space:pre-wrap;">${escapeHtml(error.stack)}</pre>` : ''}</li>
    `).join('') || '<li>No errors recorded.</li>';

    const warnings = summary.steps.filter(step => step.status === 'warning');
    const warningList = warnings.map(step => `
        <li><strong>${escapeHtml(step.name)}:</strong> ${escapeHtml(step.detail || 'Warning')}</li>
    `).join('');

    return `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a;">
            <h2>${statusEmoji} Options Insight Run Summary</h2>
            <p><strong>Status:</strong> ${summary.success ? 'Success' : 'Completed with issues'}</p>
            <p><strong>Started:</strong> ${escapeHtml(startedAt)}<br />
               <strong>Finished:</strong> ${escapeHtml(finishedAt)}<br />
               <strong>Duration:</strong> ${escapeHtml(formatDuration(summary.durationMs))}
            </p>
            ${metrics ? `<h3>Metrics</h3><ul>${metrics}</ul>` : ''}
            ${warnings.length ? `<h3>Warnings</h3><ul>${warningList}</ul>` : ''}
            <h3>Pipeline Steps</h3>
            <table style="border-collapse:collapse;border:1px solid #eaeaea;font-size:14px;width:100%;max-width:680px;">
                <thead>
                    <tr style="background:#f3f4f6;">
                        <th style="padding:8px 12px;text-align:left;border:1px solid #eaeaea;">Step</th>
                        <th style="padding:8px 12px;text-align:left;border:1px solid #eaeaea;">Status</th>
                        <th style="padding:8px 12px;text-align:left;border:1px solid #eaeaea;">Detail</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <h3>Errors</h3>
            <ul>${errorsList}</ul>
        </div>
    `;
}

function buildSummaryText(summary, context) {
    const { startedAt, finishedAt, statusEmoji } = context;
    const lines = [
        `${statusEmoji} Options Insight Run Summary`,
        `Status: ${summary.success ? 'Success' : 'Completed with issues'}`,
        `Started: ${startedAt}`,
        `Finished: ${finishedAt}`,
        `Duration: ${formatDuration(summary.durationMs)}`,
        ''
    ];

    if (summary.metrics && Object.keys(summary.metrics).length) {
        lines.push('Metrics:');
        for (const [key, value] of Object.entries(summary.metrics)) {
            lines.push(` - ${formatKey(key)}: ${formatValue(value)}`);
        }
        lines.push('');
    }

    lines.push('Pipeline Steps:');
    if (summary.steps.length === 0) {
        lines.push(' - No step details recorded.');
    } else {
        for (const step of summary.steps) {
            lines.push(` - [${step.status.toUpperCase()}] ${step.name}: ${step.detail || ''}`);
        }
    }
    lines.push('');

    const warnings = summary.steps.filter(step => step.status === 'warning');
    if (warnings.length) {
        lines.push('Warnings:');
        for (const warning of warnings) {
            lines.push(` - ${warning.name}: ${warning.detail || ''}`);
        }
        lines.push('');
    }

    if (summary.errors && summary.errors.length) {
        lines.push('Errors:');
        for (const error of summary.errors) {
            lines.push(` - ${error.message}`);
            if (error.stack) {
                lines.push(`   ${error.stack.split('\n').join('\n   ')}`);
            }
        }
    } else {
        lines.push('Errors: None');
    }

    return lines.join('\n');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function statusColor(status) {
    switch ((status || '').toLowerCase()) {
        case 'success':
            return '#15803d';
        case 'warning':
            return '#b45309';
        case 'skipped':
            return '#0369a1';
        case 'failed':
            return '#b91c1c';
        default:
            return '#444';
    }
}

function formatKey(key) {
    return key.replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}

function formatValue(value) {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value % 1 === 0 ? value.toString() : value.toFixed(2);
    return String(value);
}

function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    try {
        return new Date(timestamp).toLocaleString('en-US', { timeZone: 'UTC', hour12: false });
    } catch {
        return String(timestamp);
    }
}

function formatDuration(durationMs) {
    if (typeof durationMs !== 'number') return 'Unknown';
    const seconds = Math.max(0, Math.round(durationMs / 1000));
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${remainder}s`;
}
