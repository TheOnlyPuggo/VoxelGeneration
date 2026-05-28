// Fragment Shader
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

varying vec2 vUv;
varying float vHeight;

void main() {
  vec3 rootColor = vec3(120./255., 174./255., 93./255.);
  vec3 tipColor  = vec3(0.4, 0.7, 0.1);
  vec3 color = mix(rootColor, tipColor, vHeight);

  color *= 0.5 + 0.5 * vHeight;

    float shadow = getShadowMask();
    color *= mix(0.4, 1.0, shadow);


/*
  float alpha = 1.0 - abs(vUv.x - 0.5) * 2.0;
  alpha = pow(alpha, 0.5);
  //if (alpha < 0.1) discard;
  */

  gl_FragColor = vec4(color, 1.);
}