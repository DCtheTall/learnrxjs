import {EventEmitter} from 'events';
import {Observable, fromEvent, iif, of, throwError, timer, from, interval} from 'rxjs';
import {catchError, delayWhen, finalize, map, mergeMap, retry, retryWhen, switchMap, take, tap} from 'rxjs/operators';

/**
 * catchError
 */
const catchErrorExample = () => {
    throwError(
        new Error('this is an error'),
    ).pipe(
        catchError((err: Error) => of(err)),
    ).subscribe(err => console.log('catchError:', err.message));

    timer(1000).pipe(
        mergeMap<number, Observable<Error>>(
            () => from(
                new Promise(
                    (_, reject) => reject(new Error('rejected promise'))),
            ).pipe(
                catchError(err => of(err)),
            )),
    ).subscribe(err => console.log('catchError promise:', err.message));

    const emitter = new EventEmitter();
    const error$ = throwError(new Error('foobar'));

    fromEvent(emitter, 'continue').pipe(
        switchMap((x: boolean) => iif(
            () => x,
            error$.pipe<Error>(catchError(err => of(err))),
            error$,
        )),
        catchError(() => of('no more events will be logged')),
    ).subscribe(
        x => console.log(
            'catchError continue:', x instanceof Error ? x.message : x));

    emitter.emit('continue', true);
    emitter.emit('continue', true);
    emitter.emit('continue', false);
    emitter.emit('continue', true);
};

/**
 * retry
 */
const retryExample = async () => {
    interval(250).pipe(
        mergeMap(x => (x > 5 ? throwError(new Error('too high')) : of(x))),
        retry(2),
    ).subscribe({
        next: (x: number) => console.log('retry:', x),
        error: (err: Error) => console.log('retry:', err.message),
    });
};

/**
 * retryWhen
 */
const retryWhenExample = async () => {
    interval(250).pipe(
        map(x => {
            if (x > 5) throw x;
            return x;
        }),
        retryWhen(
            errors$ => errors$.pipe(
                tap(x => console.log('retryWhen: count too high:', x)),
                delayWhen(x => timer(x * 250)),
                take(2))),
    ).subscribe(x => console.log('retryWhen:', x));

    // Wait for first example...
    await new Promise(resolve => setTimeout(resolve, 6e3));

    const retryWithBackoff =
        ({
            maxRetryAttempts,
            scalingDuration,
        }: {maxRetryAttempts: number, scalingDuration: number}) =>
            (attempts: Observable<any>) => attempts.pipe(
                mergeMap((err: Error, i: number) => {
                    const retryAttempt = i + 1;
                    if (retryAttempt > maxRetryAttempts) {
                        return throwError(err);
                    }
                    const backoff = retryAttempt * scalingDuration;
                    console.log('retry attempt:', retryAttempt, 'backoff time:', backoff);
                    return timer(backoff);
                }),
                finalize(() => console.log('finally done!')),
            );

    throwError(new Error('some random error')).pipe(
        retryWhen(
            retryWithBackoff({maxRetryAttempts: 3, scalingDuration: 250})),
        catchError(err => of(err)),
    ).subscribe();
};
