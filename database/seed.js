const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedDB() {
  console.log('=== Заполнение базы данных тестовыми пользователями ===');
  try {
    const saltRounds = 10;
    const adminHash = await bcrypt.hash('admin123', saltRounds);
    const leaderHash = await bcrypt.hash('leader123', saltRounds);
    const studentHash = await bcrypt.hash('student123', saltRounds);

    // Полностью очищаем старых пользователей перед заполнением
    await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');

    // 1. Админ
    await pool.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, $4)
    `, ['admin@test.ru', adminHash, 'Александр (Админ)', 'admin']);
    console.log('✅ ADMIN создан. Логин: admin@test.ru | Пароль: admin123');

    // 2. Лидер
    const leaderRes = await pool.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, ['leader@test.ru', leaderHash, 'Иван (Лидер)', 'leader']);
    const leaderId = leaderRes.rows[0].id; // Исправлено: забираем id из первого элемента массива rows
    console.log('✅ LEADER создан. Логин: leader@test.ru | Пароль: leader123');

    // 3. Ученик
    await pool.query(`
      INSERT INTO users (email, password_hash, name, role, leader_id)
      VALUES ($1, $2, $3, $4, $5)
    `, ['student@test.ru', studentHash, 'Петр (Ученик)', 'student', leaderId]);
    console.log('✅ STUDENT создан. Логин: student@test.ru | Пароль: student123');

    console.log('\n🚀 База данных успешно заполнена! Можно тестировать.');
  } catch (error) {
    console.error('❌ Ошибка при заполнении базы данных:', error);
  } finally {
    await pool.end();
  }
}

seedDB();
