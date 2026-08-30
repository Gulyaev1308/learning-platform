const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedDB() {
  console.log('=== Тотальное заполнение PostgreSQL эталонными данными ===');
  try {
    const saltRounds = 10;
    const adminHash = await bcrypt.hash('admin123', saltRounds);
    const leaderHash = await bcrypt.hash('leader123', saltRounds);
    const studentHash = await bcrypt.hash('student123', saltRounds);

    // Очищаем таблицу пользователей сбросом ID
    await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');

    // 1. Создаем Админа
    await pool.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, $4)
    `, ['admin@test.ru', adminHash, 'Александр (Админ)', 'admin']);
    console.log('✅ ADMIN создан. Логин: admin@test.ru | Пароль: admin123');

    // 2. Создаем Лидера (ИСПРАВЛЕНО: берем [0].id из массива rows)
    const leaderRes = await pool.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, ['leader@test.ru', leaderHash, 'Иван (Лидер)', 'leader']);
    
    const leaderId = leaderRes.rows[0].id; // ВОТ ТУТ БЫЛА ОШИБКА! Теперь берем первый элемент [0]
    console.log(`✅ LEADER создан. ID: ${leaderId} | Логин: leader@test.ru | Пароль: leader123`);

    // 3. Создаем Ученика
    await pool.query(`
      INSERT INTO users (email, password_hash, name, role, leader_id)
      VALUES ($1, $2, $3, $4, $5)
    `, ['student@test.ru', studentHash, 'Петр (Ученик)', 'student', leaderId]);
    console.log('✅ STUDENT создан. Логин: student@test.ru | Пароль: student123');

    console.log('\n🚀 База данных успешно инициализирована боевыми профилями!');
  } catch (error) {
    console.error('❌ Критическая ошибка сидинга базы:', error);
    process.exit(1);
  } {
    await pool.end();
  }
}

seedDB();
