#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

vec3 rgb(vec3 color) {
  return vec3(color.x / 255.0, color.y / 255.0, color.z / 255.0);
}

void main() {
  float yVal = fs_Pos.y;
  float sinVal = sin(fs_Pos.x * 20.0 + u_Time / 75.0);
  float dist = .2;
  float start = .8;


  // backdrop just in case of leaks
  out_Col = vec4(rgb(vec3(242, 252, 255)), 1.0);
  if(yVal < .05 * sinVal - start) {
    out_Col = vec4(rgb(vec3(193, 242, 254)), 1.0);
  }
  if(yVal < .05 * sinVal + start) {
    out_Col = vec4(rgb(vec3(144, 233, 255)), 1.0);
  }
  if(yVal < .05 * sinVal + (start - dist)) {
    out_Col = vec4(rgb(vec3(95, 223, 255)), 1.0);
  }
  if(yVal < .05 * sinVal + (start - 2.0 * dist)) {
    out_Col = vec4(rgb(vec3(46, 213, 255)), 1.0);
  }
  if(yVal < .05 * sinVal + (start - 3.0 * dist)) {
    out_Col = vec4(rgb(vec3(0, 202, 252)), 1.0);
  }
  if(yVal < .05 * sinVal + (start - 4.0 * dist)) {
    out_Col = vec4(rgb(vec3(0, 163, 204)), 1.0);
  }
  if(yVal < .05 * sinVal + (start - 5.0 * dist)) {
    out_Col = vec4(rgb(vec3(0.0, 124.0, 155.0)), 1.0);
  }
  if(yVal < .05 * sinVal + (start - 6.0 * dist)) {
    out_Col = vec4(rgb(vec3(0.0, 84.0, 106.0)), 1.0);
  }
  if(yVal < .05 * sinVal + (start - 7.0 * dist)) {
    out_Col = vec4(rgb(vec3(0.0, 45.0, 57.0)), 1.0);
  }
  // muten by some factor
  out_Col = vec4(vec3(out_Col / 1.5), 1.0);
}
