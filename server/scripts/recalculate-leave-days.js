require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { calculateLeaveDays } = require('../src/utils/dateUtils');

const prisma = new PrismaClient();

async function recalculateLeaveDays() {
  try {
    console.log('Starting leave days recalculation...\n');

    // Fetch all leaves with their leave types
    const leaves = await prisma.leave.findMany({
      include: {
        leaveType: true,
      },
    });

    console.log(`Found ${leaves.length} leave records to process\n`);

    let updated = 0;
    let unchanged = 0;

    for (const leave of leaves) {
      const oldDays = leave.totalDays;
      const newDays = calculateLeaveDays(leave.startDate, leave.endDate, leave.leaveType.name);

      if (oldDays !== newDays) {
        console.log(`Leave ID ${leave.id}:`);
        console.log(`  Type: ${leave.leaveType.name}`);
        console.log(`  Dates: ${leave.startDate.toISOString().split('T')[0]} to ${leave.endDate.toISOString().split('T')[0]}`);
        console.log(`  Old days: ${oldDays} → New days: ${newDays}`);
        console.log(`  Difference: ${newDays - oldDays}\n`);

        // Update the leave record
        await prisma.leave.update({
          where: { id: leave.id },
          data: { totalDays: newDays },
        });

        // Update leave balance if applicable
        const year = leave.startDate.getFullYear();
        const balance = await prisma.leaveBalance.findUnique({
          where: {
            userId_leaveTypeId_year: {
              userId: leave.requesterId,
              leaveTypeId: leave.leaveTypeId,
              year,
            },
          },
        });

        if (balance) {
          const daysDiff = newDays - oldDays;

          if (leave.status === 'pending') {
            // Adjust pending balance
            await prisma.leaveBalance.update({
              where: { id: balance.id },
              data: { pending: { increment: daysDiff } },
            });
          } else if (leave.status === 'approved') {
            // Adjust used balance
            await prisma.leaveBalance.update({
              where: { id: balance.id },
              data: { used: { increment: daysDiff } },
            });
          }
          console.log(`  ✓ Updated balance for user\n`);
        }

        updated++;
      } else {
        unchanged++;
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total leaves processed: ${leaves.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Unchanged: ${unchanged}`);
    console.log('\n✓ Recalculation complete!');

  } catch (error) {
    console.error('Error recalculating leave days:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

recalculateLeaveDays();
