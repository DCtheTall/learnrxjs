import {EventEmitter} from 'events';
import {Notification, from, fromEvent, interval, merge, of, timer} from 'rxjs';
import {concatMap, catchError, delay, delayWhen, dematerialize, finalize, map, mergeMap, repeat, takeUntil, take, tap, timeInterval, timeout, timeoutWith} from 'rxjs/operators';

/**
 * do / tap
 */
const tapExample = () => {
    of(1, 2, 3, 4, 5).pipe(
        tap(x => console.log('tap: before map:', x)),
        map(x => x + 10),
        tap(x => console.log('tap: after map:', x)),
    ).subscribe(x => console.log('tap:', x));

    of(1, 2, 3, 4, 5).pipe(
        tap({
            next: x => console.log('tap: before map:', x),
            complete: () => console.log('tap: complete'),
        }),
        map(x => x + 10),
    ).subscribe(x => console.log('tap:', x));
};

/**
 * delay
 */
const delayExample = async () => {
    const emitter = new EventEmitter();

    fromEvent(emitter, 'mousedown').pipe(
        mergeMap(x => of(x).pipe(
            delay(700),
            takeUntil(fromEvent(emitter, 'mouseup')),
        )),
    ).subscribe(x => console.log('delay: long press:', x));

    // Should not log.
    emitter.emit('mousedown', 0);
    await new Promise(resolve => setTimeout(resolve, 500));
    emitter.emit('mouseup');

    // Should log.
    emitter.emit('mousedown', 1);
    await new Promise(resolve => setTimeout(resolve, 1000));
    emitter.emit('mouseup');

    merge(
        of('Hello'),
        of('world!').pipe(delay(100)),
        of('Goodbye').pipe(delay(200)),
        of('world!').pipe(delay(300)),
    ).subscribe(x => console.log('delay:', x));
};

/**
 * delayWhen
 */
const delayWhenExample = () => {
    interval(100).pipe(
        delayWhen(() => timer(500)),
        take(5),
    ).subscribe(x => console.log('delayWhen:', x));
};

/**
 * dematerialize
 */
const dematerializeExample = () => {
    from([
        Notification.createNext('SUCCESS'),
        Notification.createError('ERROR'),
    ]).pipe(
        // Turns notification objects into notification values.
        dematerialize(),
    ).subscribe({
        next: x => console.log('dematerialize next:', x),
        error: x => console.log('dematerialize error:', x),
    });
};

/**
 * finalize
 */
const finalizeExample = () => {
    interval(100).pipe(
        take(5),
        finalize(() => console.log('finalize: complete!')),
    ).subscribe(x => console.log('finalize:', x));
};

/**
 * repeat
 */
const repeatExample = () => {
    of('delayed value').pipe(
        delay(1000),
        // Also repeats the delay.
        repeat(3),
    ).subscribe(x => console.log('repeat:', x));
};

/**
 * timeInterval
 */
const timeIntervalExample = async () => {
    const emitter = new EventEmitter();
    
    fromEvent(emitter, 'mousedown').pipe(
        timeInterval(),
        tap(x => console.log('timeInterval tap:', x.interval)),
    ).subscribe(x => console.log('timeInterval interval:', x.interval));

    emitter.emit('mousedown');
    await new Promise(resolve => setTimeout(resolve, 500));
    // Interval is how many ms since last "mousedown" event.
    emitter.emit('mousedown');
};

/**
 * timeout
 */
const timeoutExample = () => {
    const request =
        (timeDelay: number) => of('Request complete!').pipe(delay(timeDelay));

    of(400, 300, 200).pipe(
        concatMap(duration => request(duration).pipe(
            timeout(250),
            catchError(() => of(`Request timed out after: ${duration}`)),
        )),
    ).subscribe(x => console.log('timeout:', x));
};

/**
 * timeoutWith
 */
const timeoutWithExample = () => {
    const request =
        (timeDelay: number) => of('Request complete!').pipe(delay(timeDelay));
    
    of(400, 300, 200).pipe(
        concatMap(duration => request(duration).pipe(
            timeoutWith(250, of('Request timed out!')),
        )),
    ).subscribe(x => console.log('timeoutWith:', x));
};

/**
 * toPromise
 */
const toPromiseExample = async () => {
    console.log(
        'toPromise:', await of('Some value').pipe(delay(500)).toPromise());
};
