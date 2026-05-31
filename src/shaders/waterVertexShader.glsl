#include <fog_pars_vertex>

uniform float uTime;
uniform float uGScale;
uniform float uGSpeed;
uniform bool uDisplace;
uniform float uDisplacementAmp;

varying vec2 vUv;
varying vec3 vWorldPos;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float simplex(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                 + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                           dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x  = 2.0 * fract(p * C.www) - 1.0;
  vec3 h  = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x   + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++, p *= 2.0, a *= 0.5)
    v += a * simplex(p);
  return v;
}




void main() {
  /*
  vec4 instancePos = instanceMatrix * vec4(position, 1.0);
  vInstancePos = instancePos.xyz;
  vUv = uv;

  vec3 pos = position;

  if (uDisplace) {
      instancePos.y += fbm(instancePos.xz * 0.05 + vec2(uTime * 0.1 * uGSpeed)) * 1.5 * uDisplacementAmp;
      instancePos.y += fbm(instancePos.xz * 0.5 + vec2(-uTime * 0.1 * uGSpeed, 0.)) * 0.3 * uDisplacementAmp;
  }

  vec4 mvPosition = modelViewMatrix * vec4(instancePos.xyz + vec3(0., -0.2, 0.), 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vFogDepth = -mvPosition.z;
  */

  vec4 instancePos = instanceMatrix * vec4(position, 1.0);
  vUv = uv;

  if (uDisplace) {
      instancePos.y += fbm(instancePos.xz * 0.05 + vec2(uTime * 0.1 * uGSpeed)) * 1.5 * uDisplacementAmp;
      instancePos.y += fbm(instancePos.xz * 0.5  + vec2(-uTime * 0.1 * uGSpeed, 0.)) * 0.3 * uDisplacementAmp;
  }

  vec3 worldPos = instancePos.xyz + vec3(0., -0.2, 0.);
  vWorldPos = worldPos;

  vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vFogDepth = -mvPosition.z;
}