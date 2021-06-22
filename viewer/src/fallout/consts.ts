
export enum Direction {
    NorthEast,
    East,
    SouthEast,
    SouthWest,
    West,
    NorthWest
}

export class Consts {
    static DirectionShortName(dir: Direction) {
        switch(dir) {
            case Direction.NorthEast: return 'NE';
            case Direction.East: return 'E';
            case Direction.SouthEast: return 'SE';
            case Direction.SouthWest: return 'SW';
            case Direction.West: return 'W';
            case Direction.NorthWest: return 'NW';
        }
    }
}