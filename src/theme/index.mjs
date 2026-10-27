// index.mjs - the page modules, in render order (FOUNDATION). Each exports render(ctx) -> [{ path, html }].
// build.mjs exits 1 when a listed module is missing or exports no render().
export const MODULES = ['home', 'stores', 'content'];
