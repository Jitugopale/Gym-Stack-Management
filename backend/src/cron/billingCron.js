import billingLifecycleService from '../services/billingLifecycleService.js';
import { logger } from '../utils/logger.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let timer = null;
let bootTimer = null;

/** Advance gym billing statuses (grace → soft_lock → login_block) */
export const startBillingCron = () => {
  if (timer || bootTimer) return;

  const run = async () => {
    try {
      await billingLifecycleService.advanceAllGyms();
    } catch (error) {
      logger.error('Billing cron failed:', error);
    }
  };

  bootTimer = setTimeout(() => {
    bootTimer = null;
    run();
    timer = setInterval(run, ONE_DAY_MS);
  }, 15_000);

  logger.info('Billing lifecycle cron scheduled (daily)');
};

export const stopBillingCron = () => {
  if (bootTimer) {
    clearTimeout(bootTimer);
    bootTimer = null;
  }
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};
