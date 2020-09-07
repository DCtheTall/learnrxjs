import {Observable, concat, empty, interval, combineLatest, forkJoin, merge, of, race, throwError, timer, zip, fromEvent} from 'rxjs';
import {ajax} from 'rxjs/ajax';
import {catchError, combineAll, concatAll, delay, endWith, finalize, map, mapTo, merge as mergeOp, mergeAll, mergeMap, pairwise, startWith, take, withLatestFrom} from 'rxjs/operators';
import {XMLHttpRequest} from 'xmlhttprequest';
import {EventEmitter} from 'events';

/**
 * combineAll
 */

const combineAllExamples = () => {
    const source$ = interval(1000).pipe(take(2));

    const example$ = source$.pipe(
        map(i =>
            interval(1000).pipe(
                map(j => `observer ${i} emitted ${j}`), take(5))));

    example$.pipe(combineAll()).subscribe(
        x => console.log('combineAll:', x));
};

/**
 * combineLatest
 */

const combineLastestExample = () => {
    const timerOne$ = timer(250, 1000).pipe(take(3));
    const timerTwo$ = timer(500, 1000).pipe(take(3));
    const timerThree$ = timer(750, 1000).pipe(take(3));

    combineLatest(timerOne$, timerTwo$, timerThree$).subscribe(
        x => console.log('combineLatest:', x));

    combineLatest(
        timerOne$, timerTwo$, timerThree$,
        (x1: number, x2: number, x3: number) =>
            `Timer 1: ${x1} Timer 2: ${x2} Timer 3: ${x3}`).subscribe(
                x => console.log('combineLatest projection:', x));
};

/**
 * concat
 */

const concatExample = () => {
    concat(of(1, 2, 3), of(4, 5, 6), of(7, 8, 9)).subscribe(
        x => console.log('concat of:', x));
    
    const delayedMessage =
        (message: string, delayTime: number = 1000): Observable<string> =>
            empty().pipe(startWith(message), delay(delayTime));
    
    concat(
        delayedMessage('Get Ready!'),
        delayedMessage('3'),
        delayedMessage('2'),
        delayedMessage('1'),
        delayedMessage('Go!')).subscribe(
            x => console.log('concat delayedMessage:', x));
};

/**
 * concatAll
 */

const concatAllExample = () => {
    const source$ = interval(500);
    source$.pipe(
        map(x => of(x + 10)), concatAll(), take(5)).subscribe(
            x => console.log('concatAll:', x));
};

/**
 * endWith
 */

const endWithExample = () => {
    of('Hello', 'Friend').pipe(
        endWith('Goodbye', 'Friend'),
        finalize(() => console.log('endWith: finalize'))).subscribe(
            x => console.log('endWith:', x));
};

/**
 * forkJoin
 */

const getJSON = (url: string) => ajax({
    url,
    createXHR: () => new XMLHttpRequest(),
    crossDomain: true,
    withCredentials: false,
    method: 'GET',
}).pipe(map(x => x.response));

const forkJoinPromise = <T>(x: T): Promise<string> =>
    new Promise(
        resolve => setTimeout(() => resolve(`Promise resolved: ${x}`), 5000));

const forkJoinExample = () => {
    forkJoin(
        {
          google: getJSON('https://api.github.com/users/google'),
          microsoft: getJSON('https://api.github.com/users/microsoft'),
        }).subscribe(x => console.log('forkJoin ajax:', x));

    const varyingDurations$ = forkJoin(
        of('Will not be logged', 'Hello'),
        of('World').pipe(delay(1000)),
        interval(1000).pipe(take(1)),
        interval(1000).pipe(take(2)),
        forkJoinPromise('RESULT'));

    varyingDurations$.subscribe(x => console.log('forkJoin duration:', x));

    const source$ = of([1, 2, 3, 4, 5]);
    const varyingNumberOfReqs$ = source$.pipe(
        mergeMap(q => forkJoin(...q.map(x => forkJoinPromise(x)))));

    varyingNumberOfReqs$.subscribe(x => console.log('forkJoin # of requests:', x));

    forkJoin(
        of('Hello'),
        of('World'),
        throwError('this will throw'),
    ).pipe(
        catchError(err => of(err)),
    ).subscribe(
        x => console.log('forkJoin uncaught:', x));

    forkJoin(
        of('Hello'),
        of('World'),
        throwError('this will be caught').pipe(catchError(err => of(err))),
    ).subscribe(x => console.log('forkJoin caught:', x));
};

/**
 * merge
 */

const mergeExample = async () => {
    const first$ = interval(2500).pipe(take(2));
    const second$ = interval(2000).pipe(take(2));
    const third$ = interval(1500).pipe(take(2));
    const fourth$ = interval(1000).pipe(take(2));

    merge(
        first$.pipe(mapTo('FIRST')),
        second$.pipe(mapTo('SECOND')),
        third$.pipe(mapTo('THIRD')),
        fourth$.pipe(mapTo('FORTH'))).subscribe(
            x => console.log('merge:', x));

    // Wait for first example.
    await new Promise(resolve => setTimeout(resolve, 6000));

   const otherFirst$ = interval(1000).pipe(mapTo('FIRST'), take(2));
   const otherSecond$ = interval(2500).pipe(mapTo('SECOND'), take(2));

   otherFirst$.pipe(
       mergeOp(otherSecond$)).subscribe(
       x => console.log('merge op:', x));
};

/**
 * mergeAll
 */

const mergeAllExample = () => {
    of(1, 2, 3).pipe(
        map(x => of(x)),
        mergeAll()).subscribe(x => console.log('mergeAll:', x));

    const source$ = interval(500).pipe(take(5));

    source$.pipe(
        map(i => source$.pipe(
            delay(1000),
            take(3),
            map(j => `Observable ${i}: ${j}`))),
        mergeAll(2), // Can only subscribe to 2 observables, the rest are backlogged.
    ).subscribe(x => console.log('mergeAll(2):', x));
};

/**
 * pairwise
 */

const pairwiseExample = () => {
    interval(1000).pipe(pairwise(), take(5)).subscribe(
        x => console.log('pairwise:', x));
};

/**
 * race
 */

const raceExample = async () => {
    race(
        interval(1000).pipe(mapTo('1s won!')),
        interval(1250),
        interval(1500),
    ).pipe(take(3)).subscribe(x => console.log('race:', x));

    // Wait for first example...
    await new Promise(resolve => setTimeout(resolve, 4000));

    race(
        of('FIRST').pipe(
            delay(100),
            map(() => {
                throw new Error('This will throw');
            })),
        of('SECOND').pipe(delay(250)),
        of('THIRD').pipe(delay(500))).subscribe(
            x => console.log('this should not log:', x));
};

/**
 * startWith
 */

const startWithExample = () => {
    of(1, 2, 3).pipe(startWith(0)).subscribe(
        x => console.log('startWith:', x));
};

/**
 * withLatestFrom
 */

const withLatestFromExample = async () => {
    const fast$ = interval(1000).pipe(take(10));
    const slow$ = interval(5000).pipe(take(2));

    fast$.pipe(
        withLatestFrom(slow$),
        map(([x, y]) => `first: ${x} second: ${y}`)).subscribe(
            x => console.log('withLatestFrom fast source:', x));

    await new Promise(resolve => setTimeout(resolve, 1e4));

    slow$.pipe(
        withLatestFrom(fast$),
        map(([x, y]) => `first: ${x} second: ${y}`)).subscribe(
            x => console.log('withLatestFrom slow source:', x));
};

/**
 * zip
 */

const zipMouseEvent =
    (target: EventEmitter, name: string): Observable<{x, y: number}> =>
        fromEvent(target, name).pipe(
            map((e: MouseEvent) => ({x: e.clientX, y: e.clientY})));

const zipEventTime =
    (target: EventEmitter, name: string): Observable<number> =>
        fromEvent(target, name).pipe(map(() => new Date().getTime()));

const zipExample = async () => {
    zip(
        of('Hello'),
        of('world!').pipe(delay(1000)),
        of('Goodbye').pipe(delay(2000)),
        of('world!').pipe(delay(3000)),
    ).subscribe(x => console.log('zip:', x));

    // Wait for first example.
    await new Promise(resolve => setTimeout(resolve, 3000));

    const source$ = interval(1000);
    zip(source$, source$.pipe(take(2))).subscribe(
        x => console.log('zip take(2):', x));

    // Wait for second example.
    await new Promise(resolve => setTimeout(resolve, 3000));

    const emitter = new EventEmitter();

    zip(
        zipMouseEvent(emitter, 'foo'),
        zipMouseEvent(emitter, 'bar'),
    ).subscribe(x => console.log('zip events:', x));

    emitter.emit('foo', {clientX: 100, clientY: 200});
    emitter.emit('bar', {clientX: 200, clientY: 100});

    zip(
        zipEventTime(emitter, 'foobar'),
        zipEventTime(emitter, 'barbaz'),
    ).subscribe(([start, end]) => console.log('duration:', end - start));

    emitter.emit('foobar', {});
    await new Promise(resolve => setTimeout(resolve, 500));
    emitter.emit('barbaz', {});
};
zipExample();
