const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ApiError = require('../utils/apiError');

class WorkflowService {
  /**
   * Get all approval workflows
   */
  async getAllWorkflows() {
    return await prisma.approvalWorkflow.findMany({
      include: {
        leaveType: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Get workflow by leave type ID
   */
  async getWorkflowByLeaveType(leaveTypeId) {
    return await prisma.approvalWorkflow.findUnique({
      where: { leaveTypeId },
      include: { leaveType: true }
    });
  }

  /**
   * Create approval workflow
   */
  async createWorkflow(data) {
    const { leaveTypeId, requiresHR, minDaysForHR } = data;

    // Check if leave type exists
    const leaveType = await prisma.leaveType.findUnique({
      where: { id: leaveTypeId }
    });

    if (!leaveType) {
      throw new ApiError(404, 'Leave type not found');
    }

    // Check if workflow already exists
    const existing = await prisma.approvalWorkflow.findUnique({
      where: { leaveTypeId }
    });

    if (existing) {
      throw new ApiError(400, 'Workflow already exists for this leave type');
    }

    return await prisma.approvalWorkflow.create({
      data: {
        leaveTypeId,
        requiresHR: requiresHR || false,
        minDaysForHR: minDaysForHR || null
      },
      include: {
        leaveType: true
      }
    });
  }

  /**
   * Update approval workflow
   */
  async updateWorkflow(id, data) {
    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id }
    });

    if (!workflow) {
      throw new ApiError(404, 'Workflow not found');
    }

    return await prisma.approvalWorkflow.update({
      where: { id },
      data: {
        requiresHR: data.requiresHR,
        minDaysForHR: data.minDaysForHR
      },
      include: {
        leaveType: true
      }
    });
  }

  /**
   * Delete approval workflow
   */
  async deleteWorkflow(id) {
    const workflow = await prisma.approvalWorkflow.findUnique({
      where: { id }
    });

    if (!workflow) {
      throw new ApiError(404, 'Workflow not found');
    }

    await prisma.approvalWorkflow.delete({
      where: { id }
    });

    return { message: 'Workflow deleted successfully' };
  }

  /**
   * Check if leave requires HR approval
   */
  async requiresHRApproval(leaveTypeId, totalDays) {
    const workflow = await this.getWorkflowByLeaveType(leaveTypeId);

    if (!workflow) {
      return false;
    }

    // Check if HR is always required
    if (workflow.requiresHR) {
      return true;
    }

    // Check if days exceed threshold
    if (workflow.minDaysForHR && totalDays >= workflow.minDaysForHR) {
      return true;
    }

    return false;
  }
}

module.exports = new WorkflowService();
