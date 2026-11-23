import config from '../../config/env.js';
import { logger } from '../../utils/logger.js';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function isConfigured() {
  return Boolean(config.mail.brevoApiKey && config.mail.brevoEmail);
}

export async function sendMail({ to, subject, text, html }) {
  if (!isConfigured()) {
    logger.warn(`Brevo not configured — skip email to ${to}: ${subject}`);
    return { sent: false, reason: 'not_configured' };
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': config.mail.brevoApiKey.trim(),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: config.appDisplayName,
        email: config.mail.brevoEmail.trim(),
      },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    logger.error(`Email failed to ${to}: HTTP ${response.status} ${raw}`);
    return { sent: false, reason: 'smtp_failed' };
  }

  const data = await response.json().catch(() => ({}));
  logger.info(`Email sent to ${to}: ${data.messageId || 'ok'}`);
  return { sent: true, messageId: data.messageId };
}

export async function sendLoginOtp({ to, otp, expiresMinutes }) {
  const app = config.appDisplayName;
  const subject = `${app} login verification code`;
  const text = `Your ${app} login code is ${otp}. It expires in ${expiresMinutes} minutes. Do not share this code.`;
  const html = `
    <p>Your <strong>${app}</strong> login code is:</p>
    <p style="font-size:24px;letter-spacing:4px;"><strong>${otp}</strong></p>
    <p>Expires in ${expiresMinutes} minutes. Do not share this code.</p>
  `;
  return sendMail({ to, subject, text, html });
}

export async function sendGymOwnerInvite({
  to,
  ownerName,
  gymName,
  slug,
  email,
  password,
}) {
  const app = config.appDisplayName;
  const loginUrl = `${config.appUrl}/gym/${slug}/login`;
  const subject = `${app}: ${gymName} account ready`;
  const text = [
    `Hi ${ownerName},`,
    ``,
    `Your gym "${gymName}" is ready on ${app}.`,
    `Login: ${loginUrl}`,
    `Email: ${email}`,
    `Temporary password: ${password}`,
    ``,
    `Please sign in and change your password after first login.`,
  ].join('\n');
  const html = `
    <p>Hi ${ownerName},</p>
    <p>Your gym <strong>${gymName}</strong> is ready on <strong>${app}</strong>.</p>
    <p><a href="${loginUrl}">Open gym login</a></p>
    <ul>
      <li>Email: <strong>${email}</strong></li>
      <li>Temporary password: <strong>${password}</strong></li>
    </ul>
    <p>Please change your password after first login.</p>
  `;
  return sendMail({ to, subject, text, html });
}

export async function sendGymStaffInvite({
  to,
  staffName,
  gymName,
  slug,
  email,
  password,
}) {
  const app = config.appDisplayName;
  const loginUrl = `${config.appUrl}/gym/${slug}/login`;
  const subject = `${app}: staff access for ${gymName}`;
  const text = [
    `Hi ${staffName},`,
    ``,
    `You were added as staff at "${gymName}" on ${app}.`,
    `Login: ${loginUrl}`,
    `Email: ${email}`,
    `Temporary password: ${password}`,
    ``,
    `No 2FA is required for staff. Change your password after first login.`,
  ].join('\n');
  const html = `
    <p>Hi ${staffName},</p>
    <p>You were added as staff at <strong>${gymName}</strong>.</p>
    <p><a href="${loginUrl}">Open gym login</a></p>
    <ul>
      <li>Email: <strong>${email}</strong></li>
      <li>Temporary password: <strong>${password}</strong></li>
    </ul>
    <p>Staff accounts do not use 2FA. Change your password after first login.</p>
  `;
  return sendMail({ to, subject, text, html });
}

export async function sendPlatformStaffInvite({
  to,
  staffName,
  email,
  password,
}) {
  const app = config.appDisplayName;
  const loginUrl = `${config.appUrl}/admin/login`;
  const subject = `${app}: platform staff access`;
  const text = [
    `Hi ${staffName},`,
    ``,
    `You were added as platform staff on ${app}.`,
    `Login: ${loginUrl}`,
    `Email: ${email}`,
    `Temporary password: ${password}`,
    ``,
    `Change your password after first login.`,
  ].join('\n');
  const html = `
    <p>Hi ${staffName},</p>
    <p>You were added as <strong>platform staff</strong> on ${app}.</p>
    <p><a href="${loginUrl}">Open admin login</a></p>
    <ul>
      <li>Email: <strong>${email}</strong></li>
      <li>Temporary password: <strong>${password}</strong></li>
    </ul>
    <p>Change your password after first login.</p>
  `;
  return sendMail({ to, subject, text, html });
}

export async function sendGymInvoiceEmail({
  to,
  gymName,
  invoiceRef,
  planName,
  amount,
  dueDate,
}) {
  const app = config.appDisplayName;
  const due = new Date(dueDate).toLocaleDateString();
  const subject = `${app} invoice ${invoiceRef} — ${gymName}`;
  const text = [
    `Invoice ${invoiceRef} for ${gymName}`,
    `Plan: ${planName}`,
    `Amount: ₹${amount}`,
    `Due: ${due}`,
    ``,
    `Pay before the due date to avoid grace / soft-lock / login block.`,
  ].join('\n');
  const html = `
    <p>Invoice <strong>${invoiceRef}</strong> for <strong>${gymName}</strong></p>
    <ul>
      <li>Plan: ${planName}</li>
      <li>Amount: <strong>₹${amount}</strong></li>
      <li>Due: ${due}</li>
    </ul>
    <p>Unpaid renewals move to grace → soft lock (view only) → login blocked.</p>
  `;
  return sendMail({ to, subject, text, html });
}

export default {
  sendMail,
  sendLoginOtp,
  sendGymOwnerInvite,
  sendGymStaffInvite,
  sendPlatformStaffInvite,
  sendGymInvoiceEmail,
  isConfigured,
};
