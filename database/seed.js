const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedDB() {
  console.log('=== ЖЕСТКАЯ ОЧИСТКА И ЗАПОЛНЕНИЕ ПОЛЬЗОВАТЕЛЕЙ POSTGRES ===');
  try {
    const saltRounds = 10;
    const adminHash = await bcrypt.hash('admin123', saltRounds);
    const leaderHash = await bcrypt.hash('leader123', saltRounds);
    const studentHash = await bcrypt.hash('student123', saltRounds);

    // Полностью очищаем таблицы перед заполнением
    await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE TABLE lessons RESTART IDENTITY CASCADE');

    // 1. Создаем Администратора
    await pool.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, $4)
    `, ['admin@test.ru', adminHash, 'Александр (Админ)', 'admin']);
    console.log('   ✔ ADMIN: admin@test.ru | admin123');

    // 2. Создаем Лидера (СТРОГО ЧЕРЕЗ rows[0].id)
    const leaderRes = await pool.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, ['leader@test.ru', leaderHash, 'Иван (Лидер)', 'leader']);
    
    const leaderId = leaderRes.rows[0].id; // ИСПРАВЛЕНО НА СТАНДАРТ PG
    console.log(`   ✔ LEADER (ID: ${leaderId}): leader@test.ru | leader123`);

    // 3. Создаем Ученика, привязанного к Лидеру
    await pool.query(`
      INSERT INTO users (email, password_hash, name, role, leader_id)
      VALUES ($1, $2, $3, $4, $5)
    `, ['student@test.ru', studentHash, 'Петр (Ученик)', 'student', leaderId]);
    console.log('   ✔ STUDENT: student@test.ru | student123');

    // 4. Закладываем первый видео-урок для встроенного плеера
    await pool.query(`
      INSERT INTO lessons (title, type, content, block, module, order_index, leader_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, ['Введение в платформу (Видео-урок)', 'video', 'lesson1.mp4', 1, 1, 1, null]);
    console.log('   ✔ ВИДЕО-УРОК: Файл: lesson1.mp4 добавлен в Блок 1, Модуль 1');

    console.log('\n🚀 База данных успешно наполнена эталонными профилями!');
  } catch (error) {
    console.error('❌ Критическая ошибка сидинга базы:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDB();
