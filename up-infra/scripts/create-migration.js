#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Por favor, forneça um nome para a migration.');
  console.error('Uso: node scripts/create-migration.js <nome-da-migration>');
  process.exit(1);
}

const migrationPath = path.join(
  'src',
  'modules',
  'database',
  'migrations',
  migrationName,
);

try {
  execSync(`typeorm migration:create ${migrationPath}`, { stdio: 'inherit' });
} catch (error) {
  console.error('Erro ao criar a migration:', error.message);
  process.exit(1);
}
