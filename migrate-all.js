const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) walkDir(dirPath, callback);
    else callback(path.join(dir, f));
  });
}

// Список файлов для замены
walkDir('app/api', (filePath) => {
  if (!filePath.endsWith('route.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Заменяем db.prepare(...).get(...) → (await db.query(...)).rows[0]
  content = content.replace(/db\.prepare\(`([^`]+)`\)\.get\(([^)]*)\)/g, (match, sql, params) => {
    let idx = 1;
    const newSql = sql.replace(/\?/g, () => `$${idx++}`);
    const cleanParams = params.trim();
    if (cleanParams) return `(await db.query(\`${newSql}\`, [${cleanParams}])).rows[0]`;
    return `(await db.query(\`${newSql}\`)).rows[0]`;
  });
  
  // Заменяем db.prepare('...').get(...) с одинарными кавычками
  content = content.replace(/db\.prepare\('([^']+)'\)\.get\(([^)]*)\)/g, (match, sql, params) => {
    let idx = 1;
    const newSql = sql.replace(/\?/g, () => `$${idx++}`);
    const cleanParams = params.trim();
    if (cleanParams) return `(await db.query('${newSql}', [${cleanParams}])).rows[0]`;
    return `(await db.query('${newSql}')).rows[0]`;
  });
  
  // Заменяем db.prepare(...).all(...)
  content = content.replace(/db\.prepare\(`([^`]+)`\)\.all\(([^)]*)\)/g, (match, sql, params) => {
    let idx = 1;
    const newSql = sql.replace(/\?/g, () => `$${idx++}`);
    const cleanParams = params.trim();
    if (cleanParams) return `(await db.query(\`${newSql}\`, [${cleanParams}])).rows`;
    return `(await db.query(\`${newSql}\`)).rows`;
  });
  
  content = content.replace(/db\.prepare\('([^']+)'\)\.all\(([^)]*)\)/g, (match, sql, params) => {
    let idx = 1;
    const newSql = sql.replace(/\?/g, () => `$${idx++}`);
    const cleanParams = params.trim();
    if (cleanParams) return `(await db.query('${newSql}', [${cleanParams}])).rows`;
    return `(await db.query('${newSql}')).rows`;
  });
  
  // Заменяем db.prepare(...).run(...)
  content = content.replace(/db\.prepare\(`([^`]+)`\)\.run\(([^)]*)\)/g, (match, sql, params) => {
    let idx = 1;
    const newSql = sql.replace(/\?/g, () => `$${idx++}`);
    const cleanParams = params.trim();
    if (cleanParams) return `await db.query(\`${newSql}\`, [${cleanParams}])`;
    return `await db.query(\`${newSql}\`)`;
  });
  
  content = content.replace(/db\.prepare\('([^']+)'\)\.run\(([^)]*)\)/g, (match, sql, params) => {
    let idx = 1;
    const newSql = sql.replace(/\?/g, () => `$${idx++}`);
    const cleanParams = params.trim();
    if (cleanParams) return `await db.query('${newSql}', [${cleanParams}])`;
    return `await db.query('${newSql}')`;
  });
  
  // Заменяем db.exec(...)
  content = content.replace(/db\.exec\(/g, 'await db.query(');
  
  // Заменяем result.lastInsertRowid → result.rows[0].id
  content = content.replace(/result\.lastInsertRowid/g, 'result.rows[0].id');
  
  fs.writeFileSync(filePath, content);
});

console.log('✅ Миграция завершена!');
