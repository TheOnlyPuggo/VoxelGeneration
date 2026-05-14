import {Scene} from "three";
import {BlockPos} from "../positions/blockPos";
import {MinecraftBlockDictionary} from "../worldgen/blocks";
import {FaceMap} from "./faceMap";
import {Block} from "../worldgen/block";

interface ModelBlockData {
    pos: BlockPos,
    minecraftName: string,
}

interface StructureBlocksDictionary {
    [blockPosStringKey: string]: Block;
}

interface ModelNamesDictionary {
    [modelName: string]: Model;
}

export class Model {
    public static manualModelsToLoad: [BlockPos, StructureBlocksDictionary][] = [];
    public static LoadedModels: ModelNamesDictionary = {};

    private blockOriginPos: BlockPos;
    private modelData: string;
    private blockDatas: ModelBlockData[];

    constructor(modelData: string) {
        this.modelData = modelData;
        
        const dataLines: string[] = modelData.split(/\r?\n/);

        console.log(dataLines)
        const originBlockPosValues: number[] = dataLines[0].split(";")[1].split(",").map(Number);
        this.blockOriginPos = new BlockPos(
            originBlockPosValues[0],
            originBlockPosValues[1],
            originBlockPosValues[2]
        );

        this.blockDatas = [];
        for (let i = 1; i < dataLines.length; ++i) {
            const blockDataStrings: string[] = dataLines[i].split(",");
            let blockName: string = blockDataStrings[0];
            if (blockName.includes("[")) blockName = blockName.split("[")[0];

            let blockDataEntry: ModelBlockData = {
                pos: new BlockPos(
                    Number(blockDataStrings[1]) - this.blockOriginPos.x,
                    Number(blockDataStrings[2]) - this.blockOriginPos.y,
                    Number(blockDataStrings[3]) - this.blockOriginPos.z
                ),
                minecraftName: blockName
            };

            this.blockDatas.push(blockDataEntry);
        }
    }

    public static async LoadModelData(): Promise<void> {
        Model.LoadedModels["Tree"] = await Model.load("model_data/plains_tree.csv");
        Model.LoadedModels["DirtHut"] = await Model.load("model_data/dirt_hut.csv");
        Model.LoadedModels["Mushroom"] = await Model.load("model_data/dirt_mushroom.csv");
    }

    static async load(modelDataPath: string): Promise<Model> {
        const data = await loadCSV(import.meta.env.BASE_URL + modelDataPath);
        return new Model(data);
    }

    // not chunk based
    // hardLoadStructureAt(scene: Scene, blockOriginPos: BlockPos) {
    //     this.blockDatas.forEach((blockData) => {
    //         let block = MinecraftBlockDictionary[blockData.minecraftName];
    //         let blockGeometry = block.getGeometry(new FaceMap());
    //         blockGeometry?.translate(
    //             blockData.pos.x + blockOriginPos.x,
    //             blockData.pos.y + blockOriginPos.y,
    //             blockData.pos.z + blockOriginPos.z
    //         );
    //
    //         if (blockGeometry != null) {
    //             scene.add(blockGeometry.getCombinedMesh());
    //         }
    //     });
    // }

    // chunk based
    loadStructureAt(blockOriginPos: BlockPos) {
        let blocksDictionary: StructureBlocksDictionary = {};

        this.blockDatas.forEach((blockData) => {
            let blockWorldPos: BlockPos = new BlockPos(
                blockData.pos.x + blockOriginPos.x,
                blockData.pos.y + blockOriginPos.y,
                blockData.pos.z + blockOriginPos.z
            );

            blocksDictionary[blockWorldPos.getKey()] = MinecraftBlockDictionary[blockData.minecraftName];
        });

        Model.manualModelsToLoad.push([blockOriginPos, blocksDictionary]);
    }
}

async function loadCSV(path: string): Promise<string> {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load CSV: ${response.statusText}`);
    return await response.text();
}