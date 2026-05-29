#include <common>
#include <shadowmap_pars_vertex>


uniform float uTime;
//uniform vec3  uWindDir; 
uniform float uWindSpeed;
uniform float uWindStrength;

varying vec2 vUv;
varying float vHeight;


//
// Description : Array and textureless GLSL 2D simplex noise function.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
// 

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+10.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}


void main() {
    vUv = uv;
    vHeight = uv.y;

    vec4 instancePos = instanceMatrix * vec4(position, 1.0);

    float influence = vHeight * vHeight;

    float windAngle = uTime * uWindSpeed;
    float mainWave  = sin(windAngle + instancePos.x * 0.5 + instancePos.z * 0.5) * uWindStrength;
    //   float flutter   = sin(windAngle * 3.7 + pos.x * 10.0) * uWindStrength * 0.25;

    float noiseSampleX = snoise(vec2(uTime * 0.001 + instancePos.x * 0.1, uTime * 0.001 + 100. + instancePos.z * 0.1));
    float noiseSampleZ = snoise(vec2((uTime + 100.) * 0.001 + instancePos.x * 0.1, (uTime + 100.) * 0.001 + 100. + instancePos.z * 0.1));
    //float noiseSampleZ = snoise(vec2(uTime + 100. + instancePos.x, uTime + 200. + instancePos.z));
    vec3 windDir = vec3(noiseSampleX, 0., noiseSampleZ);
    windDir = normalize(windDir);

    //instancePos.x += windDir.x * (mainWave) * influence;
    //instancePos.z += windDir.z * (mainWave) * influence;
    //instancePos.y -= abs(mainWave) * influence * 0.15;


    vec3 transformedNormal = (modelMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz;
    //vec4 worldPosition = modelMatrix * vec4(pos, 1.0);

    //#include <shadowmap_vertex>

    gl_Position = projectionMatrix * modelViewMatrix * instancePos;
}