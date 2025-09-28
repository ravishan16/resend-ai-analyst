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
            subject: `🎯 AI Stock Analyst Digest - ${today} (${content.length} Opportunities)`,
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
