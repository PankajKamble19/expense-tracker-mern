import express from 'express';
import { getBudgets, getCurrentBudget, createBudget, updateBudget } from '../controllers/budgetController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', getBudgets);
router.get('/current', getCurrentBudget);
router.post('/', createBudget);
router.patch('/:id', updateBudget);

export default router;
