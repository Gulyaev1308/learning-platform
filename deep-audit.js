const fs = require('fs');
const path = require('path');

console.log('\x1b[33m%s\x1b[0m', '==================================================');
console.log('\x1b[33m%s\x1b[0m', '    ТОТАЛЬНЫЙ ГЛУБОКИЙ АУДИТ КОДОВОЙ БАЗЫ ПРОЕКТА  ');
console.log('\x1b[33m%s\x1b[0m', '==================================================\n');

const directoriesToScan = ['./app', './src', './database', './lib', './components'];
const forbiddenPatterns = [
  { regex: /require\(['"]better-sqlite3['"]\)/g, desc: "Импорт better-sqlite3" },
  { regex: /import.*from.*['"]better-sqlite3['"]/g, desc: "ES6 Импорт better-sqlite3" },
  { regex: /\.prepare\(/g, desc: "Метод SQLite .prepare()" },
  { regex: /\.get\(/g, desc: "Метод SQLite .get() (В Postgres нужно: res.rows[0])" },
  { regex: /\.all\(/g, desc: "Метод SQLite .all() (В Postgres нужно: res.rows)" },
  { regex: /\.run\(/g, desc: "Метод SQLite .run()" },
  { regex: /sqlite_sequence/g, desc: "Системная таблица SQLite автоинкремента" }
];

let totalIssues = 0;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  forbiddenPatterns.forEach(pattern => {
    let match;
    // Сбрасываем индекс регулярки
    pattern.regex.lastIndex = 0;
    
    lines.forEach((line, index) => {
      if (pattern.regex.test(line)) {
        console.log(`\x1b[31m[КРИТИЧНО]\x1b[0m Файл: \x1b[36m${filePath}\x1b[0m (Строка ${index + 1})`);
        console.log(`          └─ Ошибка: Найдена логика SQLite -> \x1b[33m${pattern.desc}\x1b[0m`);
        console.log(`          └─ Код: \x1b[90m${line.trim()}\x1b[0m\n`);
        totalIssues++;
      }
    });
  });
}

function traverseDirectory(currentDir) {
  if (!fs.existsSync(currentDir)) return;
  const files = fs.readdirSync(currentDir);

  files.forEach(file => {
    const fullPath = path.join(currentDir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        traverseDirectory(fullPath);
      }
    } else if (/\.(js|ts|jsx|tsx)$/.test(file)) {
      scanFile(fullPath);
    }
  });
}

// Запуск сканирования
directoriesToScan.forEach(dir => traverseDirectory(dir));

console.log('\x1b[33m%s\x1b[0m', '==================================================');
if (totalIssues === 0) {
  console.log('\x1b[32m%s\x1b[0m', '🎉 ИТОГ: Весь проект досконально проверен. Остатков SQLite не обнаружено!');
  process.exit(0);
} else {
  console.log('\x1b[31m%s\x1b[0m', `🚨 ИТОГ: Найдено скрытых ошибок архитектуры: ${totalIssues}`);
  console.log('\x1b[35m%s\x1b[0m', 'Эти файлы блокируют работу Лидеров и вызывают ошибки 403/401.');
  process.exit(1);
}
