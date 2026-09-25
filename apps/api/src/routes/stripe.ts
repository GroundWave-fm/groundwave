import { Router } from 'express';
import { requireAuth } from '../auth';

const router = Router();

/**
 * POST /api/v1/stripe/checkout/founder-package
 * Initiates a Stripe Checkout session for the $49.99 Founder Package.
 * Note: Currently disabled during pre-alpha.
 */
router.post('/checkout/founder-package', requireAuth, async (req, res) => {
  // TODO: Activate when ready for MVP launch
  // 1. Check if user already has founder package
  // 2. Create Stripe Checkout session for Price ID XXXX
  // 3. Return session URL to client
  
  return res.status(501).json({
    error: 'Not Implemented',
    message: 'The Founder Package is not yet available for purchase. Join the waitlist!',
  });
});

export default router;
