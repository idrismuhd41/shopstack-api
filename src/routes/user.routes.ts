import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { validateBody } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/authenticate-token.js';
import { authorizeRole } from '../middleware/authorize-role.js';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema.js';

export const userRouter = Router();

// Static /me MUST come before /:id — otherwise "me" matches :id.
userRouter.get('/me', authenticateToken, userController.me);

userRouter.get('/:id', authenticateToken, userController.getById);
userRouter.patch('/:id', authenticateToken, validateBody(updateUserSchema), userController.update);

userRouter.get('/', authenticateToken, authorizeRole('ADMIN'), userController.list);
userRouter.post('/', authenticateToken, authorizeRole('ADMIN'), validateBody(createUserSchema), userController.create);
userRouter.delete('/:id', authenticateToken, authorizeRole('ADMIN'), userController.delete);