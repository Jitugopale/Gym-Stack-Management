import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../config/database.js';
import config from '../../config/env.js';
import { sendLoginOtp } from './mailService.js';

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

export async function createEmailChallenge({ userId, email, realm, gymId = null }) {
  const otp = generateOtp();
  const codeHash = await bcrypt.hash(otp, config.bcryptRounds);
  const expiresAt = new Date(Date.now() + config.otp.expiresMinutes * 60 * 1000);

  await prisma.emailOtp.updateMany({
    where: { userId, realm, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const record = await prisma.emailOtp.create({
    data: {
      userId,
      realm,
      gymId,
      codeHash,
      expiresAt,
    },
  });

  const delivery = await sendLoginOtp({
    to: email,
    otp,
    expiresMinutes: config.otp.expiresMinutes,
  });

  const payload = {
    requires2fa: true,
    challengeId: record.id,
    expiresInSeconds: config.otp.expiresMinutes * 60,
    delivery: delivery.sent ? 'email' : 'skipped',
  };

  if (config.otp.exposeInResponse || !delivery.sent) {
    payload.otp = otp;
  }

  return payload;
}

export async function verifyEmailChallenge({ challengeId, otp, userId, realm }) {
  const record = await prisma.emailOtp.findFirst({
    where: {
      id: challengeId,
      userId,
      realm,
      consumedAt: null,
    },
  });

  if (!record) {
    const err = new Error('Invalid or expired verification code');
    err.status = 401;
    throw err;
  }

  if (record.expiresAt <= new Date()) {
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
    const err = new Error('Verification code expired');
    err.status = 401;
    throw err;
  }

  if (record.attemptCount >= record.maxAttempts) {
    const err = new Error('Too many attempts');
    err.status = 429;
    throw err;
  }

  const ok = await bcrypt.compare(String(otp), record.codeHash);
  await prisma.emailOtp.update({
    where: { id: record.id },
    data: {
      attemptCount: { increment: 1 },
      ...(ok ? { consumedAt: new Date() } : {}),
    },
  });

  if (!ok) {
    const err = new Error('Invalid verification code');
    err.status = 401;
    throw err;
  }

  return record;
}
