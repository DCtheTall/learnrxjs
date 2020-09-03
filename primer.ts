import {concat, fromEvent, interval, of} from 'rxjs';
import {delay, filter, map, mergeMap, scan, shareReplay, switchMap, take} from 'rxjs/operators';
import {EventEmitter} from 'events';

const emitter = new EventEmitter();
const myObservable = fromEvent(emitter, 'foobar');
const subscription = myObservable.subscribe(event => console.log(event));

emitter.emit('foobar', 'Hello world!');

const secondSubscription = myObservable.subscribe(event => console.log(event));

emitter.emit('foobar', 'This should print twice!');

subscription.unsubscribe();
secondSubscription.unsubscribe();

const dataSource = of(1, 2, 3, 4, 5);

// Print all elements +1 using map.
dataSource.pipe(map(value => value + 1)).subscribe(value => console.log(`Map +1: ${value}`));

// Print all values >= 2 using filter.
dataSource.pipe(filter(value => value >= 2)).subscribe(value => console.log(`Filter >= 2: ${value}`));

// Print the first 2 values using take.
dataSource.pipe(take(2)).subscribe(value => console.log(`Take 2: ${value}`));

// shareReplay example.
const intervalObs = interval(100);
const shared = intervalObs.pipe(
    take(4),
    shareReplay(3));
shared.subscribe(x => console.log('Source A: ', x));
shared.subscribe(y => console.log('Source B: ', y));

// scan example.
of({foo: 0}, {bar: 1}, {baz: 2}).pipe(
    scan((acc, el) => ({...acc, ...el}))).subscribe(
        value => console.log('scan accumulator:', value));

// Fake network request
const fakePostData = (data: object) => of(data).pipe(delay(500));

// Post the data using a network request fake using mergeMap.
fromEvent(emitter, 'mergeMap').pipe(
    mergeMap((data: object) => fakePostData(data))).subscribe(
        data => console.log('mergeMap posted:', data));

emitter.emit('mergeMap', {foo: 'bar'});
emitter.emit('mergeMap', {bar: 'baz'});

fromEvent(emitter, 'switchMap').pipe(
    switchMap((data: object) => fakePostData(data))).subscribe(
        data => console.log('switchMap posted:', data));

emitter.emit('switchMap', {foo: 'bar'});
emitter.emit('switchMap', {bar: 'baz'});

concat(
   of(1, 2, 3),
   of(4, 5, 6),
   of(7, 8, 9)).subscribe(
        value => console.log('concat:', value));