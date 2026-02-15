const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');

async function getDepartments() {
  return prisma.department.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { name: 'asc' },
  });
}

async function createDepartment({ name, description }) {
  return prisma.department.create({ data: { name, description } });
}

async function updateDepartment(id, { name, description }) {
  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) throw new ApiError(404, 'Department not found');

  const data = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;

  return prisma.department.update({ where: { id }, data });
}

async function deleteDepartment(id) {
  const dept = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!dept) throw new ApiError(404, 'Department not found');
  if (dept._count.users > 0) {
    throw new ApiError(400, 'Cannot delete department with assigned users');
  }

  await prisma.department.delete({ where: { id } });
}

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment };
