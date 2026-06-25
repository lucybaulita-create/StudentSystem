import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { AdminSignup } from './adminsignup/adminsignup';
import { EmailVerification } from './email-verification/email-verification';
import { Admission } from './admission/admission';
import { AdminLayout } from './admin/admin-layout/admin-layout';
import { AdminDashboard } from './admin/admin-dashboard/admin-dashboard';
import { ManageUsers } from './admin/manage-users/manage-users';
import { ManageStudents } from './admin/manage-students/manage-students';
import { Courses } from './admin/courses/courses';
import { StudentLayout } from './student/student-layout/student-layout';
import { StudentDetails } from './student/student-details/student-details';
import { Studyload } from './student/studyload/studyload';
import { CourseSemester } from './student/course-semester/course-semester';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'admin-signup', component: AdminSignup },
  { path: 'verify-email', component: EmailVerification },
  { path: 'admission', component: Admission },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'registrar'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboard },
      { path: 'manage-users', component: ManageUsers, data: { roles: ['admin'] } },
      { path: 'manage-students', component: ManageStudents, data: { roles: ['admin', 'registrar'] } },
      { path: 'courses', component: Courses, data: { roles: ['admin', 'registrar'] } },
    ],
  },
  {
    path: 'student',
    component: StudentLayout,
    canActivate: [AuthGuard],
    data: { roles: ['student'] },
    children: [
      { path: '', redirectTo: 'student-details', pathMatch: 'full' },
      { path: 'student-details', component: StudentDetails },
      { path: 'studyload', component: Studyload },
      { path: 'course-semester', component: CourseSemester },
    ],
  },
];
