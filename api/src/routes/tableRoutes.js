import express from 'express';
import { getTables, updateTableStatus, addTable } from '../controllers/tableController.js';

const router = express.Router();

router.get('/', getTables);
router.post('/', addTable);
router.put('/:number', updateTableStatus);

export default router;
