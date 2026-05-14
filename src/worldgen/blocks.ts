import {Block} from "./block";
import {Color} from "three";
import {CuboidMeshMultiTexture, CuboidMeshOneColor, CuboidMeshOneTexture} from "../geometry/creation";

export const AIR = new Block("air", false, true,
    null);
export const GRASS = new Block("grass", true, false,
    new CuboidMeshMultiTexture(1, 1, 1, 1.0,
        "grass_textures/grass_top.png",
        "grass_textures/grass_bottom.png",
        "grass_textures/grass_side.png",
    ));
export const DIRT = new Block("dirt", true, false,
    new CuboidMeshOneTexture(1, 1, 1, 1.0, "one_texture/dirt.png"));
export const STONE = new Block("stone", true, false,
    new CuboidMeshOneTexture(1, 1, 1, 1.0, "one_texture/stone.png"));
export const GLASS = new Block("glass", true, true,
    new CuboidMeshOneTexture(1, 1, 1, 1.0, "one_texture/glass.png"));
export const COAL = new Block("coal", true, false,
    new CuboidMeshOneTexture(1, 1, 1, 1.0, "one_texture/coal.png"));
export const IRON = new Block("iron", true, false,
    new CuboidMeshOneTexture(1, 1, 1, 1.0, "one_texture/iron.png"));
export const CUCUMBER = new Block("cucumber", true, false,
    new CuboidMeshOneColor(1, 1, 1, 1, new Color(0.1, 0.5, 0.2), false));
export const SNOW = new Block("snow", true, false,
    new CuboidMeshOneColor(1, 1, 1, 1, new Color(1, 1, 1), false));