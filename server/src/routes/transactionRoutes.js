import express from 'express';
import multer from 'multer';
import {
  getTransactions,
  createTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  exportTransactions,
  uploadTransactionAttachment,
} from '../controllers/transactionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    cb(allowed.includes(file.mimetype) ? null : new Error('Unsupported attachment type'), allowed.includes(file.mimetype));
  },
});

router.use(protect);
router.get('/', getTransactions);
router.post('/', createTransaction);
router.post('/attachment', upload.single('file'), uploadTransactionAttachment);
router.get('/export', exportTransactions);
router.get('/:id', getTransactionById);
router.patch('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
