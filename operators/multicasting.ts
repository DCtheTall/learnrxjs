import {ConnectableObservable, ReplaySubject, Subject, interval, timer} from 'rxjs';
import {multicast, pluck, publish, share, shareReplay, take, tap} from 'rxjs/operators';

/**
 * publish
 */

const publishExample = () => {
    const example$ = interval(250).pipe(
        take(2),
        tap(() => console.log('publish: tap!')),
        publish(),
    ) as ConnectableObservable<number>;
    
    example$.subscribe(x => console.log('publish sub 1:', x));
    example$.subscribe(x => console.log('publish sub 2:', x));

    setTimeout(() => example$.connect(), 2000);
};

/**
 * multicast
 */

const multicastExample = async () => {
    const multi1$ = interval(250).pipe(
        take(2),
        tap(() => console.log('multicast 1: side effect')),
        multicast(() => new Subject()),
    ) as ConnectableObservable<number>;

    multi1$.subscribe(x => console.log('multicast 1 sub 1:', x));
    multi1$.subscribe(x => console.log('multicast 1 sub 2:', x));

    multi1$.connect();

    await new Promise(resolve => setTimeout(resolve, 1000));

    const multi2$ = interval(250).pipe(
        take(5),
        tap(() => console.log('multicast 2: side effect')),
        multicast(() => new ReplaySubject(5)),
    ) as ConnectableObservable<number>;

    multi2$.connect();
    
    await new Promise(resolve => setTimeout(resolve, 2.5 * 250));

    multi2$.subscribe(x => console.log('multicast 2:', x));
};

/**
 * share
 */

const shareExample = () => {
    const source$ = timer(1000).pipe(
        tap(() => console.log('share: side effect')));

    source$.subscribe(x => console.log('share sub 1:', x));
    source$.subscribe(x => console.log('share sub 2:', x));

    const shared$ = source$.pipe(share());

    shared$.subscribe(x => console.log('share sub 3:', x));
    shared$.subscribe(x => console.log('share sub 4:', x));
};

/**
 * shareWithReplay
 */

const shareWithReplayExample = () => {
    const routeEnd = new Subject<{data: object, url: string}>();

    const lastUrl$ = routeEnd.pipe(
        tap(() => console.log('shareWithReplay: side effect')),
        pluck('url'),
        shareReplay(1),
    );

    lastUrl$.subscribe(x => console.log('shareWithReplay sub 1:', x));
    routeEnd.next({data: {}, url: '/some/path'});

    // With share() alone this would not log anything.
    lastUrl$.subscribe(x => console.log('shareWithReplay sub 2:', x));
};
shareWithReplayExample();
