const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, getClient } = require('../config/database');

const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (req, res, next) => {
  const client = await getClient();
  try {
    const { email, password, name, phone, role, enrollmentNumber, program, semester, departmentName } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'email, password, name, and role are required' });
    }

    const allowedRoles = ['student', 'department', 'admin', 'pvc'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, name, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, role, name`,
      [email, passwordHash, role, name, phone || null]
    );
    const user = userResult.rows[0];

    if (role === 'student') {
      if (!enrollmentNumber) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'enrollmentNumber is required for students' });
      }
      await client.query(
        `INSERT INTO students (user_id, enrollment_number, program, semester, department_name)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, enrollmentNumber, program || null, semester || null, departmentName || null]
      );
    }

    await client.query('COMMIT');

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const result = await query(
      'SELECT id, email, password_hash, role, name, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    });
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.role, u.name, u.phone, u.created_at,
              s.enrollment_number, s.program, s.semester, s.department_name
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  const client = await getClient();
  try {
    const { name, phone, program, semester } = req.body;

    await client.query('BEGIN');

    await client.query(
      `UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), updated_at = NOW()
       WHERE id = $3`,
      [name || null, phone || null, req.user.id]
    );

    if (req.user.role === 'student') {
      await client.query(
        `UPDATE students SET program = COALESCE($1, program), semester = COALESCE($2, semester)
         WHERE user_id = $3`,
        [program || null, semester || null, req.user.id]
      );
    }

    await client.query('COMMIT');

    const result = await query(
      `SELECT u.id, u.email, u.role, u.name, u.phone,
              s.enrollment_number, s.program, s.semester, s.department_name
       FROM users u LEFT JOIN students s ON s.user_id = u.id WHERE u.id = $1`,
      [req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { register, login, getProfile, updateProfile };
