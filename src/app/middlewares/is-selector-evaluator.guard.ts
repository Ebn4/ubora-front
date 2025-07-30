import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {catchError, map, of} from 'rxjs';
import {EvaluatorService} from '../services/evaluator.service';

export const IsSelectorEvaluatorGuard: CanActivateFn = (route, state) => {
    const evaluatorService = inject(EvaluatorService)
    const router = inject(Router)

    return evaluatorService.isSelectorEvaluator().pipe(
        map(res => {
            if (!res.isSelectorEvaluator) {
                return router.parseUrl('/evaluator-candidacies');
            }
            return true;
        }),
        catchError(() => of(false))
    );

}



