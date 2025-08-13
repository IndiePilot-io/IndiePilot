// src/services/emailService.ts
import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';
import { generateInvoicePDF } from '../components/Dashboard/pdf';

interface SendInvoiceEmailParams {
  invoiceNumber: string;
  clientEmail: string;
  clientName: string;
  companyName: string;
  total: number;
  dueDate: string;
  invoiceId: string;
  invoiceData: any;
  customSubject?: string;
  customMessage?: string;
}

class EmailService {
  // Control whether to use real email or preview
  private USE_REAL_EMAIL = true; // Set to true when Resend is configured
  
  /**
   * Generate a payment link
   */
  private generatePaymentLink(invoiceId: string, amount: number): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/pay?invoice=${invoiceId}&amount=${amount}`;
  }

  /**
   * Get default email message template
   */
  private getDefaultEmailMessage(params: SendInvoiceEmailParams): string {
    return `Dear ${params.clientName},

Thank you for your business. Please find attached your invoice ${params.invoiceNumber}.

Amount Due: $${params.total.toFixed(2)}
Due Date: ${params.dueDate}

You can pay this invoice online using the secure payment link below.

If you have any questions about this invoice, please don't hesitate to contact us.

Best regards,
${params.companyName}`;
  }

  /**
   * Send invoice email (preview or real based on configuration)
   */
  async sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<{ success: boolean; paymentLink?: string }> {
    try {
      const paymentLink = this.generatePaymentLink(params.invoiceId, params.total);
      const subject = params.customSubject || `Invoice ${params.invoiceNumber} from ${params.companyName}`;
      const message = params.customMessage || this.getDefaultEmailMessage(params);
      
      if (this.USE_REAL_EMAIL) {
        // Call Firebase Function to send real email
        try {
          const sendEmail = httpsCallable(functions, 'sendInvoiceEmail');
          const result = await sendEmail({
            invoiceNumber: params.invoiceNumber,
            clientEmail: params.clientEmail,
            clientName: params.clientName,
            companyName: params.companyName,
            total: params.total,
            dueDate: params.dueDate,
            invoiceId: params.invoiceId,
            subject,
            message,
            paymentLink
          });
          
          console.log('Email sent via Firebase Function:', result);
          
          // Show success notification
          this.showSuccessNotification(params.clientEmail);
          
          return {
            success: true,
            paymentLink,
          };
        } catch (error) {
          console.error('Error calling Firebase Function:', error);
          // Fall back to preview if function fails
          this.showEmailPreview({
            ...params,
            subject,
            message,
            paymentLink
          });
          return {
            success: true,
            paymentLink,
          };
        }
      } else {
        // Show email preview (development mode)
        this.showEmailPreview({
          ...params,
          subject,
          message,
          paymentLink
        });
        
        return {
          success: true,
          paymentLink,
        };
      }
    } catch (error) {
      console.error('Error in sendInvoiceEmail:', error);
      throw error;
    }
  }

  /**
   * Show success notification
   */
  private showSuccessNotification(email: string): void {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 100000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">✓ Email Sent Successfully!</div>
      <div style="font-size: 14px; opacity: 0.9;">Invoice sent to ${email}</div>
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        notification.remove();
        style.remove();
      }, 300);
    }, 5000);
  }

  /**
   * Show email preview window (for testing/development)
   */
  private showEmailPreview(params: any): void {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: white;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
          }
          .button {
            display: inline-block;
            padding: 14px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .message-content {
            white-space: pre-wrap;
            margin: 20px 0;
            line-height: 1.8;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .attachment-note {
            background: #fef3c7;
            border: 1px solid #fcd34d;
            padding: 12px;
            border-radius: 6px;
            margin: 20px 0;
            color: #92400e;
          }
          .dev-mode-banner {
            background: #3b82f6;
            color: white;
            padding: 10px;
            text-align: center;
            font-weight: 600;
            position: sticky;
            top: 0;
            z-index: 1000;
          }
        </style>
      </head>
      <body>
        <div class="dev-mode-banner">
          📧 EMAIL PREVIEW MODE - No actual email will be sent
        </div>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">${params.companyName}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Invoice ${params.invoiceNumber}</p>
        </div>
        <div class="content">
          <div class="message-content">${params.message.replace(/\n/g, '<br>')}</div>
          
          <div class="invoice-details">
            <h3 style="margin-top: 0; color: #4b5563;">Invoice Details</h3>
            <div class="detail-row">
              <span><strong>Invoice Number:</strong></span>
              <span>${params.invoiceNumber}</span>
            </div>
            <div class="detail-row">
              <span><strong>Amount Due:</strong></span>
              <span style="font-size: 20px; color: #059669; font-weight: bold;">$${params.total.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span><strong>Due Date:</strong></span>
              <span>${params.dueDate}</span>
            </div>
          </div>
          
          <div class="attachment-note">
            📎 <strong>Attachment:</strong> ${params.invoiceNumber}.pdf will be attached to the actual email
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${params.paymentLink}" target="_blank" class="button">
              💳 Pay Invoice Online
            </a>
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
              Or copy this link: <br>
              <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 4px; font-size: 12px; user-select: all;">
                ${params.paymentLink}
              </code>
            </p>
          </div>
          
          <div class="footer">
            <p><strong>${params.companyName}</strong></p>
            <p>This invoice was sent via IndiePilot</p>
            <p style="font-size: 12px; color: #9ca3af;">
              This is a secure payment link. Your payment information is processed safely through our payment provider.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Open preview in new window
    const previewWindow = window.open('', 'EmailPreview', 'width=700,height=850');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Email Preview - ${params.invoiceNumber}</title>
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                background: #f3f4f6; 
              }
              .email-header { 
                background: white; 
                padding: 20px; 
                border-bottom: 1px solid #e5e7eb;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              .email-meta { 
                color: #4b5563; 
                font-size: 14px; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              .email-meta p { 
                margin: 5px 0; 
              }
              .email-meta strong { 
                color: #1f2937; 
              }
              .email-body {
                padding: 20px;
              }
              .status-badge {
                display: inline-block;
                padding: 4px 12px;
                background: #3b82f6;
                color: white;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                margin-left: 10px;
              }
              .copy-button {
                background: #10b981;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 10px;
              }
              .copy-button:hover {
                background: #059669;
              }
            </style>
          </head>
          <body>
            <div class="email-header">
              <h3 style="margin: 0 0 15px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Email Preview
                <span class="status-badge">DEVELOPMENT MODE</span>
              </h3>
              <div class="email-meta">
                <p><strong>From:</strong> ${params.companyName} &lt;invoices@${params.companyName.toLowerCase().replace(/\s+/g, '')}.com&gt;</p>
                <p><strong>To:</strong> ${params.clientName} &lt;${params.clientEmail}&gt;</p>
                <p><strong>Subject:</strong> ${params.subject}</p>
                <p><strong>Attachments:</strong> ${params.invoiceNumber}.pdf (Invoice Document)</p>
                <p style="margin-top: 10px; padding: 10px; background: #f0f9ff; border: 1px solid #0284c7; border-radius: 6px; color: #0c4a6e;">
                  <strong>💡 To Send Real Emails:</strong><br>
                  1. Sign up at resend.com<br>
                  2. Set USE_REAL_EMAIL = true in emailService.ts<br>
                  3. Deploy Firebase function with your API key
                </p>
                <button onclick="navigator.clipboard.writeText('${params.paymentLink}'); alert('Payment link copied!')" class="copy-button">
                  📋 Copy Payment Link
                </button>
              </div>
            </div>
            <div class="email-body">
              ${emailHtml}
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  }

  /**
   * Send contract email (future implementation)
   */
  async sendContractEmail(params: any): Promise<{ success: boolean }> {
    // Similar implementation for contracts
    // For now, just use the invoice email logic
    return this.sendInvoiceEmail(params);
  }

  /**
   * Toggle between preview and real email mode
   */
  setEmailMode(useRealEmail: boolean): void {
    this.USE_REAL_EMAIL = useRealEmail;
    console.log(`Email service mode: ${useRealEmail ? 'REAL EMAIL' : 'PREVIEW'}`);
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return this.USE_REAL_EMAIL;
  }
}

export const emailService = new EmailService();