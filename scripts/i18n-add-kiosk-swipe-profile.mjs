import fs from 'node:fs';
import path from 'node:path';

const locales = ['ar', 'de', 'en', 'es', 'fr', 'id', 'ja', 'ko', 'pt-BR', 'ru', 'th', 'vi', 'zh-CN'];

const translations = {
  vi: {
    "attendance.kiosk.swipe_hint": "Vuốt màn hình hoặc dùng nút điều hướng để chuyển trang danh sách nhân sự",
    "attendance.kiosk.showing_count": "Hiển thị {shown} / {total} nhân viên",
    "attendance.kiosk.page_indicator": "Trang {current} / {total}",
    "attendance.kiosk.prev_page": "Trang trước",
    "attendance.kiosk.next_page": "Trang sau",
    "attendance.kiosk.all_letters": "Tất cả chữ cái",
    "attendance.kiosk.alphabet_filter": "Chữ cái đầu tên",
    "attendance.kiosk.profile_linked": "Hồ sơ nhân sự (plugin-employee)",
    "attendance.kiosk.job_title": "Chức danh",
    "attendance.kiosk.work_email": "Email công việc",
    "attendance.kiosk.phone": "Số điện thoại"
  },
  en: {
    "attendance.kiosk.swipe_hint": "Swipe screen or use navigation controls to browse employees",
    "attendance.kiosk.showing_count": "Showing {shown} of {total} employees",
    "attendance.kiosk.page_indicator": "Page {current} / {total}",
    "attendance.kiosk.prev_page": "Previous page",
    "attendance.kiosk.next_page": "Next page",
    "attendance.kiosk.all_letters": "All letters",
    "attendance.kiosk.alphabet_filter": "First letter",
    "attendance.kiosk.profile_linked": "Employee profile (plugin-employee)",
    "attendance.kiosk.job_title": "Job title",
    "attendance.kiosk.work_email": "Work email",
    "attendance.kiosk.phone": "Phone number"
  },
  ar: {
    "attendance.kiosk.swipe_hint": "اسحب الشاشة أو استخدم عناصر التحكم للتنقل بين الموظفين",
    "attendance.kiosk.showing_count": "عرض {shown} من {total} موظف",
    "attendance.kiosk.page_indicator": "صفحة {current} / {total}",
    "attendance.kiosk.prev_page": "الصفحة السابقة",
    "attendance.kiosk.next_page": "الصفحة التالية",
    "attendance.kiosk.all_letters": "جميع الحروف",
    "attendance.kiosk.alphabet_filter": "الحرف الأول",
    "attendance.kiosk.profile_linked": "ملف تعريف الموظف (plugin-employee)",
    "attendance.kiosk.job_title": "المسمى الوظيفي",
    "attendance.kiosk.work_email": "البريد الإلكتروني للعمل",
    "attendance.kiosk.phone": "رقم الهاتف"
  },
  de: {
    "attendance.kiosk.swipe_hint": "Wischen Sie über den Bildschirm oder nutzen Sie die Navigation",
    "attendance.kiosk.showing_count": "{shown} von {total} Mitarbeitern angezeigt",
    "attendance.kiosk.page_indicator": "Seite {current} / {total}",
    "attendance.kiosk.prev_page": "Vorherige Seite",
    "attendance.kiosk.next_page": "Nächste Seite",
    "attendance.kiosk.all_letters": "Alle Buchstaben",
    "attendance.kiosk.alphabet_filter": "Anfangsbuchstabe",
    "attendance.kiosk.profile_linked": "Mitarbeiterprofil (plugin-employee)",
    "attendance.kiosk.job_title": "Berufsbezeichnung",
    "attendance.kiosk.work_email": "Dienstliche E-Mail",
    "attendance.kiosk.phone": "Telefonnummer"
  },
  es: {
    "attendance.kiosk.swipe_hint": "Deslice la pantalla o use los controles para navegar",
    "attendance.kiosk.showing_count": "Mostrando {shown} de {total} empleados",
    "attendance.kiosk.page_indicator": "Página {current} / {total}",
    "attendance.kiosk.prev_page": "Página anterior",
    "attendance.kiosk.next_page": "Página siguiente",
    "attendance.kiosk.all_letters": "Todas las letras",
    "attendance.kiosk.alphabet_filter": "Letra inicial",
    "attendance.kiosk.profile_linked": "Perfil del empleado (plugin-employee)",
    "attendance.kiosk.job_title": "Cargo",
    "attendance.kiosk.work_email": "Correo laboral",
    "attendance.kiosk.phone": "Teléfono"
  },
  fr: {
    "attendance.kiosk.swipe_hint": "Balayez l'écran ou utilisez les commandes pour parcourir",
    "attendance.kiosk.showing_count": "Affichage de {shown} sur {total} employés",
    "attendance.kiosk.page_indicator": "Page {current} / {total}",
    "attendance.kiosk.prev_page": "Page précédente",
    "attendance.kiosk.next_page": "Page suivante",
    "attendance.kiosk.all_letters": "Toutes les lettres",
    "attendance.kiosk.alphabet_filter": "Initiale",
    "attendance.kiosk.profile_linked": "Profil employé (plugin-employee)",
    "attendance.kiosk.job_title": "Poste",
    "attendance.kiosk.work_email": "E-mail professionnel",
    "attendance.kiosk.phone": "Téléphone"
  },
  id: {
    "attendance.kiosk.swipe_hint": "Geser layar atau gunakan kontrol navigasi untuk menelusuri karyawan",
    "attendance.kiosk.showing_count": "Menampilkan {shown} dari {total} karyawan",
    "attendance.kiosk.page_indicator": "Halaman {current} / {total}",
    "attendance.kiosk.prev_page": "Halaman sebelumnya",
    "attendance.kiosk.next_page": "Halaman berikutnya",
    "attendance.kiosk.all_letters": "Semua huruf",
    "attendance.kiosk.alphabet_filter": "Huruf awal",
    "attendance.kiosk.profile_linked": "Profil karyawan (plugin-employee)",
    "attendance.kiosk.job_title": "Jabatan",
    "attendance.kiosk.work_email": "Email kerja",
    "attendance.kiosk.phone": "Nomor telepon"
  },
  ja: {
    "attendance.kiosk.swipe_hint": "画面をスワイプするかナビゲーションボタンで従業員を参照",
    "attendance.kiosk.showing_count": "{total}名中{shown}名を表示",
    "attendance.kiosk.page_indicator": "ページ {current} / {total}",
    "attendance.kiosk.prev_page": "前のページ",
    "attendance.kiosk.next_page": "次のページ",
    "attendance.kiosk.all_letters": "すべての頭文字",
    "attendance.kiosk.alphabet_filter": "頭文字",
    "attendance.kiosk.profile_linked": "従業員プロフィール (plugin-employee)",
    "attendance.kiosk.job_title": "役職",
    "attendance.kiosk.work_email": "社用メール",
    "attendance.kiosk.phone": "電話番号"
  },
  ko: {
    "attendance.kiosk.swipe_hint": "화면을 스와이프하거나 탐색 버튼으로 직원을 탐색하세요",
    "attendance.kiosk.showing_count": "전체 {total}명 중 {shown}명 표시",
    "attendance.kiosk.page_indicator": "페이지 {current} / {total}",
    "attendance.kiosk.prev_page": "이전 페이지",
    "attendance.kiosk.next_page": "다음 페이지",
    "attendance.kiosk.all_letters": "모든 글자",
    "attendance.kiosk.alphabet_filter": "첫 글자",
    "attendance.kiosk.profile_linked": "직원 프로필 (plugin-employee)",
    "attendance.kiosk.job_title": "직책",
    "attendance.kiosk.work_email": "업무 이메일",
    "attendance.kiosk.phone": "전화번호"
  },
  'pt-BR': {
    "attendance.kiosk.swipe_hint": "Deslize a tela ou use os controles de navegação para navegar",
    "attendance.kiosk.showing_count": "Exibindo {shown} de {total} funcionários",
    "attendance.kiosk.page_indicator": "Página {current} / {total}",
    "attendance.kiosk.prev_page": "Página anterior",
    "attendance.kiosk.next_page": "Próxima página",
    "attendance.kiosk.all_letters": "Todas as letras",
    "attendance.kiosk.alphabet_filter": "Letra inicial",
    "attendance.kiosk.profile_linked": "Perfil do colaborador (plugin-employee)",
    "attendance.kiosk.job_title": "Cargo",
    "attendance.kiosk.work_email": "E-mail corporativo",
    "attendance.kiosk.phone": "Telefone"
  },
  ru: {
    "attendance.kiosk.swipe_hint": "Проведите по экрану или используйте кнопки для перехода",
    "attendance.kiosk.showing_count": "Показано {shown} из {total} сотрудников",
    "attendance.kiosk.page_indicator": "Страница {current} / {total}",
    "attendance.kiosk.prev_page": "Предыдущая страница",
    "attendance.kiosk.next_page": "Следующая страница",
    "attendance.kiosk.all_letters": "Все буквы",
    "attendance.kiosk.alphabet_filter": "Первая буква",
    "attendance.kiosk.profile_linked": "Профиль сотрудника (plugin-employee)",
    "attendance.kiosk.job_title": "Должность",
    "attendance.kiosk.work_email": "Рабочий e-mail",
    "attendance.kiosk.phone": "Телефон"
  },
  th: {
    "attendance.kiosk.swipe_hint": "ปัดหน้าจอหรือใช้ปุ่มควบคุมเพื่อดูรายชื่อพนักงาน",
    "attendance.kiosk.showing_count": "แสดง {shown} จากทั้งหมด {total} คน",
    "attendance.kiosk.page_indicator": "หน้า {current} / {total}",
    "attendance.kiosk.prev_page": "หน้าก่อนหน้า",
    "attendance.kiosk.next_page": "หน้าถัดไป",
    "attendance.kiosk.all_letters": "ตัวอักษรทั้งหมด",
    "attendance.kiosk.alphabet_filter": "อักษรนำหน้า",
    "attendance.kiosk.profile_linked": "ข้อมูลพนักงาน (plugin-employee)",
    "attendance.kiosk.job_title": "ตำแหน่งงาน",
    "attendance.kiosk.work_email": "อีเมลที่ทำงาน",
    "attendance.kiosk.phone": "เบอร์โทรศัพท์"
  },
  'zh-CN': {
    "attendance.kiosk.swipe_hint": "滑动屏幕或使用导航按钮浏览员工",
    "attendance.kiosk.showing_count": "显示 {shown} / 共 {total} 名员工",
    "attendance.kiosk.page_indicator": "第 {current} / {total} 页",
    "attendance.kiosk.prev_page": "上一页",
    "attendance.kiosk.next_page": "下一页",
    "attendance.kiosk.all_letters": "全部字母",
    "attendance.kiosk.alphabet_filter": "首字母",
    "attendance.kiosk.profile_linked": "员工档案 (plugin-employee)",
    "attendance.kiosk.job_title": "职位",
    "attendance.kiosk.work_email": "工作邮箱",
    "attendance.kiosk.phone": "联系电话"
  }
};

const directories = [
  'plugins/attendance/src/main/resources/META-INF/resources/i18n',
  'src/frontend/web/public/i18n',
  'src/frontend/mobile/public/i18n'
];

for (const dir of directories) {
  for (const loc of locales) {
    const filePath = path.join(dir, `${loc}.json`);
    if (!fs.existsSync(filePath)) continue;
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const source = translations[loc] || translations['en'];
    for (const [k, v] of Object.entries(source)) {
      content[k] = v;
    }
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

console.log('All locale files updated with Kiosk swipe & profile keys.');

