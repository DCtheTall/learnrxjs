import {EventEmitter} from 'events';

import {from, fromEvent} from 'rxjs';
import {map, mapTo, pluck} from 'rxjs/operators';

const numbers = [1, 2, 3, 4, 5];

console.log('numbers.map:', numbers.map(x => 10 * x));
console.log('numbers:', numbers);

const people = [
    {firstName: 'Dylan', lastName: 'Cutler'},
    {firstName: 'Jerry', lastName: 'Lawson'},
    {firstName: 'Cardi', lastName: 'B'},
];

console.log('people with full names:', people.map(
    p => ({...p, fullName: `${p.firstName} ${p.lastName}`})));

console.log('last names:', people.map(p => p.lastName));

const numbers$ = from(numbers);

// Log numbers sequentially.
numbers$.subscribe(x => console.log('numbers$:', x));

// Log numbers multiplied by 10.
numbers$.pipe(map((x: number) => 10 * x)).subscribe(
    x => console.log('numbers$ -> map(x => 10 *x):', x));

// We use an event emitter as the "document" to run the code in Node.js.
const document = new EventEmitter();
const click$ = fromEvent(document, 'click');

const clickMapSub = click$.pipe(
    map((event: MouseEvent) =>
        ({x: event.clientX, y: event.clientY}))).subscribe(
            x => console.log('click$ -> map:', x));

document.emit(
    'click', {clientX: 200, clientY: 100, isTrusted: true} as MouseEvent);
clickMapSub.unsubscribe();

const keyup$ = fromEvent(document, 'keyup');

// pluck operator maps through a single property of the object.
const keyupPluckCodeSub = keyup$.pipe(pluck('code')).subscribe(
    x => console.log('keyup$ -> pluck(code):', x));

document.emit('keyup', {code: 'Space', target: null} as KeyboardEvent);
keyupPluckCodeSub.unsubscribe();

// Grabbing nested properties with pluck.
const clickPluckSub = click$.pipe(pluck('target', 'nodeName')).subscribe(
    x => console.log('click$ -> pluck(target, nodeName):', x));

document.emit('click', {target: {nodeName: 'DIV'} as object} as Event);
clickPluckSub.unsubscribe();

// mapTo operator maps the stream to a constant.
const clickMapToSub = click$.pipe(mapTo('You clicked!')).subscribe(
    x => console.log('click$ -> mapTo(You clicked!):', x));

document.emit('click', {});
clickMapToSub.unsubscribe();