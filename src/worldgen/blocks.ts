import * as THREE from "three";
import {Block} from "./block";

export const AIR = new Block("air", 0, new THREE.Color(1, 1, 1));
export const GRASS = new Block("grass", 1, new THREE.Color(0, 1, 0));
export const DIRT = new Block("dirt", 1, new THREE.Color(0.5, 0.3, 0));
export const STONE = new Block("stone", 1, new THREE.Color(0.5, 0.5, 0.5));
export const GLASS = new Block("glass", 0.5, new THREE.Color(0.3, 0.5, 0.8));
export const COAL = new Block("coal", 1, new THREE.Color(0.1, 0.1, 0.1));
export const IRON = new Block("iron", 1, new THREE.Color(0.8, 0.6, 0.4));
export const CUCUMBER = new Block("cucumber", 1, new THREE.Color(0.1, 0.5, 0.2));