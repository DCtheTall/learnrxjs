import {EventEmitter} from 'events';
import { access } from 'fs';
import {GroupedObservable, from, fromEvent, interval, merge, of, partition, zip, timer} from 'rxjs';
import {buffer, bufferCount, bufferTime, bufferWhen, catchError, concatMap, concatMapTo, delay, exhaustMap, expand, filter, finalize, groupBy, map, mapTo, mergeAll, mergeMap, mergeScan, pluck, reduce, scan, switchMap, switchMapTo, take, takeUntil, takeWhile, tap, throttleTime, toArray, window, windowCount, windowTime, windowToggle, windowWhen} from 'rxjs/operators';

/**
 * buffer
 */
const bufferExample = async () => {
    const emitter = new EventEmitter();
    const source$ = fromEvent(emitter, 'click');
    
    source$.pipe(
        // Emits an observable every 250ms with the collected events
        buffer(source$.pipe(throttleTime(250))),
        filter(arr => arr.length > 1),
    ).subscribe(x => console.log('buffer:', x));


    emitter.emit('click', 0);
    await new Promise(resolve => setTimeout(resolve, 100));
    emitter.emit('click', 1);

    await new Promise(resolve => setTimeout(resolve, 200));

    // This should not log.
    emitter.emit('click', 2);
    await new Promise(resolve => setTimeout(resolve, 1000));
};

/**
 * bufferCount
 */
const bufferCountExample = async () => {
    interval(100).pipe(bufferCount(3), take(2)).subscribe(
        x => console.log('bufferCount(3):', x));

    await new Promise(resolve => setTimeout(resolve, 1000));

    interval(100).pipe(bufferCount(3, 1), take(3)).subscribe(
        x => console.log('bufferCount(3, 1):', x));
};

/**
 * bufferTime
 */
const bufferTimeExample = async () => {
    interval(100).pipe(bufferTime(400), take(5)).subscribe(
        x => console.log('bufferTime(400):', x));

    await new Promise(resolve => setTimeout(resolve, 3000));

    interval(100).pipe(bufferTime(400, 200), take(5)).subscribe(
        x => console.log('bufferTime(400, 200):', x));
};

/**
 * bufferWhen
 */
const bufferWhenExample = () => {
    interval(100).pipe(
        // Buffer until the returned observable emits.
        bufferWhen(() => interval(500)),
        take(5),
    ).subscribe(x => console.log('bufferWhen:', x));
};

/**
 * concatMap
 */
const concatMapExample = async () => {
    of(200, 100).pipe(
        concatMap(x => of(`Delayed by ${x}`).pipe(delay(x))),
    ).subscribe(x => console.log('concatMap:', x));

    await new Promise(resolve => setTimeout(resolve, 1000));

    of('Hello', 'Goodbye').pipe(
        concatMap(x => new Promise(resolve => resolve(`${x} world!`))),
    ).subscribe(x => console.log('concatMap promise:', x));

    await new Promise(resolve => setTimeout(resolve, 1000));

    of('Hello', 'Goodbye').pipe(
        concatMap(
            x => new Promise(resolve => resolve(`${x} world!`)),
            x => `${x} w/ selector!`,
        ),
    ).subscribe(x => console.log('concatMap projection', x));
};

/**
 * concatMapTo
 */
const concatMapToExample = async () => {
    interval(100).pipe(
        take(3),
        concatMapTo(
            of('Network request complete').pipe(delay(800)),
        ),
    ).subscribe(x => console.log('concatMapTo:', x));

    await new Promise(resolve => setTimeout(resolve, 3000));

    interval(200).pipe(
        concatMapTo(
            interval(100).pipe(take(5)),
            (x, y) => `${x} ${y}`,
        ),
        take(10),
    ).subscribe(x => console.log('concatMapTo projection:', x));
};

/**
 * exhaustMapExample
 */
const exhaustMapExample = async () => {
    merge(
        // This gets ignored because it finishes before the
        // interval the of(true) is mapped to completes.
        interval(100).pipe(delay(10), take(4)),
        of(true),
    ).pipe(
        exhaustMap(() => interval(100).pipe(take(5))),
    ).subscribe(x => console.log('exhaustMap:', x));

    await new Promise(resolve => setTimeout(resolve, 1000));

    interval(100).pipe(
        take(10),
        exhaustMap((x) => {
            console.log(`Emission of first interval: ${x}`);
            return interval(100).pipe(take(3));
        }),
    ).subscribe(x => console.log('exhaustMap:', x));
};

/**
 * expand
 */
const expandExample = () => {
    of(2).pipe(
        expand(x => {
            console.log('expand recursion called with:', x);
            return of(++x);
        }),
        take(5),
    ).subscribe(x => console.log('expand:', x));
};

/**
 * groupBy
 */
const groupByExample = () => {
    from([
        {name: 'Sue', age: 25},
        {name: 'Joe', age: 30},
        {name: 'Frank', age: 25},
        {name: 'Sarah', age: 35},
    ]).pipe(
        groupBy(x => x.age),
        mergeMap(x => x.pipe(toArray())),
    ).subscribe(x => console.log('groupBy(x => x.age):', x));

    from([
        {name: 'Sue', age: 25},
        {name: 'Joe', age: 30},
        {name: 'Frank', age: 25},
        {name: 'Sarah', age: 35},
    ]).pipe(
        groupBy(x => x.age, x => x.name),
        mergeMap((x: GroupedObservable<number, string>) => zip(of(x.key), x.pipe(toArray()))),
    ).subscribe(x => console.log('groupBy(x => x.age):', x));
};

/**
 * map
 */
const mapExample = () => {
    from([1, 2, 3, 4, 5]).pipe(map(x => x + 10)).subscribe(
        x => console.log('map(x => x + 10):', x));
    
    from([{foo: 30}, {foo: 20}, {foo: 50}]).pipe(
        map(({foo}) => foo),
    ).subscribe(x => console.log('map(({foo}) => foo):', x));
};

/**
 * mapTo
 */
const mapToExample = () => {
    interval(100).pipe(
        mapTo('Hello world!'),
        take(5),
    ).subscribe(x => console.log('mapTo:', x));
};

/**
 * mergeMap
 */
const mergeMapExample = () => {
    of(0, 1, 2).pipe(mergeMap(x => of(++x))).subscribe(
        x => console.log('mergeMap:', x));

    of(0, 1, 2).pipe(
        mergeMap(x => new Promise(resolve => resolve(++x))),
    ).subscribe(x => console.log('mergeMap promise:', x));
};

/**
 * mergeScan
 */
const mergeScanExample = async () => {
    const emitter = new EventEmitter();
    const mouseup$ = fromEvent(emitter, 'mouseup');
    const mousedown$ = fromEvent(emitter, 'mousedown');

    mouseup$.pipe(
        mergeScan((acc, _) => interval(100).pipe(
            scan((a, _) => ++a, 0),
            map(x => acc + x),
            takeUntil(mousedown$),
        ), 0),
    ).subscribe(x => console.log('mergeScan:', x));

    emitter.emit('mouseup');
    await new Promise(resolve => setTimeout(resolve, 500));
    emitter.emit('mousedown');
};

/**
 * partition
 */
const partitionExample = () => {
    const [evens$, odds$] = partition(of(1, 2, 3, 4, 5), x => x % 2 == 0);
    
    merge(
        evens$.pipe(map(x => `Even ${x}`)),
        odds$.pipe(map(x => `Odd ${x}`)),
    ).subscribe(x => console.log('partition:', x));

    const [success$, error$] = partition(
        of(1, 2, 3, 4, 5).pipe(
            map((x) => {
                if (x > 3) throw new Error(String(x));
                return {success: x};
            }),
            catchError(err => of({error: Number(err.message)}))
        ),
        (x: {success: boolean, error: number}) => x.success);
    
    merge(
        success$.pipe(
            map((x: {success: boolean, error: number}) =>
                `Success ${x.success}`)),
        error$.pipe(
            map((x: {success: boolean, error: number}) =>
                `Error ${x.error}`)),
    ).subscribe(x => console.log('partition:', x));
};

/**
 * pluck
 */
const pluckExample = () => {
    of({foo: 1}, {foo: 2}, {foo: 3}).pipe(pluck('foo')).subscribe(
        x => console.log('pluck:', x));
};

/**
 * reduce
 */
const reduceExample = () => {
    of(1, 2, 3, 4, 5).pipe(
        reduce((acc, cur) => acc + cur, 0),
    ).subscribe(x => console.log('reduce:', x));
};

/**
 * scan
 */
const scanExample = () => {
    of(1, 2, 3, 4, 5).pipe(
        scan((acc, cur) => acc + cur, 0),
    ).subscribe(x => console.log('scan:', x));

    of({foo: 1}, {bar: 2}, {baz: 3}).pipe(
        scan((acc, cur) => ({...acc, ...cur}), {}),
    ).subscribe(x => console.log('scan:', x));
};

/**
 * switchMap
 */
const switchMapExample = async () => {
    const emitter = new EventEmitter();
    fromEvent(emitter, 'foo').pipe(
        // The previous interval will be canceled once the
        // source emits again.
        switchMap(() => interval(100).pipe(take(10))),
    ).subscribe(x => console.log('switchMap:', x));

    emitter.emit('foo');
    await new Promise(resolve => setTimeout(resolve, 500));
    emitter.emit('foo');
};

/**
 * switchMapToExample
 */
const switchMapToExample = async () => {
    const emitter = new EventEmitter();
    const countdown = 10;

    fromEvent(emitter, 'foo').pipe(
        switchMapTo(interval(100).pipe(
            scan((acc, _) => --acc, countdown),
        )),
        takeWhile(x => x > 0),
        finalize(() => console.log('switchMapTo: countdown done!')),
    ).subscribe(x => console.log('switchMapTo:', x));

    emitter.emit('foo');
    await new Promise(resolve => setTimeout(resolve, 500));
    emitter.emit('foo');
};

/**
 * toArray
 */
const toArrayExample = () => {
    interval(100).pipe(
        take(10),
        toArray(),
    ).subscribe(x => console.log('toArray:', x));
};

/**
 * window
 */
const windowExample = () => {
    const source$ = timer(0, 100).pipe(take(30));
    
    source$.pipe(
        window(interval(300)),
        scan((acc, _) => ++acc, 0),
    ).subscribe(x => console.log('window: window number', x));

    source$.subscribe(x => console.log('window: source', x));
};

/**
 * windowCount
 */
const windowCountExample = () => {
    interval(100).pipe(
        take(30),
        windowCount(3),
        tap(() => console.log('NEW WINDOW')),
        mergeAll(),
    ).subscribe(x => console.log('windowCount:', x));
};

/**
 * windowTime
 */
const windowTimeExample = () => {
    interval(100).pipe(
        take(30),
        windowTime(300),
        tap(() => console.log('NEW WINDOW')),
        mergeAll(),
    ).subscribe(x => console.log('windowTime:', x));
};

/**
 * windowToggle
 */
const windowToggleExample = () => {
    interval(100).pipe(
        take(40),
        windowToggle(interval(500), x => interval(100 * x)),
        tap(() => console.log('NEW WINDOW')),
        mergeAll(),
    ).subscribe(x => console.log('windowToggle:', x));
};

/**
 * windowWhen
 */
const windowWhenExample = () => {
    interval(100).pipe(
        take(30),
        windowWhen(() => interval(500)),
        tap(() => console.log('NEW WINDOW')),
        mergeAll(),
    ).subscribe(x => console.log('windowToggle:', x));
};
