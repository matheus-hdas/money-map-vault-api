const { spawn } = require('node:child_process');

let servicesProcess;
let nestProcess;

const runCommand = (command, args, callback) => {
  const process = spawn(command, args, { stdio: 'inherit', shell: true });

  process.on('close', (code) => {
    callback(code);
  });
};

const stopServices = () => {
  if (servicesProcess) {
    servicesProcess.kill();
  }
  runCommand('pnpm', ['run', 'services:stop'], () => {
    console.log('Services stopped.');
    process.exit();
  });
};

// Main function
const runDev = () => {
  // Start the services
  servicesProcess = runCommand('pnpm', ['run', 'services:up'], (code) => {
    if (code !== 0) return;

    runCommand('pnpm', ['run', 'services:wait:database'], (code) => {
      if (code !== 0) return;

      runCommand('pnpm', ['run', 'migrations:up'], (code) => {
        if (code !== 0) return;

        nestProcess = runCommand(
          'nest',
          ['start', '--watch', '--env-file=.env.development'],
          () => {
            stopServices();
          },
        );

        process.on('SIGINT', () => {
          console.log('\nStopping services...');
          if (nestProcess) {
            nestProcess.kill();
          }
        });
      });
    });
  });
};

// Execute the main function
runDev();
