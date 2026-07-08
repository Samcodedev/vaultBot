import { Router } from 'express';

import {
  createNombaAccount,
  initiateDirectDebit,
  checkMandateStatus,
  getPlanMandateDetails,
  triggerDebitMandate,
  handleNombaWebhook,
  syncTransactions,
} from '../controllers/nomba.controller.js';
import { authenticateUser } from '../middlewares/index.js';
import {
  createVirtualAccountValidator,
  createDirectDebitMandateValidator,
} from '../middlewares/validators/index.js';

const router = Router();

// Public webhook endpoint
router.post('/webhook/payment', handleNombaWebhook);

router.use(authenticateUser);

router.post('/virtual-account', createVirtualAccountValidator, createNombaAccount);

// Nomba Direct Debit Mandate Routes
router.post('/direct-debit/mandate', createDirectDebitMandateValidator, initiateDirectDebit);
router.get('/direct-debit/mandate/status/:planId', checkMandateStatus);
router.get('/direct-debit/mandate/:planId', getPlanMandateDetails);
router.post('/direct-debit/debit-mandate/:planId', triggerDebitMandate);
router.post('/sync-transactions', syncTransactions);

export default router;
