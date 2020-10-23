import {EventEmitter} from 'events';
import {Observable, Observer, defer, from, fromEvent, generate, empty, interval, merge, of, range, throwError, timer} from 'rxjs';
import {AjaxResponse, ajax} from 'rxjs/ajax';
import {endWith, map, mapTo, scan, startWith, switchMap, take, takeWhile} from 'rxjs/operators';
import {XMLHttpRequest} from 'xmlhttprequest';

/**
 * ajax
 */
const nodeAjax = (url: string) => ajax({
    url,
    createXHR: () => new XMLHttpRequest(),
    crossDomain: true,
    withCredentials: false,
    method: 'GET',
});

const nodeAjaxGetJson = (url: string) => ajax({
    url,
    createXHR: () => new XMLHttpRequest(),
    crossDomain: true,
    withCredentials: false,
    method: 'GET',
}).pipe(map((x: AjaxResponse) => x.response));

const ajaxExample = () => {
    nodeAjax('https://api.github.com/users?per_page=2').subscribe(
        x => console.log('ajax success:', x),
        err => console.log('ajax error:', err));

    nodeAjax('https://api.github.com/error').subscribe(
        x => console.log('ajax success:', x),
        err => console.log('ajax error:', err));

    nodeAjaxGetJson('https://api.github.com/users?per_page=2').subscribe(
        x => console.log('ajax getJSON success:', x),
        err => console.log('ajax getJSON error:', err));
};

/**
 * create
 */
const createExample = () => {
    const obs$ = Observable.create((obs: Observer<string>) => {
        obs.next('Hello');
        obs.next('world!');
        obs.complete();
    }) as Observable<string>;

    obs$.subscribe(x => console.log('create:', x));

    const interval$ = Observable.create((obs: Observer<number>) => {
        let value = 0;
        const id = setInterval(() => {
            if (value % 2 === 0) obs.next(value);
            value++;
        }, 250);
        return () => clearInterval(id);
    }) as Observable<number>;

    const sub = interval$.subscribe(x => console.log('create interval:', x));
    setTimeout(() => sub.unsubscribe(), 2000);
};

/**
 * defer
 */
const deferExample = async () => {
    // Date is time that observable is created.
    const s1$ = of(['s1', new Date()]);
    // Date is time that observable is subscribed to.
    const s2$ = defer(() => of(['s2', new Date()]));

    await new Promise(resolve => setTimeout(resolve, 5e3));

    of('tmp').pipe(switchMap(() => merge(s1$, s2$)))
        .subscribe(x => console.log('defer:', x));
};

/**
 * empty
 */
const emptyExample = async () => {
    empty().subscribe({
        next: () => console.log('empty: next'),
        complete: () => console.log('empty: complete'),
    });

    const controller = new EventEmitter();

    const interval$ = interval(1000).pipe(mapTo(-1));
    const pause$ = fromEvent(controller, 'pause').pipe(mapTo(false));
    const resume$ = fromEvent(controller, 'resume').pipe(mapTo(true));

    merge(pause$, resume$).pipe(
        startWith(false),
        switchMap(x => (x ? interval$ : empty())),
        scan((acc, x) => (x ? acc + x : acc), 10),
        takeWhile(x => x > 0),
        endWith('Lift off!'),
    ).subscribe(x => console.log(x));

    controller.emit('resume');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('pausing for 3s...');
    controller.emit('pause');
    await new Promise(resolve => setTimeout(resolve, 3000));
    controller.emit('resume');
};

/**
 * from
 */
const fromExample = () => {
    from([1, 2, 3, 4, 5]).subscribe(x => console.log('from array:', x));

    from(new Promise(resolve => resolve('Hello world!'))).subscribe(
        x => console.log('from promise:', x));

    const map = new Map<string, number>();
    map.set('foo', 1);
    map.set('bar', 2);
    
    from(map).subscribe(x => console.log('from map:', x));

    from('Hello world!').subscribe(x => console.log('from string:', x));
};

/**
 * fromEvent
 */
const fromEventExample = () => {
    const emitter = new EventEmitter();
    fromEvent(emitter, 'foobar').subscribe(x => console.log('fromEvent:', x));
    emitter.emit('foobar', 'Hello world!');
};

/**
 * generate
 */
const generateExample = () => {
    generate(2, x => x <= 8, x => x + 3).subscribe(
        x => console.log('generate:', x));

    generate(2, x => x <= 8, x => ++x, x => '.'.repeat(x)).subscribe(
        x => console.log('generate result selector:', x));
};

/**
 * interval
 */
const intervalExample = () => {
    interval(1000).pipe(take(5)).subscribe(x => console.log('interval:', x));
};

/**
 * of
 */
const ofExample = () => {
    of(1, 2, 3, 4, 5).subscribe(x => console.log('of:', x));

    of({foo: 'bar'}, [1, 2, 3], () => 'hello').subscribe(x => console.log('of:', x));
};

/**
 * range
 */
const rangeExample = () => {
    range(1, 10).subscribe(x => console.log('range:', x));
};

/**
 * throwError
 */
const throwErrorExample = () => {
    throwError('this will throw').subscribe({
        next: () => console.log('this should not log'),
        complete: () => console.log('this should not log'),
        error: err => console.log('throwError:', err),
    })
};

/**
 * timer
 */
const timerExample = () => {
    timer(1000).pipe(take(3)).subscribe(x => console.log('timer(1000):', x));

    timer(1000, 2000).pipe(take(3)).subscribe(x => console.log('timer(1000, 2000):', x));
};
