import nodemailer from 'nodemailer';
import config from '../config/env.js';
import logger from '../utils/logger.js';

let transporter = null;

if (config.smtp.isConfigured) {
  try {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
    logger.info(`SMTP mailer initialized for ${config.smtp.host}:${config.smtp.port}`);
  } catch (err) {
    logger.warn(`Failed to initialize SMTP transporter: ${err.message}. Email delivery disabled.`);
  }
} else {
  logger.info('SMTP is not configured. Email notifications will be safely simulated/skipped.');
}

export const isEmailConfigured = () => {
  return Boolean(transporter && config.smtp.isConfigured);
};

/**
 * Generic email sending helper.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!isEmailConfigured()) {
    logger.info(`[Email skipped - SMTP not configured] To: ${to} | Subject: "${subject}"`);
    return {
      sent: false,
      reason: 'SMTP is not configured on this server.',
    };
  }

  try {
    const info = await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      text,
      html,
    });
    logger.info(`Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return {
      sent: true,
      messageId: info.messageId,
    };
  } catch (err) {
    logger.error(`Error sending email to ${to}: ${err.message}`);
    return {
      sent: false,
      error: err.message,
    };
  }
};

/**
 * Sends a booking confirmation email after payment is completed.
 */
export const sendBookingConfirmationEmail = async ({
  patientEmail,
  patientName,
  appointmentNo,
  doctorName,
  specialization,
  hospitalName,
  hospitalAddress,
  date,
  startTime,
  amount,
  transactionRef,
}) => {
  const subject = `MediLink Appointment Confirmation: #${appointmentNo} with Dr. ${doctorName}`;
  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0d9488; color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">MediLink Sri Lanka</h1>
        <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">Doctor Channeling Confirmation</p>
      </div>
      <div style="padding: 24px;">
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your appointment has been successfully booked and confirmed. Below are your channeling details:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <div style="font-size: 28px; font-weight: bold; color: #0d9488; text-align: center; margin-bottom: 12px;">
            Appointment No: ${appointmentNo}
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Doctor:</td>
              <td style="padding: 6px 0; font-weight: bold;">Dr. ${doctorName} (${specialization})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Hospital / Centre:</td>
              <td style="padding: 6px 0; font-weight: bold;">${hospitalName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Location:</td>
              <td style="padding: 6px 0;">${hospitalAddress}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Session Date:</td>
              <td style="padding: 6px 0; font-weight: bold;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Starting Time:</td>
              <td style="padding: 6px 0; font-weight: bold;">${startTime}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Paid Amount:</td>
              <td style="padding: 6px 0; font-weight: bold;">LKR ${amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Payment Ref:</td>
              <td style="padding: 6px 0; font-family: monospace;">${transactionRef}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          <strong>Important Instructions:</strong><br/>
          • Please arrive at least 15 minutes prior to the session start time.<br/>
          • Present your appointment number at the channeling counter.<br/>
          • You may cancel your booking up to 2 hours before the session start time via your MediLink patient dashboard.
        </p>
      </div>
      <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #94a3b8;">
        MediLink Sri Lanka • Reliable Doctor Channeling Platform
      </div>
    </div>
  `;

  return sendEmail({
    to: patientEmail,
    subject,
    html,
    text: `Your appointment with Dr. ${doctorName} at ${hospitalName} is confirmed for ${formattedDate} at ${startTime}. Appointment No: ${appointmentNo}. Paid: LKR ${amount}. Ref: ${transactionRef}.`,
  });
};

/**
 * Sends schedule cancellation notification to affected patients.
 */
export const sendScheduleCancellationEmail = async ({
  patientEmail,
  patientName,
  appointmentNo,
  doctorName,
  hospitalName,
  date,
  startTime,
}) => {
  const subject = `URGENT: MediLink Session Cancelled - Dr. ${doctorName}`;
  const formattedDate = new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #fee2e2; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #dc2626; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">Session Cancelled Notification</h2>
      </div>
      <div style="padding: 24px;">
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>We regret to inform you that Dr. <strong>${doctorName}</strong>'s channeling session scheduled for <strong>${formattedDate} at ${startTime}</strong> at <strong>${hospitalName}</strong> has been cancelled by the doctor or administration.</p>
        
        <p>Your appointment <strong>#${appointmentNo}</strong> has been marked as cancelled. If you have already paid, any eligible refund will be reviewed and processed separately according to the payment provider's refund procedure.</p>
        <p>We apologize for any inconvenience caused. You can visit MediLink to re-book another available slot at your convenience.</p>
      </div>
      <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #94a3b8;">
        MediLink Sri Lanka Support
      </div>
    </div>
  `;

  return sendEmail({
    to: patientEmail,
    subject,
    html,
    text: `Important: The channeling session for Dr. ${doctorName} at ${hospitalName} on ${formattedDate} at ${startTime} has been cancelled. Your appointment #${appointmentNo} is cancelled. Any eligible refund will be reviewed and processed separately according to the payment provider's refund procedure.`,
  });
};

export default {
  isEmailConfigured,
  sendEmail,
  sendBookingConfirmationEmail,
  sendScheduleCancellationEmail,
};
