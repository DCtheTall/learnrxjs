import {EventEmitter} from 'events';
import {asyncScheduler, fromEvent, interval, of, timer, zip} from 'rxjs';
import {auditTime, debounce, debounceTime, distinct, distinctUntilChanged, distinctUntilKeyChanged, filter, find, first, ignoreElements, last, map, mergeMap, sample, single, skip, skipUntil, skipWhile, take, takeLast, takeUntil, takeWhile, throttle, throttleTime} from 'rxjs/operators';

/**
 * auditTime
 */
const auditTimeExample = async () => {
    const emitter = new EventEmitter();
    
    fromEvent(emitter, 'foo').pipe(auditTime(1000)).subscribe(
        x => console.log('auditTime:', x));

    emitter.emit('foo', 'This should not log');

    await new Promise(resolve => setTimeout(resolve, 200));

    emitter.emit('foo', 'Hello');

    await new Promise(resolve => setTimeout(resolve, 1000));

    emitter.emit('foo', 'world!');
};

/**
 * debounce
 */
const debounceExample = async () => {
    of('This', 'should', 'not', 'log...', 'Hello world!').pipe(
        debounce(() => timer(1000)),
    ).subscribe(x => console.log('debounce:', x));

    // Wait for first example...
    await new Promise(resolve => setTimeout(resolve, 1000));

    interval(250).pipe(
        take(25),
        // Once the argument of timer is greater than 250,
        // no messages will emit until the last.
        debounce(x => timer(x * 50)),
    ).subscribe(x => console.log('debounce interval:', x));
};

/**
 * debounceTime
 */
const debouceTimeExample = () => {
    of('This', 'should', 'not', 'log...', 'Hello world!').pipe(
        debounceTime(1000),
    ).subscribe(x => console.log('debounce:', x));
};

/**
 * distinct
 */
const distinctExample = () => {
    of(1, 2, 3, 4, 1, 5, 2, 3, 4, 5).pipe(distinct()).subscribe(
        x => console.log('distinct:', x));

    of(
        {id: 1, message: 'Hello'},
        {id: 2, message: 'world!'},
        {id: 1, message: 'This should not log'},
    ).pipe(
        distinct(x => x.id),
    ).subscribe(x => console.log('distinct key:', x.message));
};

/**
 * distinctUntilChanged
 */
const distinctUntilChangedExample = () => {
    of(1, 1, 2, 2, 3, 1).pipe(distinctUntilChanged()).subscribe(
        x => console.log('distinctUntilChanged:', x));

    const sampleObj = {foo: 'bar'};
    of(sampleObj, sampleObj).pipe(
        distinctUntilChanged(),
    ).subscribe(x => console.log('distinctUntilChanged:', x));

    of(
        {id: 1, message: 'Hello'},
        {id: 1, message: 'This should not log'},
        {id: 2, message: 'world!'},
    ).pipe(
        distinctUntilChanged((prev, cur) => prev.id === cur.id),
    ).subscribe(x => console.log('distinctUntilChanged selector:', x.message));
};

/**
 * distinctUntilKeyChanged
 */
const distinctUntilKeyChangedExample = () => {
    of(
        {name: 'Alice'},
        {name: 'Alice'},
        {name: 'Bob'},
    ).pipe(distinctUntilKeyChanged('name')).subscribe(
        x => console.log('distinctUntilKeyChanged:', x));
};

/**
 * filter
 */
const filterExample = () => {
    of(1, 2, 3, 4).pipe(filter(x => x % 2 === 0)).subscribe(
        x => console.log('filter:', x));
};

/**
 * find
 */
const findExample = () => {
    const emitter = new EventEmitter();
    interface Message {targetId: string, message: string}
    const emitMessage = (targetId: string, message: string) => {
        emitter.emit('foo', {targetId, message});
    };

    fromEvent(emitter, 'foo').pipe(
        find((m: Message) => m.targetId === 'bar'),
        map((m: Message) => m.message),
    ).subscribe(x => console.log('find:', x));

    emitMessage('foo', 'This');
    emitMessage('foo', 'should');
    emitMessage('foo', 'not');
    emitMessage('foo', 'log...');
    emitMessage('bar', 'Hello world!');
    emitMessage('foo', 'This should not log');
};

/**
 * first
 */
const firstExample = () => {
    of(1, 2, 3, 4).pipe(first()).subscribe(x => console.log('first():', x));

    of(1, 2, 3, 4).pipe(first(x => x > 2)).subscribe(
        x => console.log('first(x => x > 2):', x));

    of(1, 2, 3, 4).pipe(first(x => x > 4, 'DEFAULT')).subscribe(
        x => console.log('first(x => x > 4, DEFAULT):', x));
};

/**
 * ignoreElements
 */
const ignoreElementsExample = async () => {
    interval(100).pipe(
        take(5),
        ignoreElements(),
    ).subscribe(
        x => console.log('ignoreElements next:', x),
        x => console.log('ignoreElements error:', x),
        () => console.log('ignoreElements complete'),
    );

    // Wait for first example...
    await new Promise(resolve => setTimeout(resolve, 1000));

    interval(100).pipe(
        mergeMap((x: number) => {
            if (x === 2) {
                throw new Error('something broke');
            }
            return of(x);
        }),
        ignoreElements(),
    ).subscribe(
        x => console.log('ignoreElements next:', x),
        x => console.log('ignoreElements error:', x),
        () => console.log('ignoreElements complete'),
    );
};

/**
 * last
 */
const lastExample = () => {
    of(1, 2, 3, 4, 5).pipe(last()).subscribe(x => console.log('last():', x));

    of(1, 2, 3, 4, 5).pipe(last(x => x % 2 === 0)).subscribe(
        x => console.log('last(x => x % 2 == 0):', x));

    of(1, 2, 3, 4, 5).pipe(last(x => x > 5, 'DEFAULT')).subscribe(
        x => console.log('last(x => x > 5, DEFAULT):', x));
};

/**
 * sample
 */
const sampleExample = async () => {
    interval(100).pipe(take(10), sample(interval(200))).subscribe(
        x => console.log('sample:', x));

    // Wait for first example...
    await new Promise(resolve => setTimeout(resolve, 1000));

    zip(of('Joe', 'Frank', 'Bob'), interval(200)).pipe(
        sample(interval(250)),
    ).subscribe(x => console.log('sample zip:', x));
};

/**
 * single
 */
const singleExample = () => {
    of(1, 2, 3, 4, 5).pipe(single(x => x === 3)).subscribe(
        x => console.log('single:', x));

    of(1, 2, 3, 4, 5).pipe(single(x => x > 3)).subscribe(
        x => console.log('single next:', x),
        x => console.log('single error:', x));
};

/**
 * skip
 */
const skipExample = () => {
    interval(100).pipe(take(10), skip(5)).subscribe(
        x => console.log('skip:', x));
};

/**
 * skipUntil
 */
const skipUntilExample = () => {
    interval(100).pipe(
        take(10),
        skipUntil(timer(550)),
    ).subscribe(x => console.log('skipUntil:', x));
};

/**
 * skipWhile
 */
const skipWhileExample = () => {
    of(1, 2, 3, 4, 5).pipe(skipWhile(x => x < 3)).subscribe(
        x => console.log('skipWhile:', x));
};

/**
 * take
 */
const takeExample = () => {
    of(1, 2, 3, 4, 5).pipe(take(3)).subscribe(
        x => console.log('take:', x));
};

/**
 * takeLast
 */
const takeLastExample = () => {
    of(1, 2, 3, 4, 5).pipe(takeLast(3)).subscribe(
        x => console.log('takeLast:', x));
};

/**
 * takeUntil
 */
const takeUntilExample = () => {
    interval(100).pipe(takeUntil(timer(550))).subscribe(
        x => console.log('takeUntil:', x));
};

/**
 * takeWhile
 */
const takeWhileExample = () => {
    of(1, 2, 3, 4, 5).pipe(takeWhile(x => x < 4)).subscribe(
        x => console.log('takeWhile(x => x < 4):', x));

    of(1, 2, 3, 4, 5).pipe(takeWhile(x => x < 4, true)).subscribe(
        x => console.log('takeWhile(x => x < 4, true):', x));
};

/**
 * throttle
 */
const throttleExample = async () => {
    interval(100).pipe(
        throttle(() => interval(250)),
        take(10),
    ).subscribe(x => console.log('throttle:', x));

    // Wait for first example...
    await new Promise(resolve => setTimeout(resolve, 3000));

    interval(100).pipe(
        throttle(
            x => new Promise(
                resolve => setTimeout(
                    () => resolve(`resolved: ${x}`), x * 100))),
        take(6),
    ).subscribe(x => console.log('throttle promise:', x));
};

/**
 * throttleTime
 */
const throttleTimeExample = async () => {
    interval(100).pipe(
        throttleTime(250),
        take(10),
    ).subscribe(
        x => console.log('throttleTime:', x));

    // Wait for first example...
    await new Promise(resolve => setTimeout(resolve, 3000));

    interval(100).pipe(
        throttleTime(250, asyncScheduler, {trailing: true}),
        take(10),
    ).subscribe(
        x => console.log('throttleTime trailing:', x));
};
