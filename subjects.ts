import {EventEmitter} from 'events';
import {AsyncSubject, BehaviorSubject, ReplaySubject, Subject, fromEvent, interval, merge} from 'rxjs';
import {mergeMap, scan, take, tap} from 'rxjs/operators';

const asyncSubjectExample = () => {
    const subj = new AsyncSubject();
    subj.subscribe(x => console.log('AsyncSubject 1:', x));
    subj.next(123);
    subj.subscribe(x => console.log('AsyncSubject 2:', x));
    subj.next(456);
    console.log('Nothing should log before this message');
    subj.complete();
};

const behaviorSubjectExample = async () => {
    const subj = new BehaviorSubject(123);
    subj.subscribe(x => console.log('BehaviorSubject 1:', x));
    subj.subscribe(x => console.log('BehaviorSubject 2:', x));
    subj.next(456);
    subj.subscribe(x => console.log('BehaviorSubject 3:', x));
    subj.next(789);

    const subj2 = new BehaviorSubject(0);
    const emitter = new EventEmitter();

    merge(
        fromEvent(emitter, 'addSubscriber').pipe(
            scan((acc) => ++acc, 3),
            mergeMap(i => subj2.pipe(
                tap(x => console.log(`BehaviorSubject ${i}:`, x)),
            )),
        ),
        interval(100).pipe(
            take(10),
            tap(x => subj2.next(x)),
        ),
    ).subscribe();

    await new Promise(resolve => setTimeout(resolve, 100));
    emitter.emit('addSubscriber');
    await new Promise(resolve => setTimeout(resolve, 350));
    emitter.emit('addSubscriber');
    await new Promise(resolve => setTimeout(resolve, 350));
    emitter.emit('addSubscriber');
};

const replaySubjectExample = () => {
    const subj = new ReplaySubject(3);
    subj.next(1);
    subj.next(2);
    subj.subscribe(x => console.log('ReplaySubject 1:', x));
    subj.next(3);
    subj.next(4);
    subj.subscribe(x => console.log('ReplaySubject 2:', x));
    subj.next(5);
};

const subjectExample = () => {
    const subj = new Subject();
    subj.next('This should not log');
    subj.subscribe(x => console.log('Subject 1:', x));
    subj.next(1);
    subj.subscribe(x => console.log('Subject 2:', x));
    subj.next(2);
};
