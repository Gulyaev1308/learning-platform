const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateStructure() {
  console.log('=== Обновление структуры курсов в PostgreSQL ===');
  try {
    // Безопасно проверяем и добавляем новые колонки, если это необходимо
    await pool.query(`
      ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content TEXT;
      ALTER TABLE lessons ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
    `);

    console.log('✅ Структура успешно обновлена!');
  } catch (error) {
    console.error('❌ Ошибка при обновлении структуры:', error);
  } finally {
    await pool.end();
  }
}

updateStructure();
