import express from 'express';
import {
  getAccounts,
  createAccount,
  getAccountById,
  updateAccount,
  deleteAccount,
} from '../controllers/accountController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', getAccounts);
router.post('/', createAccount);
router.get('/:id', getAccountById);
router.patch('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;
