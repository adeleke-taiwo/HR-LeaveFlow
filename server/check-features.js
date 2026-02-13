const fs = require('fs');
const path = require('path');

console.log('\n====================================');
console.log('HR-LeaveFlow Feature Verification');
console.log('====================================\n');

const checks = {
  backend: {
    services: [
      'src/services/exportService.js',
      'src/services/workflowService.js',
    ],
    controllers: [
      'src/controllers/workflow.controller.js',
    ],
    routes: [
      'src/routes/workflow.routes.js',
    ],
  },
  frontend: {
    pages: [
      '../client/src/pages/ReportsPage.jsx',
      '../client/src/pages/AdminWorkflowsPage.jsx',
    ],
    charts: [
      '../client/src/components/charts/LeavesTrendChart.jsx',
      '../client/src/components/charts/LeaveTypeDistribution.jsx',
      '../client/src/components/charts/DepartmentUtilization.jsx',
    ],
    dashboard: [
      '../client/src/components/dashboard/UpcomingLeaves.jsx',
      '../client/src/components/dashboard/QuickActions.jsx',
      '../client/src/components/dashboard/LeaveTrendsChart.jsx',
    ],
  }
};

let passed = 0;
let failed = 0;

Object.keys(checks).forEach(category => {
  console.log(`\n${category.toUpperCase()} FILES:`);
  Object.keys(checks[category]).forEach(type => {
    console.log(`\n  ${type}:`);
    checks[category][type].forEach(file => {
      const exists = fs.existsSync(path.join(__dirname, file));
      if (exists) {
        console.log(`    ✅ ${file}`);
        passed++;
      } else {
        console.log(`    ❌ ${file}`);
        failed++;
      }
    });
  });
});

console.log('\n====================================');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('====================================\n');
