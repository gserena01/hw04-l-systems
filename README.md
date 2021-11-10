# L-systems Coral

## Serena Gandhi (gserena)
## Link: https://gserena01.github.io/hw04-l-systems/

# Sample Images:

Using Defaults:

![image](https://user-images.githubusercontent.com/70620606/141114197-943c1a9b-8b4b-4fd5-955d-5a7ab70e2690.png)

With Color and Decoration Size Change:

![image](https://user-images.githubusercontent.com/70620606/141115420-030dba2a-7b8e-4824-b2ab-2fa850b5f5ec.png)

With Iterations and Angle Change:

![image](https://user-images.githubusercontent.com/70620606/141115687-21989520-a6ba-420d-b907-5d93a2c7465a.png)

The Tool in Action:

https://user-images.githubusercontent.com/70620606/141118237-24d21cf8-ae9f-4f39-bc3b-92cce27468b0.mp4


# How It All Went Down:

This project started with my inspiration, the coral. From here, I generated samples of my L-System grammar in the 2D L-System Visualizer (linked below) and in Houdini. Once my grammar was finalized, I moved on to coding.

Admittedly, I had to start and re-start this project, but my final version used the following pipeline:

First, I rendered out a single branch using the instanced shader. This helped me familiarize myself with instanced rendering, as well as ensure that, if my L-System is working properly, something will show up in my viewport.

Then, I started working on my L-System. I created Turtle, Expansion Rule, and Drawing Rule classes, which were all used in conjunction in the L-System Class. The Turtle class recorded and altered the current position and orientation of the "turtle." The expansion rule classes expanded the grammar I described, using some randomness. The Drawing Rule class selected drawing rules based on the provided grammar, using some randomness. 

To start, I set my grammar to be two iterations of a simple "FF". This way, I could easily test whether my rules were working. Also, to start, I only included rotation in 2D.

Once my grammar was properly working, I added 3D rotation and expanded the grammar to the current version.

From here, I added the branch decoration and incorporated randomness in my grammar by adjusting each angle drawn by no more than 10 degrees in either direction (sampled on a curve, not uniformly, to ensure that larger angle changes are less common). I also added additional rules that could terminate the grammar with a branch decoration.

Next, I worked on the background, adding the various colors and animating them on a sine curve. I also added stripes to my tree shader for a little extra fun! The stripes are made using the current color's inverse, for a little extra POP!

Finally, I added the sand base and the gui elements to make my project a tool to make many corals!

# Samples of L-System Using Tools:

2D L-System Visualizer:

![image](https://user-images.githubusercontent.com/60444726/138163560-f8537878-23f3-4a77-aae0-31b7e6201581.png)

Houdini:

![Screenshot 2021-10-20 200324](https://user-images.githubusercontent.com/60444726/138274074-d694a82b-69f7-44e3-a6fc-c970d17ae49c.png)

# Reference Images:

![image](https://user-images.githubusercontent.com/60444726/140631834-e2863c3f-1e70-4da8-9daa-1c8201c916e9.png)

![image](https://user-images.githubusercontent.com/60444726/140631851-8845bd07-5ccd-40ed-b130-9c029304b2e5.png)

![image](https://user-images.githubusercontent.com/60444726/140631854-348ce9c7-f722-4cbc-8ce8-d105a5965d84.png)

# External Resources:

Using Callback Functions: https://stackoverflow.com/questions/14471975/how-can-i-preserve-lexical-scope-in-typescript-with-a-callback-function

L-System Visualizer: https://www.kevs3d.co.uk/dev/lsystems/

Color Palette: https://icolorpalette.com/color/ocean-blue
