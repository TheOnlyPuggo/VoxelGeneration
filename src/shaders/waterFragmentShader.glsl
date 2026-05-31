#include <fog_pars_fragment>

uniform float uTime;
uniform vec3 uWaterCol;
uniform vec3 uCausticCol;
uniform float uGScale;
uniform float uGSpeed;
uniform bool uIsTransparent;
uniform float uFBMIntensity;
uniform float uFBMScale;

// lighting
uniform vec3  uLightDir;
uniform vec3  uLightColor;
uniform vec3  uCameraPos;
uniform float uShininess;
uniform float uSpecularStr;

varying vec2 vUv;
varying vec3 vWorldPos;

const mat2 myt = mat2(.12121212, .13131313, -.13131313, .12121212);
const vec2 mys = vec2(1e4, 1e6);


vec2 rhash(vec2 uv) {
  uv *= myt;
  uv *= mys;
  return fract(fract(uv / mys) * uv);
}

vec3 hash(vec3 p) {
  return fract(
      sin(vec3(dot(p, vec3(1.0, 57.0, 113.0)), dot(p, vec3(57.0, 113.0, 1.0)),
               dot(p, vec3(113.0, 1.0, 57.0)))) *
      43758.5453);
}

vec3 voronoi3d(const in vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);

  float id = 0.0;
  vec2 res = vec2(100.0);
  for (int k = -1; k <= 1; k++) {
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec3 b = vec3(float(i), float(j), float(k));
        vec3 r = vec3(b) - f + hash(p + b);
        float d = dot(r, r);

        float cond = max(sign(res.x - d), 0.0);
        float nCond = 1.0 - cond;

        float cond2 = nCond * max(sign(res.y - d), 0.0);
        float nCond2 = 1.0 - cond2;

        id = (dot(p + b, vec3(1.0, 57.0, 113.0)) * cond) + (id * nCond);
        res = vec2(d, res.x) * cond + res * nCond;

        res.y = cond2 * d + nCond2 * res.y;
      }
    }
  }

  return vec3(sqrt(res), abs(id));
}

#pragma glslify: export(voronoi3d)


vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)),
           dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f); // smoothstep

  return mix(
    mix(dot(hash(i + vec2(0,0)), f - vec2(0,0)),
        dot(hash(i + vec2(1,0)), f - vec2(1,0)), u.x),
    mix(dot(hash(i + vec2(0,1)), f - vec2(0,1)),
        dot(hash(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y);
}

float fbm(vec2 p) {
  float value     = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 3; i++) {
    value     += amplitude * noise(p * frequency);
    frequency *= 2.0; 
    amplitude *= 0.5;
  }
  return value;
}

float sampleCaustic(vec2 worldXZ, float time) {
    float zSpeed    = 0.3;
    float warpSpeed = 0.05;

    vec2 sampleCoords = worldXZ * uGScale;

    float warpX = fbm(worldXZ * uGScale * uFBMScale + vec2(0.,  0. ) + time * warpSpeed);
    float warpY = fbm(worldXZ * uGScale * uFBMScale + vec2(5.2, 1.3) + time * warpSpeed);

    vec2 warpedCoords = sampleCoords + vec2(warpX, warpY) * uFBMIntensity;

    float v = voronoi3d(vec3(warpedCoords, time * zSpeed * uGSpeed)).x;
    v = pow(v, 3.);
    return clamp(v, 0., 0.8);
}

vec3 calcWaterNormal(vec2 worldXZ, float time) {
    float eps      = 0.3;
    float warpSpeed = 0.05;
    vec2  p        = worldXZ * uGScale * uFBMScale;

    float l = fbm(p + vec2(-eps, 0.) + time * warpSpeed);
    float r = fbm(p + vec2( eps, 0.) + time * warpSpeed);
    float d = fbm(p + vec2(0., -eps) + time * warpSpeed);
    float u = fbm(p + vec2(0.,  eps) + time * warpSpeed);

    float strength = 1.2;
    return normalize(vec3(
        (l - r) / (2.0 * eps) * strength,
        1.0,
        (d - u) / (2.0 * eps) * strength
    ));
}


void main() {
    float vSample   = sampleCaustic(vWorldPos.xz, uTime);
    vec3 causticCol = mix(uWaterCol, uCausticCol, vSample);

    vec3 N = calcWaterNormal(vWorldPos.xz, uTime);
    vec3 L = normalize(uLightDir);
    vec3 V = normalize(uCameraPos - vWorldPos);
    vec3 H = normalize(L + V);

    float NdotH = max(dot(N, H), 0.0);

    float specBroad = pow(NdotH, 12.0) * 0.3;
    float specSharp = pow(NdotH, uShininess) * vSample * uSpecularStr;
    vec3  specular  = uLightColor * (specBroad + specSharp);

    vec3 litColor = causticCol * 0.7 + specular;

    if (uIsTransparent) {
        float alpha = dot(causticCol, vec3(0.333)) * 1.2;
        gl_FragColor = vec4(litColor, alpha);
    } else {
        gl_FragColor = vec4(litColor * 2., 1.);
    }

    #include <fog_fragment>
}