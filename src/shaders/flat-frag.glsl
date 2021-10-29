#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

const int MAX_RAY_STEPS = 128;
const float FOV = 45.0;
const float EPSILON = 1e-6;

const vec3 WORLD_UP = vec3(0.0, 1.0, 0.0);
const vec3 WORLD_RIGHT = vec3(-1.0, 0.0, 0.0);
const vec3 WORLD_FORWARD = vec3(0.0, 0.0, 1.0);
const float HALF_PI = 1.570796327;
const float MAX_RAY_LENGTH = 12.0;

// COLORS
const vec3 MUG_COLOR = vec3(140.0, 150.0, 170.0) / 255.0 * 0.8;
const vec3 SCISSORS_COLOR = vec3(196.0, 202.0, 206.0) / 255.0;
const vec3 FLOOR_COLOR = vec3(91.0, 96.0, 101.0) / 255.0 * 0.5;
const vec3 GOLD_COLOR = vec3(215.0, 190.0, 105.0) / 255.0;
const vec3 backgroundColor = vec3(0.2, 0.4, 0.9);

// LIGHTS
const vec3 LIGHT_POS = vec3(-1.0, 3.0, 2.0);
const vec3 LIGHT_COLOR = vec3(1.0, .88, .7);


// structs
struct Ray 
{
    vec3 origin;
    vec3 direction;
};

struct Intersection 
{
    vec3 position;
    vec3 normal;
    float distance_t;
    int material_id;
};

// TOOLBOX FUNCTIONS -------------------------------------------------------
float GetBias(float t, float bias)
{
  return (t / ((((1.0/bias) - 2.0)*(1.0 - t))+1.0));
}


float GetGain(float t, float gain)
{
  if(t < 0.5)
    return GetBias(t * 2.0,gain)/2.0;
  else
    return GetBias(t * 2.0 - 1.0,1.0 - gain)/2.0 + 0.5;
}

// SDF functions ----------------------------------------------------------

float sdfPlane( vec3 p, vec3 n, float h )
{
  // n must be normalized
  return dot(p,n) + h;
  // return queryPos.y - h;
}

float sdfSphere(vec3 query_position, vec3 position, float radius)
{
    return length(query_position - position) - radius;
}

float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdRoundedCylinder( vec3 p, float ra, float rb, float h )
{
  vec2 d = vec2( length(p.xz)-2.0*ra+rb, abs(p.y) - h );
  return min(max(d.x,d.y),0.0) + length(max(d,0.0)) - rb;
}

float sdCappedCone( vec3 p, float h, float r1, float r2 )
{
  vec2 q = vec2( length(p.xz), p.y );
  vec2 k1 = vec2(r2,h);
  vec2 k2 = vec2(r2-r1,2.0*h);
  vec2 ca = vec2(q.x-min(q.x,(q.y<0.0)?r1:r2), abs(q.y)-h);
  vec2 cb = q - k1 + k2*clamp( dot(k1-q,k2)/dot(k2, k2), 0.0, 1.0 );
  float s = (cb.x<0.0 && ca.y<0.0) ? -1.0 : 1.0;
  return s*sqrt( min(dot(ca, ca),dot(cb, cb)) );
}

float sdHexPrism( vec3 p, vec2 h )
{
  const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
  p = abs(p);
  p.xy -= 2.0*min(dot(k.xy, p.xy), 0.0)*k.xy;
  vec2 d = vec2(
       length(p.xy-vec2(clamp(p.x,-k.z*h.x,k.z*h.x), h.x))*sign(p.y-h.x),
       p.z-h.y );
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}


// SDF Modifiers-------------------------------------------------------------
float opRound(float sdf, float rad )
{
    return sdf - rad;
}

float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float opSmoothSubtraction( float d1, float d2, float k ) {
    float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1.0 );
    return mix( d2, -d1, h ) + k*h*(1.0-h); 
}

vec3 opElongate(in vec3 p, in vec3 h )
{
    vec3 q = p - clamp( p, -h, h );
    return q;
}

float sphereRep( vec3 p, vec3 c )
{
    vec3 q = mod(p+0.5*c,c)-0.5*c;
    return sdfSphere( q, vec3(0.0), 1.0 );
}

// from https://github.com/dmnsgn/glsl-rotate/blob/master/rotation-3d-x.glsl
mat3 rotation3dX(float angle) {
	float s = sin(angle);
	float c = cos(angle);

	return mat3(
		1.0, 0.0, 0.0,
		0.0, c, s,
		0.0, -s, c
	);
}

// from https://github.com/dmnsgn/glsl-rotate/blob/master/rotation-3d-y.glsl
mat3 rotation3dY(float angle) {
	float s = sin(angle);
	float c = cos(angle);

	return mat3(
		c, 0.0, -s,
		0.0, 1.0, 0.0,
		s, 0.0, c
	);
}

// from https://github.com/dmnsgn/glsl-rotate/blob/master/rotation-3d-z.glsl
mat3 rotation3dZ(float angle) {
	float s = sin(angle);
	float c = cos(angle);

	return mat3(
		c, s, 0.0,
		-s, c, 0.0,
		0.0, 0.0, 1.0
	);
}

// Scene Building-------------------------------------------------------------------------

// Build for a Bubble
float sceneSDFBubble(vec3 queryPos) {
    float t = sdfSphere(queryPos, vec3(0.0), 10.0);
    
    return t;
}

vec3 animateHorizontal(vec3 p) {
     return p + vec3(8.0, 0.0, 0.0) * (GetBias(sin(u_Time * .025) + 1.0, 0.7) - 0.5);
}

vec3 animateYRotation(vec3 p) {
    return transpose(rotation3dY(GetGain((.5 * sin(u_Time * .025) + 0.5), 0.7) * 6.0)) * p;
}

float sceneSDF(vec3 queryPos, out int hitObj) 
{   
    
    // Bounding sphere, so we only have to check for geometry within certain bounds
    float bounding_box_dist = sdBox(queryPos, vec3(12.0));
   // if(bounding_box_dist <= .00001) {

    // Bubbles
    float t = sceneSDFBubble(animateHorizontal((queryPos)));
    hitObj = 1;   

    float t2 = sceneSDFBubble(queryPos);
    if (t2 < t) {
        t = t2;
        hitObj = 0;
    }
    
    return t;
 //   }
    hitObj = -2;
    return bounding_box_dist;
}

vec3 estimateNormal(vec3 p, out int hitObj) {
    vec2 d = vec2(0.0, EPSILON);
    float x = sceneSDF(p + d.yxx, hitObj) - sceneSDF(p - d.yxx, hitObj);
    float y = sceneSDF(p + d.xyx, hitObj) - sceneSDF(p - d.xyx, hitObj);
    float z = sceneSDF(p + d.xxy, hitObj) - sceneSDF(p - d.xxy, hitObj);
    return normalize(abs(vec3(x, y, z)));
}

Ray getRay(vec2 uv)
{
    Ray r;
    float aspect_ratio = u_Dimensions.x / u_Dimensions.y;
    float len = length(u_Ref - u_Eye);

    vec3 look = normalize(u_Ref - u_Eye);
    vec3 camera_RIGHT = normalize(cross(look, u_Up));
    
    vec3 screen_vertical = u_Up * len * tan(FOV / 2.0); 
    vec3 screen_horizontal = camera_RIGHT * len * aspect_ratio * tan(FOV / 2.0);
    vec3 screen_point = (u_Ref + uv.x * screen_horizontal + uv.y * screen_vertical);
    
    r.origin = u_Eye;
    r.direction = normalize(screen_point - u_Eye);
   
    return r;
}

bool isRayTooLong(vec3 queryPoint, vec3 origin)
{
    return length(queryPoint - origin) > MAX_RAY_LENGTH;
}

Intersection getRaymarchedIntersection(vec2 uv, out int hitObj)
{
    Intersection intersection;    
    intersection.distance_t = -1.0;

    Ray r = getRay(uv);
    float distancet = 0.0;

    for (int step; step < MAX_RAY_STEPS; step++) {
        vec3 qPoint = r.origin + r.direction * distancet;
        if(isRayTooLong(qPoint, r.origin)) {
           break; 
        } 
        float currentDistance = sceneSDF(qPoint, hitObj);
        if (currentDistance < EPSILON) { 
            // something was hit by our ray!
            intersection.distance_t = distancet;
            intersection.normal = estimateNormal(qPoint, hitObj);
            intersection.position = r.origin + distancet * r.direction;
            return intersection;
        }
        distancet += currentDistance;
        
    }

    return intersection;
}

// SHADING ------------------------------------------------------------------------------------------------------------

float shadeLambert(vec3 norm, vec3 lightVec) {
    // Calculate the diffuse term for Lambert shading
    float diffuseTerm = dot(normalize(norm), normalize(lightVec));

    // Avoid negative lighting values
    diffuseTerm = clamp(diffuseTerm, 0.f, 1.f);

    // add ambient lighting
    float ambientTerm = 0.2;
    float lightIntensity = diffuseTerm + ambientTerm;   

    return lightIntensity;
}

vec3 computeMaterial(int hitObj, vec3 p, vec3 n) {
    float t;
    
    vec3 albedo;
    switch(hitObj) {
        case 0: // Mug
        albedo = MUG_COLOR;
        break;
        case 1: // Scissors
        albedo = SCISSORS_COLOR;
        break;
        case 2: // Floor
        albedo = FLOOR_COLOR;
        break; // Background
        case 3: // Mug Lip
        albedo = GOLD_COLOR;
        break;
        case -1:
        return backgroundColor;
        break;
        case -2: 
        return backgroundColor;
        break;
    }

    vec3 color = vec3(0.0);

    color = albedo;

    return color;
}

vec3 getSceneColor(vec2 uv)
{
    int hitObj = -1;
    Intersection intersection = getRaymarchedIntersection(uv, hitObj);
    if (intersection.distance_t > 0.0)
    { 
        // shade everything with lambert
        float lightIntensity = shadeLambert(intersection.normal, LIGHT_POS - intersection.position);
        return lightIntensity * computeMaterial(hitObj, intersection.position, intersection.normal);
    }
    return backgroundColor;
}

// MAIN --------------------------------------------------------------------------------------------------------------

void main() {
    // Using Raymarching:
    vec3 col = getSceneColor(fs_Pos);
    // Output to screen
     out_Col = vec4(col,1.0);

}