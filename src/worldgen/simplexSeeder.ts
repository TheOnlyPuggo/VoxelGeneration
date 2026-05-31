import {MathUtils} from "three";

export class SimplexSeeder {
    private seed: number;

    public constructor(seed: number) {
        this.seed = seed;
    }

    public random(): number {
        this.seed = MathUtils.seededRandom(this.seed);
        return MathUtils.seededRandom();
    }
}