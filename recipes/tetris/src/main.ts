import {Observable, fromEvent, merge, timer} from 'rxjs';
import {map, mapTo, scan, tap} from 'rxjs/operators';

const FPS = 1;
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const N_BRICK_TYPES = 7;
const UNSPAWNED_POS = -1;
const CELL_SIZE_PX = 15;

const LOADING_ID = 'loading';
const START_GAME_ID = 'start-game';
const RESTART_GAME_ID = 'restart-game';
const UNSTARTED_ID = 'unstarted';
const IN_PROGRESS_ID = 'in-progress';
const GAME_OVER_ID = 'game-over';
const GAME_OVER_SCORE_ID = 'game-over-score';
const SIDEBAR_SCORE_ID = 'sidebar-score';
const BOARD_ID = 'board';

const CELL_CLASS = 'cell';

/**
 * Different "modes" the game can be in.
 * Each phase has a different view.
 */
enum GamePhase {
    UNSTARTED = 0,
    IN_PROGRESS = 1,
    OVER = 2,
}

/**
 * Types of 4x4 bricks in Tetris.
 */
enum BrickType {
    I = 0,
    L = 1,
    J = 2,
    O = 3,
    S = 4,
    Z = 5,
    T = 6,
}

const randomBrickType = (): BrickType =>
    Math.floor(Math.random() * N_BRICK_TYPES);

type EmptyCell = -1;

type Cell = BrickType | EmptyCell;

const emptyCell: Cell = -1;

const isEmptyCell = (c: Cell): c is EmptyCell => c === emptyCell;

/**
 * Create the game grid. It will store all bricks except the currently
 * dropping one. It's a multi-dimensional array where each subarray is
 * a row. This representation makes clearing rows easier.
 */
const initEmptyCells = (width: number, height: number) =>
    [...Array(height)].map(() => [...Array(width)].map(() => emptyCell));

/**
 * State of the currently falling brick.
 */
interface Brick {
    type: BrickType;
    x: number;
    y: number;
    theta: number; // rotation.
}

const isUnspawned = (b: Brick) => [b.x, b.y].includes(UNSPAWNED_POS);

/**
 * Interface for game state.
 */
interface State {
    phase: GamePhase;
    cells: Cell[][];
    score: number;
    brick: Brick;
    queue: BrickType[];
}

/**
 * Initialize state for the start of a game with a random
 * brick type.
 */
const initialState = (): State => ({
    phase: GamePhase.UNSTARTED,
    cells: initEmptyCells(GRID_WIDTH, GRID_HEIGHT),
    score: 0,
    brick: {
        type: randomBrickType(),
        x: UNSPAWNED_POS,
        y: UNSPAWNED_POS,
        theta: 0,
    },
    queue: [...Array(4)].map(() => randomBrickType()),
});

/**
 * Update state after a clock tick.
 */
const tickClock = (state: State): State => {
    if (state.phase !== GamePhase.IN_PROGRESS) return state;
};

/**
 * Possible actions on the state.
 */
enum Action {
    TICK_CLOCK = 0,
    START_GAME = 1,
    DOWN = 2,
    LEFT = 3,
    RIGHT = 4,
    UP = 5,
}

/**
 * Define player controller.
 */

const getElem = (id: string) => document.getElementById(id);

const fromClick = (id: string) => fromEvent(getElem(id), 'click');

const clickToStart = (id: string): Observable<Action.START_GAME> =>
    fromClick(id).pipe(mapTo(Action.START_GAME));

const startGame$ = clickToStart(START_GAME_ID);
const restartGame$ = clickToStart(RESTART_GAME_ID);

enum KeyCode {
    DOWN = 'ArrowDown',
    LEFT = 'ArrowLeft',
    RIGHT = 'ArrowRight',
    UP = 'ArrowUp',
}

type KeyAction = Action.DOWN | Action.LEFT | Action.RIGHT | Action.UP;

const keyCodeToActionMap: {[key in KeyCode]?: KeyAction} = {
    [KeyCode.DOWN]: Action.DOWN,
    [KeyCode.LEFT]: Action.LEFT,
    [KeyCode.RIGHT]: Action.RIGHT,
    [KeyCode.UP]: Action.UP,
};

const keycodeToAction = (kc: KeyCode): KeyAction =>
    (keyCodeToActionMap[kc] || null);

const keyboard$ = fromEvent(document, 'keydown').pipe(
    map((ev: KeyboardEvent) => keycodeToAction(ev.code as KeyCode)));

const controller$: Observable<Action> = merge(startGame$, restartGame$, keyboard$);

/**
 * Rendering.
 */

const changeDisplay = (id: string, display: string) => {
    const el = getElem(id);
    if (el.style.display !== display) el.style.display = display;
};

const hideElem = (id: string) => changeDisplay(id, 'none');

const showElem = (id: string) => changeDisplay(id, 'flex');

const setInnerText = (id: string, text: string) => {
    const el = getElem(id);
    if (el.textContent !== text) el.textContent = text;
}

const renderPhase = (phase: GamePhase) => {
    switch (phase) {
        case GamePhase.UNSTARTED:
            showElem(UNSTARTED_ID);
            hideElem(IN_PROGRESS_ID);
            hideElem(GAME_OVER_ID);
            break;
        case GamePhase.IN_PROGRESS:
            hideElem(UNSTARTED_ID);
            showElem(IN_PROGRESS_ID);
            hideElem(GAME_OVER_ID);
            break;
        case GamePhase.OVER:
            hideElem(UNSTARTED_ID);
            hideElem(IN_PROGRESS_ID);
            showElem(GAME_OVER_ID);
            break;
        default:
            throw new Error(`Unexpected phase: ${phase}`);
    }
};

const scoreString = (s: State) => `Score: ${s.score}`;

const cellId = (x: number, y: number) => `cell-${x}-${y}`;

const px = (x: number) => `${x}px`;

const brickTypeToClassMap: {[key in Cell]?: string} = {
    [BrickType.I]: 'cell-i',
    [BrickType.L]: 'cell-l',
    [BrickType.J]: 'cell-j',
    [BrickType.O]: 'cell-o',
    [BrickType.S]: 'cell-s',
    [BrickType.Z]: 'cell-z',
    [BrickType.T]: 'cell-t',
    [emptyCell]: 'empty',
};

const setClasslist = (el: HTMLElement, ...classes: string[]) => {
    if (classes.every(cls => el.classList.contains(cls))) return;
    el.className = '';
    el.classList.add(...classes);
};

const createGridIfNotExists = (state: State) => {
    const board = getElem(BOARD_ID);
    if (board.children.length) return;
    for (let x = 0; x < GRID_WIDTH; x++) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            const el = document.createElement('div');
            el.id = cellId(x, y);
            setClasslist(el, CELL_CLASS, brickTypeToClassMap[emptyCell]);
            el.style.left = px(CELL_SIZE_PX * x);
            el.style.top = px(CELL_SIZE_PX * y);
            board.appendChild(el);
        }
    }
};

const renderCells = (state: State) => {
    for (let x = 0; x < GRID_WIDTH; x++) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            setClasslist(
                getElem(cellId(x, y)), CELL_CLASS,
                brickTypeToClassMap[state.cells[y][x]]);
        }
    }
};

const renderGameFromState = (state: State) => {
    setInnerText(SIDEBAR_SCORE_ID, scoreString(state));
    createGridIfNotExists(state);
    renderCells(state);
};

const render = (state: State) => {
    hideElem(LOADING_ID);
    renderPhase(state.phase);
    switch (state.phase) {
        case GamePhase.IN_PROGRESS:
            renderGameFromState(state);
            return;
        case GamePhase.OVER:
            setInnerText(GAME_OVER_SCORE_ID, scoreString(state));
        default:
            return;
    }
};

/**
 * Clock ticking is used to update the bricks' vertical position.
 */

const clock$ = timer(0, 1000 / FPS).pipe(mapTo(Action.TICK_CLOCK));

/**
 * Game loop uses Redux-style reducer.
 */

const handleActions = (state: State, action: Action): State => {
    switch (action) {
        case Action.TICK_CLOCK:
            return tickClock(state);
        case Action.START_GAME:
            return {
                ...initialState(),
                phase: GamePhase.IN_PROGRESS,
            };
        case Action.LEFT:
        case Action.RIGHT:
        case Action.UP:
            console.log('key press!');
        default:
            return state;
    }
}

const game$ = merge(clock$, controller$).pipe(
    scan(handleActions, initialState()),
    tap(render));

game$.subscribe();
