# raf-nexus

RafNexus allows you to centralize requestAnimationFrame calls in one async loop.

## Usage

1. Create a single instance of RafNexus in your application and use it for all rAF needs `const rafNexus = new RafNexus()`
2. create a callback to be executed at every frame `const onFrame = (time, deltaTime) => {/* do stuff */}`
3. pass the callback to the RafNexus instance `const unsubscribe = rafNexus.add(onFrame, 0)`
4. unsubscribe from the RafNexus instance to keep the loop small

Note: it uses web APIs, check if you're in a browser before creating an instance.
