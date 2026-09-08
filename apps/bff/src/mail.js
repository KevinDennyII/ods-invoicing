import nodemailer from 'nodemailer';
import { config } from './config.js';
import { logger } from './logger.js';

const transport = config.mail.host
  ? nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.port === 465,
      auth: config.mail.user ? { user: config.mail.user, pass: config.mail.pass } : undefined,
    })
  : null;

export const sendSignInLink = async ({ to, firstName, url }) => {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const text = [
    greeting,
    '',
    'Here is your sign-in link for the OhhDenny Services billing portal:',
    url,
    '',
    'The link works once and expires in 15 minutes.',
    'If you did not request it, you can ignore this email.',
  ].join('\n');

  if (!transport) {
    // Without SMTP configured we still succeed, but the link only reaches the logs.
    logger.warn({ to }, 'SMTP not configured; sign-in link was not emailed');
    return;
  }

  await transport.sendMail({
    from: `"${config.mail.fromName}" <${config.mail.fromAddress}>`,
    to,
    subject: 'Your OhhDenny Services sign-in link',
    text,
  });
};
