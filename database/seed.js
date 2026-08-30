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

    // Удаляем всё и сбрасываем счетчики ID до 1
    await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE TABLE lessons RESTART IDENTITY CASCADE');

    // 1. Создаем эталонного Админа
    await pool.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, $4)
    `, ['admin@test.ru', adminHash, 'Александр (Админ)', 'admin']);
    console.log('   ✔ ADMIN: admin@test.ru | admin123');

    // 2. Создаем эталонного Лидера
    const leaderRes = await pool.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, ['leader@test.ru', leaderHash, 'Иван (Лидер)', 'leader']);
    
    // В pg результат возвращается в массив rows. Забираем ID первого элемента:
    const leaderId = leaderRes.rows[0].id; 
    console.log(`   ✔ LEADER (ID: ${leaderId}): leader@test.ru | leader123`);

    // 3. Создаем эталонного Ученика
    await pool.query(`
      INSERT INTO users (email, password_hash, name, role, leader_id)
      VALUES ($1, $2, $3, $4, $5)
    `, ['student@test.ru', studentHash, 'Петр (Ученик)', 'student', leaderId]);
    console.log('   ✔ STUDENT: student@test.ru | student123');

    // 4. Закладываем первый видео-урок для встроенного плеера
    await pool.query(`
      INSERT INTO lessons (title, type, content, block, module, order_index, leader_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, ['Введение в платформу (Видео-урок)', 'video', '/videos/lesson1.mp4', 1, 1, 1, null]);
    console.log('   ✔ ВИДЕО-УРОК: Добавлен в Блок 1, Модуль 1. Файл: /videos/lesson1.mp4');

    console.log('\n🚀 База данных успешно подготовлена к запуску реальных людей!');
  } catch (error) {
    console.error('❌ Ошибка подготовки данных:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDB();
