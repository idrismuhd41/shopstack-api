import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { validateBody } from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema.js';

export const userRouter = Router();

userRouter.get('/', userController.list);
userRouter.get('/:id', userController.getById);
userRouter.post('/', validateBody(createUserSchema), userController.create);
userRouter.patch('/:id', validateBody(updateUserSchema), userController.update);
userRouter.delete('/:id', userController.delete);