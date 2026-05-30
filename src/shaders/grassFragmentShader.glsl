// Fragment Shader
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
#include <fog_pars_fragment>

varying vec2 vUv;
varying float vHeight;
varying vec3 vPosition;
varying vec3 vNormal;


vec2 grad(vec2 p) {
    float n = dot(p, vec2(127.1, 311.7));
    n = fract(sin(n) * 43758.5453);
    float a = n * 6.28318530718; // 2π
    return vec2(cos(a), sin(a));
}


float fade(float t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}


float perlin(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = vec2(fade(f.x), fade(f.y));

    float a = dot(grad(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
    float b = dot(grad(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
    float c = dot(grad(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
    float d = dot(grad(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}


void main() {

  //rgba(81, 161, 53)
  vec3 rootColor = vec3(81./255., 161./255., 53./255.);

  vec3 tipColor1  = vec3(0.4, 0.7, 0.1);
  vec3 tipColor2  = vec3(0.7, 0.6, 0.1);
  //vec3 tipColor2  = vec3(1., 0., 0.1);


  float tipColorSampleScale = 0.08;
  float tipColorSample = perlin(vec2(vPosition.x*tipColorSampleScale, vPosition.z*tipColorSampleScale));
  tipColorSample = tipColorSample / 2. + 0.5;
  vec3 tipColor = mix(tipColor1, tipColor2, tipColorSample);

  vec3 color = mix(rootColor, tipColor, vHeight);

  color *= 0.5 + 0.5 * vHeight;



  // ---- Lighting ----

  // Ambient
  vec3 lightContribution = ambientLightColor;  // from lights_pars_begin

  // Directional lights
  #if NUM_DIR_LIGHTS > 0
    for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
      vec3 lightDir = normalize(directionalLights[i].direction);
      float NdotL = max(dot(vNormal, lightDir), 0.0);

      // Grass is two-sided — soften the dark side
      NdotL = NdotL * 0.5 + 0.5;  // remap 0..1 → 0.5..1 (half-lambert)

      lightContribution += directionalLights[i].color * NdotL;
    }
  #endif

  

  color *= lightContribution;


  // --- SHADOW
  float shadow = getShadowMask();
  color *= mix(0.6, 1.0, shadow);


/*
  float alpha = 1.0 - abs(vUv.x - 0.5) * 2.0;
  alpha = pow(alpha, 0.5);
  //if (alpha < 0.1) discard;
  */

  gl_FragColor = vec4(color, 1.);

  #include <fog_fragment>

}