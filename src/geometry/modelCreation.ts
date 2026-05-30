import {BlockPos} from "../positions/blockPos";
import {MinecraftBlockDictionary} from "../worldgen/blocks";
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

interface GeneratedStructureBlock {
    pos: BlockPos;
    block: Block;
}

export class Model {
    public static generatedStructureBlocksToLoad: Map<string, GeneratedStructureBlock> = new Map<string, GeneratedStructureBlock>();
    public static LoadedModels: ModelNamesDictionary = {};

    private blockOriginPos: BlockPos;
    private blockDatas: ModelBlockData[];

    constructor(modelData: string) {
        const dataLines: string[] = modelData.split(/\r?\n/);

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
        Model.LoadedModels["Mushroom"] = await Model.load("model_data/mushroom.csv");
        Model.LoadedModels["PalmTree"] = await Model.load("model_data/palm_tree_1.csv");
    }

    static async load(modelDataPath: string): Promise<Model> {
        const data = await loadCSV(import.meta.env.BASE_URL + modelDataPath);
        return new Model(data);
    }

    public async loadModelInformation(blockOriginPos: BlockPos) {
        if (Model.generatedStructureBlocksToLoad.has(blockOriginPos.getKey())) return;
        let modelRotationIndex = (blockOriginPos.x + blockOriginPos.z) % 4;

        this.blockDatas.forEach((blockData) => {
            let blockPosX = 0;
            let blockPosZ = 0;

            switch (modelRotationIndex) {
                case 0:
                    blockPosX = blockData.pos.x + blockOriginPos.x;
                    blockPosZ = blockData.pos.z + blockOriginPos.z;
                    break;
                case 1:
                    blockPosX = -blockData.pos.z + blockOriginPos.x;
                    blockPosZ = blockData.pos.x + blockOriginPos.z;
                    break;
                case 2:
                    blockPosX = -blockData.pos.x + blockOriginPos.x;
                    blockPosZ = -blockData.pos.z + blockOriginPos.z;
                    break;
                case 3:
                    blockPosX = blockData.pos.z + blockOriginPos.x;
                    blockPosZ = -blockData.pos.x + blockOriginPos.z;
                    break;
            }

            let blockWorldPos: BlockPos = new BlockPos(
                blockPosX,
                blockData.pos.y + blockOriginPos.y,
                blockPosZ
            );

            Model.generatedStructureBlocksToLoad.set(
                blockWorldPos.getKey(),
                {pos: blockWorldPos, block: MinecraftBlockDictionary[blockData.minecraftName]}
            );
        });
    }
}

async function loadCSV(path: string): Promise<string> {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load CSV: ${response.statusText}`);
    return await response.text();
}