import {Block} from "./block";
import {Color} from "three";
import {CubeMeshGrassBlock, CubeMeshMultiTexture, CubeMeshOneColor, CubeMeshOneTexture, CubeMeshWaterBlock} from "../geometry/creation";

export const AIR = new Block("air", null, false);
export const GRASS = new Block("grass",
    new CubeMeshGrassBlock(false,
        "block_textures/grass/grass_top.png",
        "block_textures/grass/grass_bottom.png",
        "block_textures/grass/grass_side.png",
    ), true);
export const OAKLOG = new Block("log",
    new CubeMeshMultiTexture(false,
        "block_textures/log/log_top.png",
        "block_textures/log/log_top.png",
        "block_textures/log/log_side.png",
    ), true);
export const WATER = new Block("water",
    new CubeMeshWaterBlock(), false);

export const OAKLEAVES = new Block("oak_leaves", new CubeMeshOneTexture(true, "block_textures/leaves.png"), true);
export const DIRT = new Block("dirt", new CubeMeshOneTexture(false, "block_textures/dirt.png"), true);
export const STONE = new Block("stone", new CubeMeshOneTexture(false, "block_textures/stone.png"), true);
export const GLASS = new Block("glass", new CubeMeshOneTexture(true, "block_textures/glass.png"), true);
export const COAL = new Block("coal", new CubeMeshOneTexture(false, "block_textures/coal.png"), true);
export const IRON = new Block("iron", new CubeMeshOneTexture(false, "block_textures/iron.png"), true);
export const MUSHROOM_BLOCK = new Block("mushroom_block", new CubeMeshOneTexture(false, "block_textures/mushroom_block.png"), true);
export const MUSHROOM_STEM = new Block("mushroom_stem", new CubeMeshOneTexture(false, "block_textures/mushroom_stem.png"), true);
export const CUCUMBER = new Block("cucumber", new CubeMeshOneTexture(false, "block_textures/cucumber.png"), true);
export const SNOW = new Block("snow", new CubeMeshOneTexture(false, "block_textures/snow.png"), true);
export const RED = new Block("snow", new CubeMeshOneColor(1, new Color(1, 0, 0), false), true);
export const GREEN = new Block("snow", new CubeMeshOneColor(1, new Color(0, 1, 0), false), true);
export const GREY = new Block("snow", new CubeMeshOneColor(1, new Color(0.5, 0.5, 0.5), false), true);
export const BLACK = new Block("snow", new CubeMeshOneColor(1, new Color(0, 0, 0), false), true);
export const SAND = new Block("sand", new CubeMeshOneTexture(false, "block_textures/sand.png"), true);
export const PALM_TREE_LEAF = new Block("palm_tree_leaf", new CubeMeshOneTexture(true, "block_textures/leaves.png"), true);
export const PALM_TREE_LOG = new Block("palm_tree_log", new CubeMeshMultiTexture(false,
    "block_textures/log/log_top.png",
    "block_textures/log/log_top.png",
    "block_textures/log/log_side.png",
), true);
export const CACTUS = new Block("cactus", new CubeMeshOneColor(1, new Color(0, 1, 0), false), true);
interface BlockDictionary {
    [key: string]: Block;
}

export const MinecraftBlockDictionary: BlockDictionary = {
    "minecraft:oak_log": OAKLOG,
    "minecraft:oak_leaves": OAKLEAVES,
    "minecraft:grass_block": GRASS,
    "minecraft:dirt": DIRT,
    "minecraft:stone": STONE,
    "minecraft:glass": GLASS,
    "minecraft:coal_ore": COAL,
    "minecraft:iron_ore": IRON,
    "minecraft:red_mushroom_block": MUSHROOM_BLOCK,
    "minecraft:mushroom_stem": MUSHROOM_STEM,
    "minecraft:azalea_leaves": PALM_TREE_LEAF,
    "minecraft:jungle_log": PALM_TREE_LOG,
    "minecraft:green_wool": CACTUS,
    "67": CUCUMBER,
};