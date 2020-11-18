import {Observable, fromEvent, merge, timer} from 'rxjs';
import {map, mapTo, scan, tap} from 'rxjs/operators';

const FPS = 10;
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const N_BRICK_TYPES = 7;
const UNSPAWNED_POS = -Infinity;
const CELL_SIZE_PX = 15;
const QUEUE_SIZE = 4;

const LOADING_ID = 'loading';
const START_GAME_ID = 'start-game';
const RESTART_GAME_ID = 'restart-game';
const UNSTARTED_ID = 'unstarted';
const IN_PROGRESS_ID = 'in-progress';
const GAME_OVER_ID = 'game-over';
const GAME_OVER_SCORE_ID = 'game-over-score';
const SIDEBAR_SCORE_ID = 'sidebar-score';
const BOARD_ID = 'board';
const FALLING_BRICK_ID = 'falling-brick';

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

type Bit = 0 | 1;

type BitGrid = Bit[][];

/**
 * Map brick types to their shape.
 * This is only used for the falling brick.
 * When a brick lands it is written to a more
 * static data structure.
 */
const brickTypeToShapeMap: {[key in BrickType]?: BitGrid} = {
    [BrickType.I]: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ],
    [BrickType.L]: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
    ],
    [BrickType.J]: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
    ],
    [BrickType.O]: [
        [1, 1],
        [1, 1],
    ],
    [BrickType.S]: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
    ],
    [BrickType.Z]: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
    ],
    [BrickType.T]: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
    ],
};

const bitGridDims = (b: BitGrid) => ({width: b[0].length, height: b.length});

const removeBottomRow = (b: BitGrid) => b.slice(0, b.length - 1);

const randomBrickType = (): BrickType =>
    Math.floor(Math.random() * N_BRICK_TYPES);

type EmptyCell = -1;

type Cell = BrickType | EmptyCell;

const emptyCell: Cell = -1;

type Grid = Cell[][];

/**
 * Create a new empty row.
 */
const initEmptyRow = (width: number) => [...Array(width)].map(() => emptyCell);

/**
 * Create the game grid. It will store all bricks except the currently
 * dropping one. It's a multi-dimensional array where each subarray is
 * a row. This representation makes clearing rows easier.
 */
const initEmptyCells = (width: number, height: number) =>
    [...Array(height)].map(() => initEmptyRow(width));

/**
 * Currently falling brick code.
 */

/**
 * A class holds all state and defines helper methods.
 * I chose this pattern over completely immutable state for brevity.
 */
class FallingBrick {
    type: BrickType;
    x: number;
    y: number;
    theta: number; // rotation.

    constructor() {
        this.type = randomBrickType();
        this.x = UNSPAWNED_POS;
        this.y = UNSPAWNED_POS;
        this.theta = 0;
    }

    isUnspawned(): boolean {
        return this.x === UNSPAWNED_POS;
    }

    spawn() {
        this.x = 3;
        this.y = 3;
    }

    rotate() {
        // TODO collision detection, reposition, and wall kicking
        this.theta = (this.theta + 90) % 360;
    }

    moveLeft() {
        // TODO collision
        this.x--;
    }

    moveRight() {
        // TODO collision
        this.x++;
    }

    bitGrid(): BitGrid {
        const shape = brickTypeToShapeMap[this.type];
        // TODO apply rotation.
        return shape;
    }

    private isTouchingFloor() {
        const shape = this.bitGrid();
        const {height} = bitGridDims(shape);
        for (let y = height; y > 0; y--) {
            if (shape[y-1].every(x => !x)) continue; // Skip empty rows.
            if (this.y + y === GRID_HEIGHT) return true;
        }
        return false;
    }

    /**
     * Boolean indicates whether the block can should stop falling.
     */
    tickGravity() {
        if (this.isTouchingFloor()) return true;
        this.y++;
        return false;
    }

    fastFall() {}
}

type Queue = BrickType[];

/**
 * Interface for game state.
 */
interface State {
    phase: GamePhase;
    bricks: Grid;
    score: number;
    fallingBrick: FallingBrick;
    queue: Queue;
}

/**
 * Initialize state for the start of a game with a random
 * brick type.
 */
const initialState = (): State => ({
    phase: GamePhase.UNSTARTED,
    bricks: initEmptyCells(GRID_WIDTH, GRID_HEIGHT),
    score: 0,
    fallingBrick: new FallingBrick(),
    queue: [...Array(QUEUE_SIZE)].map(() => randomBrickType()),
});

const serializeBrickToGrid = (state: State) => {
    const shape = state.fallingBrick.bitGrid();
    const {width, height} = bitGridDims(shape);
    for (let y = 0; y < height; y++) {
        if (shape[y].every(x => !x)) continue;
        for (let x = 0; x < width; x++) {
            if (!shape[y][x]) continue;
            state.bricks[state.fallingBrick.y + y][state.fallingBrick.x + x] =
                state.fallingBrick.type;
        }
    }
}

/**
 * Update state after a clock tick.
 */
const tickClock = (state: State): State => {
    if (state.phase !== GamePhase.IN_PROGRESS) return state;
    if (state.fallingBrick.isUnspawned()) state.fallingBrick.spawn();
    if (state.fallingBrick.tickGravity()) {
        serializeBrickToGrid(state);
        // TODO row detection
        state.fallingBrick = new FallingBrick();
    }
    return state;
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

const brickTypeToClassMap: {[key in Cell]?: string} = {
    [BrickType.I]: 'cell-i',
    [BrickType.L]: 'cell-l',
    [BrickType.J]: 'cell-j',
    [BrickType.O]: 'cell-o',
    [BrickType.S]: 'cell-s',
    [BrickType.Z]: 'cell-z',
    [BrickType.T]: 'cell-t',
};

const hasClasses = (el: HTMLElement, classes: string[]) =>
    (classes.length === el.classList.length
        && classes.every(cls => el.classList.contains(cls)));

const setClasslist = (el: HTMLElement, ...classes: string[]) => {
    if (hasClasses(el, classes)) return;
    el.className = '';
    el.classList.add(...classes.filter(Boolean));
};

const px = (x: number) => `${x * CELL_SIZE_PX}px`;

const hasPos = (el: HTMLElement, x: number, y: number) =>
    (el.style.left === px(x) && el.style.top === px(y));

const setPos = (el: HTMLElement, x: number, y: number) => {
    if (hasPos(el, x, y)) return;
    el.style.left = px(x);
    el.style.top = px(y);
}

const createGridIfDoesntExist = () => {
    const board = getElem(BOARD_ID);
    if (board.children.length > 1) return;
    for (let x = 0; x < GRID_WIDTH; x++) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            const el = document.createElement('div');
            el.id = cellId(x, y);
            setClasslist(el, CELL_CLASS);
            setPos(el, x, y);
            board.appendChild(el);
        }
    }
};

const renderStationaryBricks = (cells: Grid) => {
    createGridIfDoesntExist();
    for (let x = 0; x < GRID_WIDTH; x++) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            setClasslist(
                getElem(cellId(x, y)), CELL_CLASS,
                brickTypeToClassMap[cells[y][x]] || '');
        }
    }
};

const setDims = (el: HTMLElement, width: number, height: number) => {
    if (el.style.width !== px(width)) el.style.width = px(width);
    if (el.style.height !== px(height)) el.style.height = px(height);
};

const renderBrickFromGrid = (container: HTMLElement, shape: BitGrid, type: BrickType, x0: number, y0: number) => {
    const {width, height} = bitGridDims(shape);
    setDims(container, width, height);
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            if (!shape[y][x]) continue;
            const el = document.createElement('div');
            setClasslist(el, CELL_CLASS, brickTypeToClassMap[type]);
            setPos(el, x0 + x, y0 + y);
            container.appendChild(el);
        }
    }
};

const renderQueueBrick = (container: HTMLElement, type: BrickType) => {
    let shape = brickTypeToShapeMap[type];
    // All but O bricks have an empty bottom row.
    if (type !== BrickType.O) shape = removeBottomRow(shape);
    // I bricks have 2 empty bottom rows.
    if (type === BrickType.I) shape = removeBottomRow(shape);
    renderBrickFromGrid(container, shape, type, 0, 0);
};

const renderQueue = (queue: Queue) => {
    for (let i = 0; i < QUEUE_SIZE; i++) {
        renderQueueBrick(getElem(`queue-${i}`), queue[i]);
    }
};

const renderFallingBrick = (fb: FallingBrick) => {
    if (fb.isUnspawned()) return;

    const container = getElem(FALLING_BRICK_ID);
    while (container.lastChild) container.removeChild(container.lastChild);

    const shape = brickTypeToShapeMap[fb.type];
    renderBrickFromGrid(container, shape, fb.type, fb.x, fb.y);
};

const renderGameFromState = (state: State) => {
    setInnerText(SIDEBAR_SCORE_ID, scoreString(state));
    renderStationaryBricks(state.bricks);
    renderQueue(state.queue);
    renderFallingBrick(state.fallingBrick);
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
            return {...initialState(), phase: GamePhase.IN_PROGRESS};
        case Action.LEFT:
            state.fallingBrick.moveLeft();
            return state;
        case Action.RIGHT:
            state.fallingBrick.moveRight();
            return state;
        case Action.UP:
            state.fallingBrick.rotate();
            return state;
        case Action.DOWN:
            state.fallingBrick.fastFall();
        default:
            return state;
    }
}

const game$ = merge(clock$, controller$).pipe(
    scan(handleActions, initialState()),
    tap(render));

game$.subscribe();
