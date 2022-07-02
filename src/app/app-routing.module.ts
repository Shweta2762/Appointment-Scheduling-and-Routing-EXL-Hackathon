import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CalendarComponent } from './calendar/calendar.component';
import { agencysComponent } from './agencys/agencys.component';
import { UsersComponent } from './users/users.component';
import { PreferenceComponent } from './preference/preference.component';
import { AboutComponent } from './about/about.component';
import { agencyDetailsComponent } from './agency-details/agency-details.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'agencys', component: agencysComponent },
  { path: 'agency-details/:id', component: agencyDetailsComponent },
  { path: 'users', component: UsersComponent },
  { path: 'preference', component: PreferenceComponent },
  { path: 'about', component: AboutComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
