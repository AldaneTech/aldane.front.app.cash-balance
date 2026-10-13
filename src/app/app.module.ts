import { FormUiModule } from './shared/forms/form-ui.module';
import { ConfirmationDialogComponent } from './shared/forms/confirmation-dialog.component';
import { I18nModule } from './i18n/i18n.module';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { MonthlyChartComponent } from './shared/monthly-chart.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LayoutComponent } from './layout/layout.component';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { Configuration } from '@aldanetech/cash-balance-api-client-angular';
import { SessionInterceptor } from './auth/session.interceptor';
import { apiClientConfiguration } from './api-client-config';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    LayoutComponent
  ],
  imports: [
    I18nModule,
    FormUiModule,
    ConfirmationDialogComponent,
    BrowserModule,
    MonthlyChartComponent,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: SessionInterceptor, multi: true },
    {
      provide: Configuration,
      useFactory: apiClientConfiguration
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
