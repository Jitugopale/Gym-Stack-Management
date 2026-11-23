import { startBillingCron, stopBillingCron } from './billingCron.js';

export const startAllCrons = () => {
  startBillingCron();
};

export const stopAllCrons = () => {
  stopBillingCron();
};

export { startBillingCron, stopBillingCron };
