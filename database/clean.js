const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function cleanDB() {
  console.log('=== Очистка базы данных PostgreSQL ===');
  try {
    // В Postgres TRUNCATE очищает таблицы гораздо быстрее, а RESTART IDENTITY сбрасывает счетчики ID к 1
    await pool.query('TRUNCATE TABLE quiz_answers RESTART IDENTITY CASCADE');
    console.log('✅ quiz_answers очищены и счетчик ID сброшен');

    await pool.query('TRUNCATE TABLE progress RESTART IDENTITY CASCADE');
    console.log('✅ progress очищен и счетчик ID сброшен');

    await pool.query('TRUNCATE TABLE lessons RESTART IDENTITY CASCADE');
    console.log('✅ lessons очищены и счетчик ID сброшен');

    // Подсчет оставшихся пользователей
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Пользователи сохранены: ${result.rows[0].count}`);

    console.log('\n=== Готово! База очищена ===');
    console.log('Уроки, прогресс и ответы удалены. Пользователи в безопасности.');

  } catch (error) {
    console.error('❌ Ошибка при очистке базы данных:', error);
  } finally {
    await pool.end();
  }
}

cleanDB();
