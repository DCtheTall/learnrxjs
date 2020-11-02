import {AsyncSubject} from 'rxjs';

const sub = new AsyncSubject();
sub.subscribe(x => console.log('AsyncSubject 1:', x));
sub.next(123);
sub.subscribe(x => console.log('AsyncSubject 2:', x));
sub.next(456);
console.log('Nothing should log before this message');
sub.complete();
