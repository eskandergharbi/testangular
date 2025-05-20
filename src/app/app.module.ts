import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import 'hammerjs';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrModule } from 'ngx-toastr'; // For auth after login toast

import { CoreModule } from '@core/core.module';
import { CoreCommonModule } from '@core/common.module';
import { CoreSidebarModule, CoreThemeCustomizerModule } from '@core/components';

import { coreConfig } from 'app/app-config';
import { AppComponent } from 'app/app.component';
import { LayoutModule } from 'app/layout/layout.module';
import { SampleModule } from 'app/main/sample/sample.module';
import { ClientFormComponent } from './components/client-form/client-form.component';
import { ProductFormComponent } from './components/product-form/product-form.component';
import { QuoteDetailsComponent } from './components/quote-details/quote-details.component';
import { QuoteListComponent } from './components/quote-list/quote-list.component';
import { ProductSelectionModalComponent } from './product-selection-modal/product-selection-modal.component';
import { AlertPopupComponent } from './components/alert-popup/alert-popup.component';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';

const appRoutes: Routes = [
  {
    path: 'pages',
    loadChildren: () => import('./main/pages/pages.module').then(m => m.PagesModule)
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/pages/miscellaneous/error' 
  }
];

@NgModule({
  declarations: [AppComponent,  ClientFormComponent, ProductFormComponent, QuoteDetailsComponent,QuoteListComponent, ProductSelectionModalComponent, AlertPopupComponent],
  imports: [
      DropdownModule,
      FormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes, {
      scrollPositionRestoration: 'enabled', // Add options right here
      relativeLinkResolution: 'legacy'
    }),
    TranslateModule.forRoot(),

    //NgBootstrap
    NgbModule,
    ToastrModule.forRoot({
      positionClass: 'toast-top-right', // <-- Important
      preventDuplicates: true,
      timeOut: 3000,
      progressBar: true
    }),

    // Core modules
    CoreModule.forRoot(coreConfig),
    CoreCommonModule,
    CoreSidebarModule,
    CoreThemeCustomizerModule,

    // App modules
    LayoutModule,
    SampleModule
  ],

  bootstrap: [AppComponent]
})
export class AppModule {}
