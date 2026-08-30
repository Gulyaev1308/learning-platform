const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateSchema() {
  console.log('=== Обновление схемы базы данных PostgreSQL ===');
  try {
    // В PostgreSQL конструкция "ADD COLUMN IF NOT EXISTS" делает всю работу автоматически и без ошибок
    await pool.query(`
      ALTER TABLE lessons 
      ADD COLUMN IF NOT EXISTS leader_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

      ALTER TABLE lessons 
      ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS custom_title TEXT DEFAULT '';
    `);

    console.log('✅ Обновление схемы PostgreSQL успешно завершено!');
  } catch (error) {
    console.error('❌ Ошибка при обновлении схемы базы данных:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateSchema();
