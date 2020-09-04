import {concat, empty, interval, combineLatest, forkJoin, of, timer, Observable} from 'rxjs';
import {ajax} from 'rxjs/ajax';
import {combineAll, concatAll, delay, endWith, finalize, map, startWith, take} from 'rxjs/operators';
import {XMLHttpRequest} from 'xmlhttprequest';

/**
 * combineAll
 */

const combineAllSource$ = interval(1000).pipe(take(2));

const combineAllExample$ = combineAllSource$.pipe(
    map(i => interval(1000).pipe(
        map(j => `observer ${i} emitted ${j}`),
        take(5))));

combineAllExample$.pipe(combineAll()).subscribe(
    x => console.log('combineAll:', x));

/**
 * combineLatest
 */

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

/**
 * concat
 */

concat(of(1, 2, 3), of(4, 5, 6), of(7, 8, 9)).subscribe(
    x => console.log('concat of:', x));

const delayedMessage =
    (message: string, delayTime: number = 1000): Observable<string> =>
        empty().pipe(startWith(message), delay(delayTime));

concat(
    delayedMessage('Get Ready!', 8000),
    delayedMessage('3'),
    delayedMessage('2'),
    delayedMessage('1'),
    delayedMessage('Go!')).subscribe(
        x => console.log('concat delayedMessage:', x));

/**
 * concatAll
 */

const concatAllSource$ = interval(500);
concatAllSource$.pipe(
    delay(15000), map(x => of(x + 10)), concatAll(), take(5)).subscribe(
        x => console.log('concatAll:', x));

/**
 * endWith
 */

const endAllSourceOne$ = of('Hello', 'Friend');

endAllSourceOne$.pipe(
    endWith('Goodbye', 'Friend'),
    finalize(() => console.log('endWith: finalize'))).subscribe(
        x => console.log('endWith:', x));

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

forkJoin(
    {
      google: getJSON('https://api.github.com/users/google'),
      microsoft: getJSON('https://api.github.com/users/microsoft'),
    }).subscribe(x => console.log('forkJoin:', x));