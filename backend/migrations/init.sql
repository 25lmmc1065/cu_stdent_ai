CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'department', 'admin', 'pvc')),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  head_name VARCHAR(255),
  head_email VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrollment_number VARCHAR(50) UNIQUE NOT NULL,
  program VARCHAR(255),
  semester INTEGER,
  department_name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(255),
  department_id UUID REFERENCES departments(id),
  priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected', 'escalated')),
  language VARCHAR(10) DEFAULT 'en',
  ai_analysis JSONB,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  department_response TEXT,
  internal_notes TEXT
);

CREATE TABLE IF NOT EXISTS appeals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_student_id ON complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_department_id ON complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);
CREATE INDEX IF NOT EXISTS idx_appeals_complaint_id ON appeals(complaint_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

INSERT INTO departments (name, code, head_name, head_email, description) VALUES
  ('Academic Affairs', 'ACAD', 'Dr. John Smith', 'acad@university.edu', 'Handles academic policies and curriculum matters'),
  ('Examination', 'EXAM', 'Dr. Mary Johnson', 'exam@university.edu', 'Manages examinations and results'),
  ('Hostel & Accommodation', 'HOSTEL', 'Mr. Robert Brown', 'hostel@university.edu', 'Manages student accommodation and hostel facilities'),
  ('Library', 'LIB', 'Ms. Sarah Davis', 'library@university.edu', 'Manages library resources and services'),
  ('Sports & Recreation', 'SPORTS', 'Mr. James Wilson', 'sports@university.edu', 'Manages sports facilities and recreational activities'),
  ('Transportation', 'TRANS', 'Mr. Michael Taylor', 'transport@university.edu', 'Manages university transportation services'),
  ('Scholarship & Financial Aid', 'SCHOL', 'Ms. Emily Anderson', 'scholarship@university.edu', 'Handles scholarships and financial assistance'),
  ('IT Services', 'IT', 'Mr. David Martinez', 'it@university.edu', 'Provides technical support and IT infrastructure'),
  ('Student Welfare', 'WELFARE', 'Dr. Lisa Thompson', 'welfare@university.edu', 'Supports student wellbeing and counseling'),
  ('Campus Safety & Security', 'SAFETY', 'Mr. Thomas Jackson', 'safety@university.edu', 'Ensures campus safety and security'),
  ('Health Services', 'HEALTH', 'Dr. Jennifer White', 'health@university.edu', 'Provides medical and health services'),
  ('Canteen & Food Services', 'CANTEEN', 'Mr. Charles Harris', 'canteen@university.edu', 'Manages food services and canteen operations'),
  ('Administration', 'ADMIN', 'Ms. Patricia Clark', 'admin@university.edu', 'General administrative services')
ON CONFLICT (name) DO UPDATE SET
  code = EXCLUDED.code,
  head_name = EXCLUDED.head_name,
  head_email = EXCLUDED.head_email,
  description = EXCLUDED.description;
