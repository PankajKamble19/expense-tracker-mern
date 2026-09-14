import express from 'express';
import { getSummaryAnalytics, getTrendAnalytics, getCategoryAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/summary', getSummaryAnalytics);
router.get('/trends', getTrendAnalytics);
router.get('/categories', getCategoryAnalytics);

export default router;
