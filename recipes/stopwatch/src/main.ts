import {fromEvent, interval, merge, NEVER} from 'rxjs';
import {map, mapTo, scan, switchMap, tap} from 'rxjs/operators';

interface State {
    count: number;
    counting: boolean;
    countup: boolean;
    speed: number;
    increase: number;
}

const initialState = (): State => ({
    count: 0,
    counting: false,
    countup: true,
    speed: 1000,
    increase: 1,
});

const getElem = (id: string) => document.getElementById(id);

const fromClick = (id: string) => fromEvent(getElem(id), 'click');

const mapClickTo = (id: string, newState: Partial<State>) =>
    fromClick(id).pipe(mapTo(newState));

const mapClick = (id: string, fn: () => Partial<State>) =>
    fromClick(id).pipe(map(fn));

const setValue = (state: State) => {
    getElem('counter').textContent = state.count.toString();
};

const getValue = (id: string) =>
    parseInt((getElem(id) as HTMLInputElement).value, 10);

merge(
    mapClickTo('start', {counting: true}),
    mapClickTo('pause', {counting: false}),
    mapClickTo('stop', {count: 0, counting: false}),
    mapClickTo('countup', {countup: true}),
    mapClickTo('countdown', {countup: false}),
    mapClick('setvalue', () => ({count: getValue('valueinput')})),
    mapClick('setspeed', () => ({speed: getValue('speedinput')})),
    mapClick('setincrease', () => ({increase: getValue('increaseinput')})),
).pipe(
    scan(
        (acc: State, cur: Partial<State>): State => ({...acc, ...cur}),
        initialState(),
    ),
    tap((state: State) => setValue(state)),
    switchMap((state: State) =>
        (state.counting ? interval(state.speed).pipe(
            tap(() => {
                state.count += (state.countup ? 1 : -1) * state.increase;
                setValue(state);
            }),
        ) : NEVER)),
).subscribe();
