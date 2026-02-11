const express = require('express');
const { z } = require('zod');
const departmentController = require('../controllers/department.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

const router = express.Router();

const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional(),
  }),
});

const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
  }),
});

router.use(authenticate);

router.get('/', departmentController.getDepartments);
router.post('/', authorize('admin'), validate(createDepartmentSchema), departmentController.createDepartment);
router.patch('/:id', authorize('admin'), validate(updateDepartmentSchema), departmentController.updateDepartment);
router.delete('/:id', authorize('admin'), departmentController.deleteDepartment);

module.exports = router;
