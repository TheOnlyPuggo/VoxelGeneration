import {Block} from "./block";
import {Color} from "three";
import {CubeMeshMultiTexture, CubeMeshOneColor, CubeMeshOneTexture} from "../geometry/creation";

export const AIR = new Block("air", null);
export const GRASS = new Block("grass",
    new CubeMeshMultiTexture(false,
        "block_textures/grass_textures/grass_top.png",
        "block_textures/grass_textures/grass_bottom.png",
        "block_textures/grass_textures/grass_side.png",
    ));
export const OAKLOG = new Block("oak_log",
    new CubeMeshMultiTexture(false,
        "block_textures/oak_tree_textures/oak_log_top_bottom.png",
        "block_textures/oak_tree_textures/oak_log_top_bottom.png",
        "block_textures/oak_tree_textures/oak_log_middle.png",
    ));
export const OAKLEAVES = new Block("oak_leaves", new CubeMeshOneTexture(true, "block_textures/oak_tree_textures/oak_leaves.png"));
export const DIRT = new Block("dirt", new CubeMeshOneTexture(false, "block_textures/one_texture/dirt.png"));
export const STONE = new Block("stone", new CubeMeshOneTexture(false, "block_textures/one_texture/stone.png"));
export const GLASS = new Block("glass", new CubeMeshOneTexture(true, "block_textures/one_texture/glass.png"));
export const COAL = new Block("coal", new CubeMeshOneTexture(false, "block_textures/one_texture/coal.png"));
export const IRON = new Block("iron", new CubeMeshOneTexture(false, "block_textures/one_texture/iron.png"));
export const MUSHROOM_BLOCK = new Block("mushroom_block", new CubeMeshOneTexture(false, "block_textures/mushroom_textures/mushroom_block.png"));
export const MUSHROOM_STEM = new Block("mushroom_stem", new CubeMeshOneTexture(false, "block_textures/mushroom_textures/mushroom_stem.png"));
export const CUCUMBER = new Block("cucumber", new CubeMeshOneColor(1, new Color(0.1, 0.5, 0.2), false));

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
    "67": CUCUMBER,
};