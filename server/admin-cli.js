
#!/usr/bin/env node

const { AdminConsole } = require('./admin-console');

// Create admin console instance and handle commands
const adminConsole = new AdminConsole();
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Admin CLI - Use 'help' for available commands");
  adminConsole.executeCommand('help');
} else {
  adminConsole.executeCommand(args[0], ...args.slice(1))
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ CLI Error:", error);
      process.exit(1);
    });
}
