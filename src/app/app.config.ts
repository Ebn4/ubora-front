import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {BASE_URL} from './app.tokens';
import {authInterceptor} from './interceptor/auth.interceptor';
import {loadingInterceptor} from './interceptor/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, loadingInterceptor])),
    {provide: BASE_URL, useValue: 'http://127.0.0.1:8000/api'},
  ],
};
