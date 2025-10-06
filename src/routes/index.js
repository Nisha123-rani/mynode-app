import express from 'express';
import todosRoutes from './todos.js';

const router = express.Router();

// Mount todos routes at /todos
router.use('/todos', todosRoutes);

// Export default router
export default router;

