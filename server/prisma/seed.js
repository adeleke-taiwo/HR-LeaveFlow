const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create departments
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: 'Engineering' },
      update: {},
      create: { name: 'Engineering', description: 'Software development and engineering' },
    }),
    prisma.department.upsert({
      where: { name: 'Human Resources' },
      update: {},
      create: { name: 'Human Resources', description: 'People operations and HR' },
    }),
    prisma.department.upsert({
      where: { name: 'Finance' },
      update: {},
      create: { name: 'Finance', description: 'Financial operations and accounting' },
    }),
    prisma.department.upsert({
      where: { name: 'Marketing' },
      update: {},
      create: { name: 'Marketing', description: 'Marketing and communications' },
    }),
    prisma.department.upsert({
      where: { name: 'Operations' },
      update: {},
      create: { name: 'Operations', description: 'Business operations and logistics' },
    }),
  ]);

  console.log(`Created ${departments.length} departments`);

  // Create leave types
  const leaveTypes = await Promise.all([
    prisma.leaveType.upsert({
      where: { name: 'Annual Leave' },
      update: {},
      create: { name: 'Annual Leave', description: 'Paid annual vacation leave', defaultDaysPerYear: 21 },
    }),
    prisma.leaveType.upsert({
      where: { name: 'Sick Leave' },
      update: {},
      create: { name: 'Sick Leave', description: 'Paid sick leave for illness or medical appointments', defaultDaysPerYear: 10 },
    }),
    prisma.leaveType.upsert({
      where: { name: 'Personal Leave' },
      update: {},
      create: { name: 'Personal Leave', description: 'Leave for personal matters', defaultDaysPerYear: 5 },
    }),
    prisma.leaveType.upsert({
      where: { name: 'Maternity Leave' },
      update: {},
      create: { name: 'Maternity Leave', description: 'Leave for expectant and new mothers', defaultDaysPerYear: 90 },
    }),
    prisma.leaveType.upsert({
      where: { name: 'Unpaid Leave' },
      update: {},
      create: { name: 'Unpaid Leave', description: 'Unpaid leave of absence', defaultDaysPerYear: 30 },
    }),
    prisma.leaveType.upsert({
      where: { name: 'Compassionate Leave' },
      update: {},
      create: { name: 'Compassionate Leave', description: 'Leave for bereavement or family emergencies', defaultDaysPerYear: 5 },
    }),
  ]);

  console.log(`Created ${leaveTypes.length} leave types`);

  // Create admin user
  const passwordHash = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: { passwordHash, firstName: 'HR', lastName: 'Admin', role: 'admin', departmentId: departments[1].id },
    create: {
      email: 'admin@company.com',
      passwordHash,
      firstName: 'HR',
      lastName: 'Admin',
      role: 'admin',
      departmentId: departments[1].id, // HR department
    },
  });

  console.log(`Created admin user: ${admin.email}`);

  // Create a sample manager
  const managerHash = await bcrypt.hash('Manager123!', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@company.com' },
    update: { passwordHash: managerHash, firstName: 'Jane', lastName: 'Smith', role: 'manager', departmentId: departments[0].id },
    create: {
      email: 'manager@company.com',
      passwordHash: managerHash,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'manager',
      departmentId: departments[0].id, // Engineering
    },
  });

  console.log(`Created manager user: ${manager.email}`);

  // Create a sample employee
  const employeeHash = await bcrypt.hash('Employee123!', 12);
  const employee = await prisma.user.upsert({
    where: { email: 'employee@company.com' },
    update: { passwordHash: employeeHash, firstName: 'John', lastName: 'Doe', role: 'employee', departmentId: departments[0].id },
    create: {
      email: 'employee@company.com',
      passwordHash: employeeHash,
      firstName: 'John',
      lastName: 'Doe',
      role: 'employee',
      departmentId: departments[0].id, // Engineering
    },
  });

  console.log(`Created employee user: ${employee.email}`);

  // Create leave balances for the current year
  const currentYear = new Date().getFullYear();
  const users = [admin, manager, employee];

  for (const user of users) {
    for (const leaveType of leaveTypes) {
      await prisma.leaveBalance.upsert({
        where: {
          userId_leaveTypeId_year: {
            userId: user.id,
            leaveTypeId: leaveType.id,
            year: currentYear,
          },
        },
        update: {},
        create: {
          userId: user.id,
          leaveTypeId: leaveType.id,
          year: currentYear,
          allocated: leaveType.defaultDaysPerYear,
          used: 0,
          pending: 0,
        },
      });
    }
  }

  console.log(`Created leave balances for ${users.length} users`);

  // Create sample leave requests
  const annualLeave = leaveTypes[0]; // Annual Leave
  const sickLeave = leaveTypes[1];   // Sick Leave
  const personalLeave = leaveTypes[2]; // Personal Leave

  const sampleLeaves = [
    // Approved leaves (visible on calendar + exportable)
    {
      requesterId: employee.id,
      leaveTypeId: annualLeave.id,
      startDate: new Date(currentYear, 0, 15), // Jan 15
      endDate: new Date(currentYear, 0, 19),   // Jan 19
      totalDays: 5,
      reason: 'Family vacation',
      status: 'approved',
      reviewerId: manager.id,
      reviewComment: 'Approved',
      reviewedAt: new Date(currentYear, 0, 10),
      currentApprovalStep: 'completed',
    },
    {
      requesterId: employee.id,
      leaveTypeId: sickLeave.id,
      startDate: new Date(currentYear, 1, 3),  // Feb 3
      endDate: new Date(currentYear, 1, 4),    // Feb 4
      totalDays: 2,
      reason: 'Medical appointment and recovery',
      status: 'approved',
      reviewerId: manager.id,
      reviewComment: 'Get well soon',
      reviewedAt: new Date(currentYear, 1, 2),
      currentApprovalStep: 'completed',
    },
    {
      requesterId: manager.id,
      leaveTypeId: annualLeave.id,
      startDate: new Date(currentYear, 2, 10), // Mar 10
      endDate: new Date(currentYear, 2, 14),   // Mar 14
      totalDays: 5,
      reason: 'Spring break trip',
      status: 'approved',
      reviewerId: admin.id,
      reviewComment: 'Enjoy',
      reviewedAt: new Date(currentYear, 2, 5),
      currentApprovalStep: 'completed',
    },
    {
      requesterId: employee.id,
      leaveTypeId: personalLeave.id,
      startDate: new Date(currentYear, 3, 21), // Apr 21
      endDate: new Date(currentYear, 3, 22),   // Apr 22
      totalDays: 2,
      reason: 'Personal errands',
      status: 'approved',
      reviewerId: manager.id,
      reviewComment: 'Approved',
      reviewedAt: new Date(currentYear, 3, 18),
      currentApprovalStep: 'completed',
    },
    // Pending leaves
    {
      requesterId: employee.id,
      leaveTypeId: annualLeave.id,
      startDate: new Date(currentYear, 4, 5),  // May 5
      endDate: new Date(currentYear, 4, 9),    // May 9
      totalDays: 5,
      reason: 'Summer holiday planning',
      status: 'pending',
      currentApprovalStep: 'manager',
    },
    {
      requesterId: manager.id,
      leaveTypeId: sickLeave.id,
      startDate: new Date(currentYear, 4, 12), // May 12
      endDate: new Date(currentYear, 4, 13),   // May 13
      totalDays: 2,
      reason: 'Dental surgery',
      status: 'pending',
      currentApprovalStep: 'manager',
    },
    // Rejected leave
    {
      requesterId: employee.id,
      leaveTypeId: annualLeave.id,
      startDate: new Date(currentYear, 0, 2),  // Jan 2
      endDate: new Date(currentYear, 0, 10),   // Jan 10
      totalDays: 7,
      reason: 'Extended new year break',
      status: 'rejected',
      reviewerId: manager.id,
      reviewComment: 'Team deadline conflict',
      reviewedAt: new Date(currentYear, 0, 1),
      currentApprovalStep: 'completed',
    },
  ];

  for (const leave of sampleLeaves) {
    await prisma.leave.create({ data: leave });
  }
  console.log(`Created ${sampleLeaves.length} sample leave requests`);

  // Update leave balances to reflect approved/pending leaves
  const employeeAnnualBal = await prisma.leaveBalance.findFirst({
    where: { userId: employee.id, leaveTypeId: annualLeave.id, year: currentYear },
  });
  if (employeeAnnualBal) {
    await prisma.leaveBalance.update({
      where: { id: employeeAnnualBal.id },
      data: { used: 5, pending: 5 }, // 5 approved (Jan) + 5 pending (May)
    });
  }

  const employeeSickBal = await prisma.leaveBalance.findFirst({
    where: { userId: employee.id, leaveTypeId: sickLeave.id, year: currentYear },
  });
  if (employeeSickBal) {
    await prisma.leaveBalance.update({
      where: { id: employeeSickBal.id },
      data: { used: 2 }, // 2 approved (Feb)
    });
  }

  const employeePersonalBal = await prisma.leaveBalance.findFirst({
    where: { userId: employee.id, leaveTypeId: personalLeave.id, year: currentYear },
  });
  if (employeePersonalBal) {
    await prisma.leaveBalance.update({
      where: { id: employeePersonalBal.id },
      data: { used: 2 }, // 2 approved (Apr)
    });
  }

  const managerAnnualBal = await prisma.leaveBalance.findFirst({
    where: { userId: manager.id, leaveTypeId: annualLeave.id, year: currentYear },
  });
  if (managerAnnualBal) {
    await prisma.leaveBalance.update({
      where: { id: managerAnnualBal.id },
      data: { used: 5 }, // 5 approved (Mar)
    });
  }

  const managerSickBal = await prisma.leaveBalance.findFirst({
    where: { userId: manager.id, leaveTypeId: sickLeave.id, year: currentYear },
  });
  if (managerSickBal) {
    await prisma.leaveBalance.update({
      where: { id: managerSickBal.id },
      data: { pending: 2 }, // 2 pending (May)
    });
  }

  console.log('Updated leave balances');
  console.log('\nSeed completed successfully!');
  console.log('\nDefault accounts:');
  console.log('  Admin:    admin@company.com    / Admin123!');
  console.log('  Manager:  manager@company.com  / Manager123!');
  console.log('  Employee: employee@company.com / Employee123!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
