const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateSettings() {
  console.log('=== Обновление настроек в PostgreSQL ===');
  try {
    // Пример перевода логики на Postgres: обновляем заголовок у админа
    await pool.query(`
      UPDATE users 
      SET custom_title = $1 
      WHERE role = 'admin';
    `, ['Главная панель обучения']);

    console.log('✅ Настройки успешно обновлены!');
  } catch (error) {
    console.error('❌ Ошибка при обновлении настроек:', error);
  } finally {
    await pool.end();
  }
}

updateSettings();
