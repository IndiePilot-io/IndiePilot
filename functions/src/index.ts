import * as functions from 'firebase-functions';
  import { Resend } from 'resend';
  const resend = new Resend(functions.config().resend.key);

export const helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from IndiePilot!");
});
export const sendInvoiceEmail = functions.https.onCall(async (data, context) => {
  const resend = new Resend('re_28hQBJsM_BTvyAeZwTRjdDrtj1rHW258Q');
  
  await resend.emails.send({
    from: 'invoices@yourdomain.com',
    to: data.clientEmail,
    subject: data.subject,
    html: data.emailHtml,
    attachments: [{ filename: 'invoice.pdf', content: data.pdfBase64 }]
  });
});