// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize CORS with options
const corsHandler = cors({ origin: true });

// Initialize Resend with your API key
// Set this via: firebase functions:config:set resend.key="re_994XeVFM_5xqVgsnXhTyQZ9WXvuGrR1tB"
const resend = new Resend(functions.config().resend?.key || process.env.RESEND_API_KEY);

/**
 * Send Invoice Email Function
 * Sends invoice emails with payment links to clients
 */
export const sendInvoiceEmail = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to send emails'
    );
  }

  // Validate required fields
  const {
    invoiceNumber,
    clientEmail,
    clientName,
    companyName,
    total,
    dueDate,
    invoiceId,
    subject,
    message,
    paymentLink,
    attachmentBase64,
  } = data;

  if (!clientEmail || !invoiceNumber || !companyName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required email parameters'
    );
  }

  try {
    // Create HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .email-container {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .content {
            padding: 30px;
          }
          .invoice-details {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 5px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            margin: 20px auto;
            text-align: center;
            display: block;
            width: 200px;
          }
          .message-content {
            white-space: pre-wrap;
            margin: 20px 0;
            line-height: 1.8;
            color: #4b5563;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .amount-due {
            font-size: 24px;
            color: #059669;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">${companyName}</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Invoice ${invoiceNumber}</p>
          </div>
          <div class="content">
            <div class="message-content">${message.replace(/\n/g, '<br>')}</div>
            
            <div class="invoice-details">
              <h3 style="margin-top: 0; color: #4b5563;">Invoice Details</h3>
              <div class="detail-row">
                <span><strong>Invoice Number:</strong></span>
                <span>${invoiceNumber}</span>
              </div>
              <div class="detail-row">
                <span><strong>Amount Due:</strong></span>
                <span class="amount-due">$${total.toFixed(2)}</span>
              </div>
              <div class="detail-row">
                <span><strong>Due Date:</strong></span>
                <span>${dueDate}</span>
              </div>
            </div>
            
            <a href="${paymentLink}" class="button">
              Pay Invoice Online
            </a>
            
            <p style="text-align: center; color: #6b7280; font-size: 14px;">
              Or copy this link:<br>
              <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 4px; font-size: 12px;">
                ${paymentLink}
              </code>
            </p>
            
            <div class="footer">
              <p><strong>${companyName}</strong></p>
              <p>This invoice was sent via IndiePilot</p>
              <p style="font-size: 12px; color: #9ca3af;">
                Your payment information is processed safely through our secure payment provider.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Plain text version
    const textContent = `
${message}

Invoice Details:
- Invoice Number: ${invoiceNumber}
- Amount Due: $${total.toFixed(2)}
- Due Date: ${dueDate}

Pay this invoice online: ${paymentLink}

${companyName}
Sent via IndiePilot
    `.trim();

    // Prepare email attachments if PDF is provided
    const attachments = [];
    if (attachmentBase64) {
      attachments.push({
        filename: `${invoiceNumber}.pdf`,
        content: attachmentBase64,
      });
    }

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: `${companyName} <support@indiepilot.io>`, // Update with your verified domain
      to: [clientEmail],
      subject: subject || `Invoice ${invoiceNumber} from ${companyName}`,
      html: htmlContent,
      text: textContent,
      attachments,
      headers: {
        'X-Invoice-ID': invoiceId,
        'X-Invoice-Number': invoiceNumber,
      },
    });

    // Log the email send for tracking
    await admin.firestore().collection('email_logs').add({
      invoiceId,
      invoiceNumber,
      clientEmail,
      clientName,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: context.auth.uid,
      emailId: emailResult.data?.id || 'unknown',
      status: 'sent',
    });

    return {
      success: true,
      emailId: emailResult.data?.id || 'sent',
      message: `Email sent successfully to ${clientEmail}`,
    };

  } catch (error: any) {
    console.error('Error sending email:', error);
    
    // Log failed attempt
    await admin.firestore().collection('email_logs').add({
      invoiceId,
      invoiceNumber,
      clientEmail,
      error: error.message,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: context.auth?.uid,
      status: 'failed',
    });

    throw new functions.https.HttpsError(
      'internal',
      `Failed to send email: ${error.message}`
    );
  }
});

/**
 * Process Payment Function
 * Handles Stripe payments for invoices
 */
export const processPayment = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // This will be implemented when you're ready for Stripe integration
    res.json({ 
      message: 'Payment processing not yet implemented',
      status: 'pending'
    });
  });
});

/**
 * AI Chat Function
 * Provides AI assistance for business tasks
 */
export const aiChat = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { message } = req.body;
    
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    try {
      // OpenAI integration will go here
      // const openaiKey = functions.config().openai?.key;
      
      // For now, return a placeholder response
      res.json({
        reply: 'AI Assistant is not yet configured. Please set up OpenAI API key.',
        status: 'pending_configuration'
      });
    } catch (error: any) {
      console.error('AI Chat error:', error);
      res.status(500).json({ error: 'Failed to process AI request' });
    }
  });
});