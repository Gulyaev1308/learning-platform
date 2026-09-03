const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createAdmin() {
  console.log('=== Создание администратора PostgreSQL ===');
  try {
    const passwordHash = await bcrypt.hash('ADmin20261308))', 10);
    
    await pool.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = $2, name = $3;
    `, ['admin@test.ru', passwordHash, 'Александр (Админ)', 'admin']);

    console.log('✅ Администратор успешно создан или обновлен!');
  } catch (error) {
    console.error('❌ Ошибка при создании администратора:', error);
  } finally {
    await pool.end();
  }
}

createAdmin();
