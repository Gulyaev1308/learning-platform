const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://learning_admin:MesaSuperPassword2026!@learning-postgres:5432/learning_platform_db"
});

async function createAdmin() {
  console.log('=== Создание администратора PostgreSQL ===');
  try {
    const passwordHash = await bcrypt.hash('НОВЫЙ_ПАРОЛЬ', 10);

    await pool.query(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE
      SET password_hash = $2, name = $3;
    `, ['admin@test.ru', passwordHash, 'Евгений (Админ)', 'admin']);

    console.log('✅ Администратор успешно создан или обновлен!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
  }
}

createAdmin();
