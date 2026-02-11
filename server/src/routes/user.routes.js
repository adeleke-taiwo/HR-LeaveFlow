const express = require('express');
const { z } = require('zod');
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

const router = express.Router();

const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    role: z.enum(['employee', 'manager', 'admin']).optional(),
    departmentId: z.string().uuid().optional(),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    departmentId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(['employee', 'manager', 'admin']),
  }),
});

router.use(authenticate);

router.get('/', authorize('admin'), userController.getUsers);
router.get('/:id', authorize('admin'), userController.getUserById);
router.post('/', authorize('admin'), validate(createUserSchema), userController.createUser);
router.patch('/:id', authorize('admin'), validate(updateUserSchema), userController.updateUser);
router.patch('/:id/role', authorize('admin'), validate(updateRoleSchema), userController.updateUserRole);
router.patch('/:id/deactivate', authorize('admin'), userController.deactivateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);

module.exports = router;
