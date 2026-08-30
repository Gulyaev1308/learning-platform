const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testSystem() {
  console.log('=== Тестирование подключения к PostgreSQL ===');
  try {
    const res = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Система работает корректно!');
    console.log('Время на сервере БД:', res.rows[0].current_time);
  } catch (error) {
    console.error('❌ Ошибка тестирования системы:', error);
  } finally {
    await pool.end();
  }
}

testSystem();
