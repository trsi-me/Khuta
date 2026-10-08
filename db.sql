CREATE DATABASE IF NOT EXISTS khuta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE khuta;

CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'committee_head', 'faculty_member', 'department_head') NOT NULL,
    department_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    progress DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    progress DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    goal_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    progress DECIMAL(5,2) DEFAULT 0.00,
    deadline DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    user_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO departments (name) VALUES 
('علوم الحاسب'),
('الفيزياء'),
('الكيمياء'),
('الأحياء'),
('الكلية');

INSERT INTO users (name, email, password, role, department_id) VALUES 
('مدير النظام', 'admin@khuta.com', '', 'admin', NULL),
('رئيس لجنة علوم الحاسب', 'head.cs@khuta.com', '', 'committee_head', 1),
('د. أحمد محمد', 'ahmed.cs@khuta.com', '', 'faculty_member', 1),
('د. سارة علي', 'sara.cs@khuta.com', '', 'faculty_member', 1),
('رئيس قسم علوم الحاسب', 'dept.cs@khuta.com', '', 'department_head', 1),
('رئيس لجنة الفيزياء', 'head.physics@khuta.com', '', 'committee_head', 2),
('د. خالد الفيزياء', 'khalid.physics@khuta.com', '', 'faculty_member', 2),
('رئيس قسم الفيزياء', 'dept.physics@khuta.com', '', 'department_head', 2),
('رئيس لجنة الكيمياء', 'head.chemistry@khuta.com', '', 'committee_head', 3),
('د. فاطمة الكيمياء', 'fatima.chemistry@khuta.com', '', 'faculty_member', 3),
('رئيس قسم الكيمياء', 'dept.chemistry@khuta.com', '', 'department_head', 3),
('رئيس لجنة الأحياء', 'head.biology@khuta.com', '', 'committee_head', 4),
('د. عمر الأحياء', 'omar.biology@khuta.com', '', 'faculty_member', 4),
('رئيس قسم الأحياء', 'dept.biology@khuta.com', '', 'department_head', 4);

INSERT INTO plans (department_id, title) VALUES 
(1, 'الخطة التشغيلية للفصل الدراسي الأول 2024'),
(1, 'الخطة التشغيلية للفصل الدراسي الثاني 2024'),
(2, 'الخطة التشغيلية للفيزياء 2024'),
(3, 'الخطة التشغيلية للكيمياء 2024'),
(4, 'الخطة التشغيلية للأحياء 2024'),
(5, 'الخطة التشغيلية للكلية 2024');

INSERT INTO goals (plan_id, title) VALUES 
(1, 'تحسين جودة التعليم والتدريس'),
(1, 'تطوير البرامج الأكاديمية'),
(1, 'تعزيز البحث العلمي'),
(1, 'تطوير المختبرات والمرافق'),
(2, 'تنفيذ مشاريع التخرج'),
(2, 'تنظيم المؤتمرات والورش'),
(3, 'تطوير منهج الفيزياء التطبيقية'),
(3, 'إقامة ورش عمل للطلاب'),
(4, 'تحديث تجارب المختبرات'),
(4, 'تعزيز التعاون البحثي'),
(5, 'تطوير برامج الأحياء الجزيئية'),
(5, 'تنظيم رحلات علمية'),
(6, 'تحسين البنية التحتية للكلية'),
(6, 'تعزيز الشراكات الخارجية');

INSERT INTO activities (goal_id, title, deadline, progress) VALUES 
(1, 'مراجعة وتحديث المقررات الدراسية', '2024-12-31', 75.00),
(1, 'تدريب أعضاء هيئة التدريس على أحدث طرق التدريس', '2024-11-30', 50.00),
(1, 'تقييم أداء الطلاب وتحليل النتائج', '2024-12-15', 100.00),
(2, 'إعداد مقترحات برامج أكاديمية جديدة', '2025-01-15', 30.00),
(2, 'مراجعة الخطة الدراسية الحالية', '2024-12-20', 60.00),
(3, 'نشر أوراق علمية في مجلات محكمة', '2025-02-28', 25.00),
(3, 'تنظيم ندوة علمية', '2024-12-10', 80.00),
(4, 'تحديث أجهزة المختبرات', '2025-01-30', 40.00),
(4, 'صيانة المرافق التعليمية', '2024-12-05', 100.00),
(5, 'إشراف على مشاريع التخرج', '2025-05-15', 10.00),
(5, 'تقييم مشاريع الطلاب', '2025-04-30', 0.00),
(6, 'تنظيم مؤتمر علمي', '2025-03-20', 15.00),
(6, 'ورش عمل تدريبية', '2024-12-25', 65.00),
(7, 'مراجعة محتوى المقررات', '2024-12-18', 70.00),
(7, 'تطوير تجارب عملية', '2025-01-10', 45.00),
(8, 'ورشة فيزياء تطبيقية', '2024-12-12', 90.00),
(9, 'شراء مواد كيميائية جديدة', '2024-12-08', 100.00),
(9, 'تحديث دليل التجارب', '2024-12-22', 55.00),
(10, 'مشروع بحثي مشترك', '2025-06-30', 20.00),
(11, 'تطوير برنامج الأحياء الجزيئية', '2025-02-15', 35.00),
(12, 'رحلة علمية لحديقة الحيوان', '2024-12-28', 85.00),
(13, 'تحديث شبكة الإنترنت', '2024-12-30', 95.00),
(13, 'تحسين الإضاءة في القاعات', '2025-01-05', 50.00),
(14, 'اتفاقية تعاون مع جامعة محلية', '2025-03-15', 5.00);

UPDATE goals SET progress = (
    SELECT AVG(progress) FROM activities WHERE goal_id = goals.id
);

UPDATE plans SET progress = (
    SELECT AVG(progress) FROM goals WHERE plan_id = plans.id
);
