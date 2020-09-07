import {EventEmitter} from 'events';
import {Observable, concat, empty, from, fromEvent, iif, interval, of} from 'rxjs';
import {defaultIfEmpty, delay, every, mergeMap, sequenceEqual, switchMap, take, tap} from 'rxjs/operators';

/**
 * defaultIfEmpty
 */

const defaultIfEmptyExample = () => {
    of().pipe(defaultIfEmpty('Observable is empty!')).subscribe(
        x => console.log('defaultIfEmpty:', x));

    empty().pipe(defaultIfEmpty('Observable is empty!')).subscribe(
        x => console.log('defaultIfEmpty empty():', x));
};

/**
 * every
 */

const everyRequest =
    (code: number, msg: string): Observable<{code: number}> =>
        of({code}).pipe(
            tap(() => console.log('emitting:', msg)),
            delay(1000));

const everyExample = () => {
    of(1, 2, 3, 4, 5).pipe(every(x => x % 2 === 0)).subscribe(
        x => console.log('every false:', x));

    of(2, 4, 8, 16, 32).pipe(every(x => x % 2 === 0)).subscribe(
        x => console.log('every true:', x));

    concat(
        everyRequest(200, 'FIRST'),
        everyRequest(200, 'SECOND'),
        everyRequest(500, 'THIRD'),
        everyRequest(200, 'This should not log...'),
    ).pipe(
        every(({code}) => code === 200),
        tap(x => console.log('every requests result:', x)),
    ).subscribe();
};

/**
 * iif
 */

const iifExample = async () => {
    const r$ = of('R');
    const x$ = of('X');

    interval(250).pipe(
        take(12),
        mergeMap(x => iif(() => (x % 4 === 0), r$, x$)),
    ).subscribe(x => console.log('iif:', x));

    // Wait for first example...
    await new Promise(resolve => setTimeout(resolve, 4e3));

    const emitter = new EventEmitter();

    fromEvent(emitter, 'foo').pipe(
        mergeMap((x: number) => iif(() => (x % 4 === 0), r$, x$)),
    ).subscribe(x => console.log('iif events:', x));

    for (let i = 0; i < 12; i++) {
        emitter.emit('foo', i);
        await new Promise(resolve => setTimeout(resolve, 250));
    }

    interval(250).pipe(
        take(10),
        mergeMap(x => iif(() => (x % 2 === 0), of(x))),
    ).subscribe(x => console.log('iif empty:', x));
};

/**
 * sequenceEqual
 */

const sequenceEqualExample = () => {
    const expected$ = from([4, 5, 6]);

    of([1, 2, 3], [4, 5, 6], [7, 8, 9]).pipe(
        switchMap(x => from(x).pipe(sequenceEqual(expected$))),
    ).subscribe(x => console.log('sequenceEqual:', x));
};
