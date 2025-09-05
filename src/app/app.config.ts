import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { providePrimeNG } from 'primeng/config';
import mat from '@primeuix/themes/lara';
import { MessageService } from 'primeng/api';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideQueryClient } from '@tanstack/angular-query-experimental';
import { QueryClient } from '@tanstack/query-core';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Angular core
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideAnimations(),
    provideClientHydration(withEventReplay()),

    // UI libraries
    providePrimeNG({
      theme: {
        preset: mat
      }
    }),

    // Services
    MessageService,

    // TanStack Query
    provideQueryClient(new QueryClient({
      defaultOptions: {
        queries: {
          enabled: false, 
          retry: 3,
          retryDelay: 1000,
          staleTime: 5 * 60 * 1000,
        }
      }
    })),
  ]
};