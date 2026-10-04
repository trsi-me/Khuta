# خطة

## 1 ما هو المشروع

منصة ويب لإدارة الخطط التشغيلية للأقسام الأكاديمية: قسم، ثم خطة، ثم أهداف، ثم أنشطة، ثم ملفات أدلة. الاسم الظاهر في الواجهة والملف السابق هو «خطة». قاعدة البيانات اسمها `khuta`.

## 2 لماذا وُجد

الملف السابق يصف الهدف بأنه تنظيم الأهداف والأنشطة وربطها بالأدلة ومتابعة نسبة الإنجاز. الكود يطابق هذا الوصف: جداول `departments` و`plans` و`goals` و`activities` و`documents`، ودالة `updateGoalProgress` تعيد حساب متوسط النسب.

## 3 المستخدمون

أدوار العمود `role` في `db.sql`: `admin` و`committee_head` و`faculty_member` و`department_head`. البذرة: 14 مستخدماً على 5 أقسام (علوم الحاسب، الفيزياء، الكيمياء، الأحياء، الكلية). قسم «الكلية» بلا مستخدم مرتبط في الإدراج. الحسابات التجريبية مذكورة بالبريد في `db.sql` وفي `pages/login.html`. كلمات المرور مخزنة كتجزئة ولا تُعاد في هذا الملف.

تناقض: `pages/login.html` يعرض بريداً تجريبياً `faculty@khuta.com` لعضو هيئة التدريس. إدراج `db.sql` لا يحتوي هذا البريد، ويحتوي `ahmed.cs@khuta.com` و`sara.cs@khuta.com`.

## 4 القدرات

- عرض الأقسام وعدد خططها من `php/api/departments.php`.
- إضافة وحذف قسم لحساب `admin` فقط.
- عرض الخطط وإضافتها وحذفها حسب الدور في `php/api/plans.php`.
- إضافة وحذف الأهداف في `php/api/goals.php` مع تحديث تقدم الخطة عبر `updatePlanProgress`.
- إضافة وحذف الأنشطة وتحديث `progress` في `php/api/activities.php` مع `updateGoalProgress`.
- رفع ملف حتى 10 ميجابايت وعرضه عبر `uploads/serve.php` وحذفه.
- إضافة مستخدم وحذفه من `php/api/users.php` للأدمن، مع منع حذف المستخدم الحالي.
- صفحات ثابتة: `pages/about.html` و`pages/help.html` و`pages/contact.html`.

## 5 كيف يعمل

`assets/js/script.js` يتحقق من الجلسة عبر `php/api/auth.php`. بعد الدخول تُحمَّل الأقسام ثم الخطط ثم الأهداف والأنشطة والملفات بطلبات `fetch`. نسب الخطة والهدف تُخزَّن في الأعمدة `progress` وتُعاد حساباتها من المتوسط عند إضافة نشاط أو حذف أو تحديث نسبة.

## 6 أمثلة واقعية

تحديث نسبة نشاط يرسل `PUT` إلى `php/api/activities.php` بجسم JSON فيه `id` و`progress`. الدالة `updateGoalProgress` تحسب `AVG(progress)` لأنشطة الهدف ثم `AVG` لأهداف الخطة وتكتب القيم في `goals.progress` و`plans.progress`.

لون الحالة يُحسب في نفس الملف عند `GET`: إذا `progress >= 100` فالحالة `completed` واللون `green`. إذا كان الموعد قبل اليوم فالحالة `overdue` واللون `red`. إذا الفرق 7 أيام أو أقل فالحالة `approaching` واللون `orange`. غير ذلك الحالة `on_track` واللون `green`.

تناقض مع الملف السابق: المؤشر الأخضر هناك موصوف لحالة الإنجاز 100% فقط. الكود يعطي الأخضر أيضاً لمسار `on_track`.

## 7 رحلة المستخدم

1. فتح `index.html`. إن لم توجد جلسة فالسكربت يوجه إلى `pages/login.html` (هذا سلوك موثق في الملف السابق ويطابقه فحص الجلسة في `script.js` عبر `auth.php`).
2. `php/login.php` يتحقق بـ `password_verify` ويحفظ `user_id` و`role` و`department_id` في الجلسة.
3. المستخدم يختار قسماً ثم خطة ثم يضيف هدفاً أو نشاطاً أو يرفع دليلاً حسب ما تسمح به الواجهة والواجهة البرمجية.
4. `php/logout.php` يستدعي `session_destroy`.

## 8 الوحدات

| الوحدة | المسار |
| --- | --- |
| الواجهة | `index.html` و`assets/js/script.js` و`assets/css/style.css` |
| الدخول والخروج | `php/login.php` و`php/logout.php` و`php/api/auth.php` |
| الأقسام والخطط والأهداف والأنشطة والملفات والمستخدمون | `php/api/*.php` |
| تقديم الملف | `uploads/serve.php` |
| الصفحات التعريفية | `pages/` |

## 9 الجهات والكيانات

الأقسام البذرية الخمسة أعلاه. لا جدول كلية منفصل: «الكلية» صف في `departments`. لا شركات خارجية.

## 10 الصلاحيات

ما يفرضه PHP:

| الإجراء | الأدوار في `checkRole` |
| --- | --- |
| إضافة أو حذف قسم، وإدارة المستخدمين | `admin` |
| إضافة أو حذف خطة | `admin` و`committee_head` (رئيس اللجنة يُجبر `department_id` من الجلسة عند الإضافة، والحذف مقيد بقسمه) |
| إضافة أو حذف هدف أو نشاط | `admin` و`committee_head` |
| رفع دليل | `admin` و`committee_head` و`faculty_member` |
| حذف دليل | `admin` و`committee_head` |
| قراءة الخطط | الأدمن يرى الكل أو قسماً محدداً. غيره يرى خطط `department_id` في جلسته فقط |
| قراءة ملف عبر `serve.php` | الأدمن، أو مستخدم قسم الملف نفسه |

تناقض مع الملف السابق:

- السابق: الأدمن يعرض الخطط بلا تعديل للمحتوى. الكود: `plans.php` و`goals.php` و`activities.php` و`documents.php` تسمح للأدمن بالإضافة والحذف والرفع.
- السابق: عضو هيئة التدريس يحذف أدلته فقط. الكود: `DELETE` في `documents.php` يستدعي `checkRole(['admin', 'committee_head'])` بلا شرط `user_id`. الواجهة في `script.js` تظهر الحذف لنفس الدورين. عضو هيئة التدريس لا يملك مسار حذف في هذه الملفات.
- السابق: رئيس القسم عرض فقط. القراءة مقيدة بقسمه في `plans.php`. تحديث النسبة عبر `PUT` في `activities.php` لا يستدعي `checkRole`، فيقبله أي مستخدم لديه جلسة، بمن في ذلك رئيس القسم، رغم أن `script.js` يظهر حقل النسبة لـ `admin` و`committee_head` و`faculty_member` فقط.

## 11 الأتمتة

متوسط التقدم في `updateGoalProgress` و`updatePlanProgress`، وحساب لون الموعد عند جلب الأنشطة، و`updated_at` عبر `ON UPDATE CURRENT_TIMESTAMP`. ملف `db.sql` يحدّث المتوسطات مرة بعد الإدراج. لا cron.

## 12 أثر الوحدات على بعضها

حذف قسم يحذف خططه بـ `ON DELETE CASCADE`، وحذف خطة يحذف أهدافها، وحذف هدف يحذف أنشطته، وحذف نشاط يحذف وثائقه. حذف مستخدم يحذف وثائقه لأن `documents.user_id` عليه `ON DELETE CASCADE`. تغيير نسبة نشاط يعيد كتابة نسبة الهدف ثم نسبة الخطة. رفع فاشل بعد نقل الملف يستدعي `unlink` إذا فشل `INSERT`.

## 13 المعجم

| المصطلح | المعنى |
| --- | --- |
| خطة | صف `plans` لقسم |
| هدف | صف `goals` لخطة |
| نشاط | صف `activities` بموعد `deadline` ونسبة `progress` |
| دليل | صف `documents` يشير إلى ملف تحت `uploads/` |
| التقدم | متوسط نسب الأبناء، النوع `DECIMAL(5,2)` |

## 14 الأسئلة الشائعة

| السؤال | الجواب |
| --- | --- |
| هل نموذج «اتصل بنا» يُحفظ؟ | النموذج موجود في `pages/contact.html`. لا معالج `fetch` ولا جدول رسائل في `db.sql` |
| كم الخطة والهدف والنشاط في البذرة؟ | 6 خطط و14 هدفاً و24 نشاطاً، كما في `db.sql` وكما ذكر الملف السابق |
| هل كلمة المرور نص صريح في القاعدة؟ | العمود `password` يُملأ بتجزئة. التحقق في `php/login.php` عبر `password_verify` |
| ما إصدار PHP؟ | الملف السابق يذكر PHP 8.2.12. غير موثق داخل ملفات الإصدار في المشروع |

## 15 المعمارية

```
المتصفح (index.html + script.js)
        |
        +-- php/login.php --------+
        +-- php/api/auth.php      |
        +-- php/api/departments   |
        +-- php/api/plans         +-- php/config.php -- MySQL khuta
        +-- php/api/goals         |
        +-- php/api/activities    |
        +-- php/api/documents ----+-- مجلد uploads/
        +-- php/api/users         |
        +-- uploads/serve.php ----+
```

## 16 التقنيات المستخدمة

HTML وCSS وJavaScript في المتصفح. PHP مع `mysqli` والجلسات على الخادم. MySQL بجداول InnoDB وترميز `utf8mb4`. خطوط Frutiger LT Arabic المحلية في `assets/fonts/`. لا إطار JavaScript ولا Composer.

## 17 شجرة الملفات

```
Khuta/
├── index.html
├── db.sql
├── README.md
├── pages/
│   ├── login.html
│   ├── about.html
│   ├── help.html
│   └── contact.html
├── assets/css/style.css
├── assets/js/script.js
├── assets/fonts/
├── assets/images/Logo.png
├── assets/images/Icon.ico
├── php/config.php
├── php/login.php
├── php/logout.php
├── php/api/auth.php
├── php/api/departments.php
├── php/api/plans.php
├── php/api/goals.php
├── php/api/activities.php
├── php/api/documents.php
├── php/api/users.php
└── uploads/.htaccess
    uploads/serve.php
```

## 18 الواجهة الأمامية

صفحة واحدة تفاعلية `index.html` مع شريط وأقسام وقائمة جانبية ونوافذ من `script.js` (`showModal` و`showAddPlanModal` و`showAddGoalModal` و`showAddActivityModal` و`showUploadDocumentModal` و`showManageUsersModal`). الصفحات في `pages/` ثابتة مع تذييل وروابط. أيقونة التبويب `assets/images/Icon.ico` موجودة في الصفحات HTML. الهيدر المتحرك وقائمة الشاشات الصغيرة مذكوران في الملف السابق ويطابقهما وجود `initHeaderScroll` و`initMobileMenu` في `script.js`.

## 19 الواجهة الخلفية

نقاط `php/api` ترجع JSON. `checkAuth` يوجه إلى `BASE_URL` زائد `pages/login.html` عند غياب `user_id`. `checkRole` يرجع 403 ونص «غير مصرح لك بهذا الإجراء». الاتصال `mysqli` مع `utf8mb4`.

## 20 تدفق الطلب

مثال: عضو يرفع دليلاً.

```
المتصفح -> POST php/api/documents.php (activity_id + file)
  -> checkAuth
  -> checkRole admin | committee_head | faculty_member
  -> التحقق من نوع MIME القادم في $_FILES ومن الحجم (10 * 1024 * 1024)
  -> اسم uniqid + time + الامتداد
  -> move_uploaded_file إلى uploads/
  -> INSERT documents
```

ثم العرض يطلب `GET uploads/serve.php?file=` مع `basename`، ويتحقق أن الصف موجود وأن القسم يطابق الجلسة أو أن الدور `admin`.

## 21 جداول قاعدة البيانات

| الجدول | أعمدة أساسية | العلاقة |
| --- | --- | --- |
| departments | id, name فريد, created_at | أب للخطط والمستخدمين |
| users | name, email فريد, password, role, department_id | FK إلى departments وعلى الحذف SET NULL |
| plans | department_id, title, progress | FK CASCADE |
| goals | plan_id, title, progress | FK CASCADE |
| activities | goal_id, title, progress, deadline | FK CASCADE |
| documents | activity_id, user_id, file_path, file_name, file_size, upload_date | FK CASCADE للنشاط والمستخدم |

## 22 نقاط النهاية

| المسار | الطرق الظاهرة |
| --- | --- |
| `php/api/auth.php` | فحص الجلسة |
| `php/api/departments.php` | GET وPOST وDELETE |
| `php/api/plans.php` | GET وPOST وDELETE |
| `php/api/goals.php` | GET وPOST وDELETE |
| `php/api/activities.php` | GET وPOST وPUT وDELETE |
| `php/api/documents.php` | GET وPOST وDELETE |
| `php/api/users.php` | GET وPOST وDELETE |
| `php/login.php` | POST |
| `php/logout.php` | إنهاء الجلسة |
| `uploads/serve.php` | GET للمعامل `file` |
| `index.html` و`pages/*.html` | صفحات |

## 23 المصادقة

`session_start` في `php/config.php`. الدخول بالبريد وكلمة المرور. الجلسة تحفظ معرف المستخدم ودوره وقسمه. لا `session_regenerate_id` في `php/login.php`. لا رمز CSRF على النماذج أو واجهات JSON.

## 24 ضوابط الأمان الموجودة فعلياً

- استعلامات `prepare` و`bind_param`.
- `password_hash` عند إنشاء مستخدم و`password_verify` عند الدخول.
- `sanitize` عبر `strip_tags` و`htmlspecialchars` على نصوص تُمرر لها.
- `basename` في `serve.php`.
- `uploads/.htaccess` يحتوي `deny from all`، والتقديم يتم عبر `serve.php`.
- قائمة أنواع MIME للرفع وحد 10 ميجابايت. النوع المأخوذ هو `$file['type']` كما أرسله العميل، بلا `finfo`.
- منع حذف حساب الجلسة الحالية.

غير موجود: CSRF، وتقييد رفع الملف بقسم النشاط، وتدقيق دور على `PUT` للنسبة.

## 25 الإعدادات

ثوابت `php/config.php`: `DB_HOST` و`DB_USER` و`DB_PASS` و`DB_NAME` و`UPLOAD_DIR` و`BASE_URL`. القيم الحالية في الملف: المضيف `localhost`، المستخدم `root`، كلمة مرور الاتصال فارغة، اسم القاعدة `khuta`، و`BASE_URL` يساوي `http://localhost/khuta/`. لا `.env`.

## 26 التكاملات

غير موجود في الملفات الحالية. لا بريد ولا تخزين سحابي. نموذج الاتصال لا يغادر الصفحة.

## 27 المهام المجدولة

غير موجود في الملفات الحالية. لون التأخير يُحسب عند كل جلب أنشطة بمقارنة تاريخ الخادم.

## 28 تخزين الملفات

المجلد `uploads/` بجانب `serve.php`. المسار النسبي المحفوظ `uploads/` زائد اسم فريد. الامتدادات المقبولة في الواجهة: pdf وjpg وjpeg وpng وdoc وdocx وtxt. الأنواع في PHP قائمة MIME المذكورة في `documents.php`.

## 29 السجلات

غير موجود في الملفات الحالية. أخطاء الاتصال تُطبع عبر `die("Connection failed: " . $conn->connect_error)`.

## 30 التثبيت

1. خادم PHP مع امتداد `mysqli` وMySQL. الملف السابق يذكر XAMPP وPHP 8.2.12 وMySQL 5.7 أو أحدث. رقم PHP غير موجود في ملفات المشروع.
2. استيراد `db.sql` فينشئ القاعدة `khuta` والجداول والبذرة ويحدّث المتوسطات.
3. مطابقة ثوابت `php/config.php`. إذا تغيّر مسار النشر عن `/khuta/` فالرابط `BASE_URL` يحتاج القيمة المطابقة، لأن `checkAuth` يبني منه عنوان الدخول.
4. التأكد من وجود `uploads/` وقابلية الكتابة. الكود ينشئ المجلد بـ `mkdir` عند أول رفع إن غاب.
5. فتح `index.html` من خادم الويب لا كملف محلي، حتى تعمل طلبات `php/`.

الملف السابق يشرح نسخ المجلد إلى `htdocs` أو تغيير `DocumentRoot`. ذلك إجراء بيئة وليس أمراً داخل المستودع.

## 31 دليل التطوير

المنطق التفاعلي في `assets/js/script.js`. كل مورد في ملف PHP مستقل تحت `php/api`. أي دور جديد يُضاف إلى `ENUM` في `users.role` وإلى `in_array` في `users.php` ثم إلى فحوصات `checkRole` والواجهة. تقدم الخطة لا يُدخل يدوياً من نموذج الخطة، بل يُشتق من الأبناء.

## 32 النشر

غير موثق بملف نشر. `BASE_URL` ثابت على `localhost`. مناسب لبيئة Apache أو ما يعادلها تشغّل PHP. مجلد `uploads` يحتاج بقاء الملفات بين عمليات إعادة التشغيل، فهو ليس ملفاً مؤقتاً داخل الطلب فقط.

## 33 النسخ الاحتياطي

غير موثق. اللازم نسخه: قاعدة `khuta` ومجلد `uploads/` لأن المسارات في `documents.file_path` تشير إلى ملفات فعلية.

## 34 استكشاف الأخطاء

| الظاهرة | الاستنتاج من الكود |
| --- | --- |
| Connection failed | MySQL متوقف أو الثوابت لا تطابق القاعدة `khuta` |
| توجيه متكرر إلى الدخول | لا `user_id` في الجلسة، أو `BASE_URL` لا يطابق مسار المشروع فيُحمَّل عنوان خاطئ |
| 403 عند الرفع | الدور ليس ضمن `admin` و`committee_head` و`faculty_member` |
| الدخول بالبريد الظاهر في صفحة الدخول لعضو الهيئة يفشل | ذلك البريد غير موجود في إدراج `db.sql` |
| الملف 403 بعد الرفع | `serve.php` يرفض إن لم يطابق القسم، أو إن لم يُوجد الصف بمسار `uploads/` زائد الاسم |

## 35 الاعتماديات

لا مدير حزم. PHP مع `mysqli` و`fileinfo` (دالة `mime_content_type` في `serve.php`) وجلسات. MySQL/MariaDB مع InnoDB و`utf8mb4`. إصدار PHP 8.2.12 مذكور في الملف السابق فقط.

## 36 القيود المعروفة

- لا CSRF.
- `PUT` النسبة بلا فحص دور.
- فحص نوع الملف من ترويسة العميل.
- نموذج الاتصال بلا حفظ.
- قسم الكلية في البذرة بلا مستخدمين.
- تناقضات الصلاحيات بين الملف السابق والكود مذكورة في القسم 10.
- رسائل فشل الاتصال تكشف نص `mysqli`.

## 37 الحالة الحالية

تطبيق خطط تشغيلية يعمل بجلسة PHP وواجهة صفحة واحدة، مع بذرة أقسام وخطط. الصفحات التعريفية ثابتة. لا رقم إصدار تطبيق.

## 38 قرارات معمارية

- استنتاج من الكود: التقدم المخزن يُعاد حسابه من المتوسط حتى تبقى الخطة والهدف متسقين مع الأنشطة بعد كل تعديل يمر عبر `updateGoalProgress` أو `updatePlanProgress`.
- استنتاج من الكود: الملفات لا تُخدم مباشرة لأن `.htaccess` يمنع الوصول والمسار العام يمر من `serve.php`.
- استنتاج من الكود: رئيس اللجنة لا يرسل قسم خطة من النموذج بحرية عند الإضافة، لأن الخادم يستبدل `department_id` بقيمة الجلسة.

## 39 سجل التغييرات

غير موجود في الملفات الحالية.

## System Overview

خطة تشغيلية هرمية للكلية: أقسام وخطط وأهداف وأنشطة وأدلة، مع أربعة أدوار جلسة، ومتوسط إنجاز يُكتب في القاعدة عند التعديل.

## Quick Reference

| الجزء | التقنية | الموقع | الدور |
| --- | --- | --- | --- |
| الواجهة | HTML/JS | `index.html` و`assets/js/script.js` | العرض والنوافذ |
| الإعداد | PHP | `php/config.php` | الجلسة و`mysqli` |
| الدخول | PHP | `php/login.php` | `password_verify` |
| الأقسام | PHP | `php/api/departments.php` | CRUD جزئي |
| الخطط | PHP | `php/api/plans.php` | قراءة وإضافة وحذف |
| الأهداف | PHP | `php/api/goals.php` | مع `updatePlanProgress` |
| الأنشطة | PHP | `php/api/activities.php` | مع اللون و`updateGoalProgress` |
| الأدلة | PHP | `php/api/documents.php` و`uploads/serve.php` | رفع وتقديم |
| المستخدمون | PHP | `php/api/users.php` | أدمن |
| المخطط | SQL | `db.sql` | 6 جداول وبذرة |

## Quick Start

1. استورد `db.sql`.
2. طابق ثوابت القاعدة و`BASE_URL` في `php/config.php`.
3. افتح `index.html` عبر خادم PHP.
4. استخدم بريداً موجوداً في جدول `users`. كلمة المرور البذرية موثقة داخل `db.sql` و`pages/login.html` ولا تُنسخ هنا.

## For Non-Technical Users

بعد الدخول ترى أقسام الكلية. داخل القسم خطط، وداخل الخطة أهداف، وداخل الهدف أنشطة بمواعيد. رفع الدليل يرفق ملفاً بالنشاط. لون النشاط يتغير حسب النسبة والموعد كما يحسبه الخادم. صفحة اتصل بنا تعرض نموذجاً ولا ترسله إلى قاعدة في الملفات الحالية.

## For Developers

عند تغيير الصلاحيات عدّل `checkRole` في PHP وشروط `script.js` معاً، لأنهما يختلفان اليوم في حذف الدليل وتحديث النسبة. أي مسار جديد للموقع يحتاج تحديث `BASE_URL`. الإبقاء على الاستعلامات المحضّرة و`basename` عند الملفات يحافظ على الضوابط الموجودة.
