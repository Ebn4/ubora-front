import {inject, Injectable} from '@angular/core';
import {finalize, Observable} from 'rxjs';
import {LoadingService} from '../services/loading.service';
import {HttpInterceptorFn} from '@angular/common/http';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  loading.show();

  return next(req).pipe(
    finalize(() => loading.hide())
  );
};
