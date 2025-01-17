# rollup-plugin-glsl-optimize

[![NPM Package][npm]][npm-url]
[![Changelog][changelog]][changelog-url]
[![Node Version][node-version]](#)
[![Types][types]](#)
[![Maintainability][cc-maintainability]][cc-maintainability-url]\
[![Dependencies][dependencies]][dependencies-url]
[![Dev Dependencies][dev-dependencies]][dev-dependencies-url]
[![Coverage Status][coverage]][coverage-url]
[![Node.js CI][ci]][ci-url]

Import GLSL source files as strings. Pre-processed, validated and optimized with [Khronos Group SPIRV-Tools](https://github.com/KhronosGroup/SPIRV-Tools).

Primary use-case is processing WebGL2 / GLSL ES 300 shaders.

```js
import frag from "./shaders/myShader.frag";
console.log(frag);
```

## Features

### GLSL Optimizer

_For WebGL2 / GLSL ES >= 300_

With `optimize: true` (default) shaders will be compiled to SPIR-V (opengl semantics) and optimized for performance using the [Khronos SPIR-V Tools Optimizer](https://github.com/KhronosGroup/SPIRV-Tools) before being cross-compiled back to GLSL.

### Shader Preprocessor

Shaders are preprocessed and validated using the [Khronos Glslang Validator](https://github.com/KhronosGroup/glslang).

Macros are run at build time with support for C-style `#include` directives: \*

```glsl
#version 300 es
#include "postProcessingShared.glsl"
#include "dofCircle.glsl"

void main() {
  outColor = CircleDof(UVAndScreenPos, Color, ColorCoc);
}
```

_\* Via the `GL_GOOGLE_include_directive` extension. But an `#extension` directive is not required nor recommended in your final inlined code._

### Supports glslify

Specify `glslify: true` to process shader sources with [glslify](https://github.com/glslify/glslify) (a node.js-style module system for GLSL).

_And install glslify in your devDependencies with `npm i -D glslify`_

## Installation

```sh
npm i rollup-plugin-glsl-optimize -D
```

### Khronos tools

This plugin uses the [Khronos Glslang Validator](https://github.com/KhronosGroup/glslang), [Khronos SPIRV-Tools Optimizer](https://github.com/KhronosGroup/SPIRV-Tools) and [Khronos SPIRV Cross compiler](https://github.com/KhronosGroup/SPIRV-Cross).

Binaries are automatically installed for:

- Windows 64bit (MSVC 2017)
- MacOS x86_64 (clang)
- Ubuntu Trusty / Debian Buster amd64 (clang)

_Paths can be manually provided / overridden with the `GLSLANG_VALIDATOR`, `GLSLANG_OPTIMIZER`, `GLSLANG_CROSS` environment variables._

## Usage

```js
// rollup.config.mjs
import { default as glslOptimize } from "rollup-plugin-glsl-optimize";

export default {
  // ...
  plugins: [glslOptimize()],
};
```

## Shader stages

The following shader stages are supported by the Khronos tools and recognized by file extension:

| Shader Stage   | File Extensions                    |
| -------------- | ---------------------------------- |
| Vertex         | `.vs, .vert, .vs.glsl, .vert.glsl` |
| Fragment       | `.fs, .frag, .fs.glsl, .frag.glsl` |
| Geometry\*     | `.geom, .geom.glsl`                |
| Compute\*      | `.comp, .comp.glsl`                |
| Tess Control\* | `.tesc, .tesc.glsl`                |
| Tess Eval\*    | `.tese, .tese.glsl`                |

_\* Unsupported in WebGL2_

## Options

- `include` : `PathFilter` (default table above) File extensions within rollup to include. Though this option can be reconfigured, shader stage detection still operates based on the table above.
- `exclude` : `PathFilter` (default `undefined`) File extensions within rollup to exclude.
- `includePaths` : `string[]` (default undefined) Additional search paths for `#include` directive (source file directory is always searched)

### Features

- `optimize` : `boolean` (default true) Optimize via SPIR-V as described in the Optimization section [requires WebGL2 / GLSL ES >= 300]. When disabled simply runs the preprocessor [all supported GLSL versions].
- `compress` : `boolean` (default true) Strip all whitespace in the sources

### Debugging

- `sourceMap` : `boolean` (default true) Emit source maps. These contain the final preprocessed/optimized GLSL source (but not stripped of whitespace) to aid debugging.
- `emitLineDirectives` : `boolean` (default false) Emit `#line NN "original.file"` directives for debugging - useful with `#include`. Note this requires the `GL_GOOGLE_cpp_style_line_directive` extension so the shader will fail to run in drivers that lack support.

### Preprocessor

- `optimizerPreserveUnusedBindings` : `boolean` (default true) Ensure that the optimizer preserves all declared bindings, even when those bindings are unused.
- `preamble` : `string` (default undefined) Prepended to the shader source (after the #version directive, before the preprocessor runs)

### glslify

- `glslify` : `boolean` (default false) Process sources using glslify prior to all preprocessing, validation and optimization.
- `glslifyOptions` (default undefined) When `glslify` enabled, pass these [additional options](https://github.com/glslify/glslify#var-src--glslcompilesrc-opts) to `glslify.compile()`.

### Advanced Options

- `optimizerDebugSkipOptimizer` : `boolean` (default false) When `optimize` enabled, skip the SPIR-V optimizer - compiles to SPIR-V then cross-compiles back to GLSL immediately.
- `suppressLineExtensionDirective` : `boolean` (default false) When `emitLineDirectives` enabled, suppress the `GL_GOOGLE_cpp_style_line_directive` directive.
- `extraValidatorParams`, `extraOptimizerParams`, `extraCrossParams` : `string[]` (default undefined) Additional parameters for the Khronos Glslang Validator [here](doc/glslangValidator.md), the Khronos SPIR-V Optimizer [here](doc/spirv-opt.md), and the Khronos SPIR-V Cross compiler [here](doc/spirv-cross.md).
- `glslangValidatorPath`, `glslangOptimizerPath`, `glslangCrossPath` : `string` (default undefined) Provide / override binary tool paths.\
  _It's recommended to instead use the environment variables `GLSLANG_VALIDATOR`, `GLSLANG_OPTIMIZER`, `GLSLANG_CROSS` where needed. They always take precedence if set._

## Changelog

Available in [CHANGES.md](CHANGES.md).

#### Caveats & Known Issues

- This plugin handles glsl and glslify by itself. Use with conflicting plugins (e.g. rollup-plugin-glsl, rollup-plugin-glslify) will cause unpredictable results.
- Optimizer: `lowp` precision qualifier - emitted as `mediump`\
  _SPIR-V has a single `RelaxedPrecision` decoration for 16-32bit precision. However most implementations actually treat `mediump` and `lowp` equivalently, hence the lack of need for it in SPIR-V._

## License

Released under the [MIT license](LICENSE).\
_Strip whitespace function adapted from code by Vincent Wochnik ([rollup-plugin-glsl](https://github.com/vwochnik/rollup-plugin-glsl))._

Khronos tool binaries (built by the upstream projects) are distributed and installed with this plugin under the terms of the Apache License Version 2.0. See the corresponding LICENSE files installed in the `bin` folder and the [binary releases](https://github.com/docd27/rollup-plugin-glsl-optimize/releases/).

[ci]: https://github.com/docd27/rollup-plugin-glsl-optimize/actions/workflows/node-ci.yml/badge.svg
[ci-url]: https://github.com/docd27/rollup-plugin-glsl-optimize/actions/workflows/node-ci.yml
[npm]: https://badgen.net/npm/v/rollup-plugin-glsl-optimize
[npm-url]: https://www.npmjs.com/package/rollup-plugin-glsl-optimize
[node-version]: https://badgen.net/npm/node/rollup-plugin-glsl-optimize
[types]: https://badgen.net/npm/types/rollup-plugin-glsl-optimize
[changelog]: https://badgen.net/badge/changelog/SemVer/blue
[changelog-url]: https://github.com/docd27/rollup-plugin-glsl-optimize/blob/master/CHANGES.md
[dependencies]: https://status.david-dm.org/gh/docd27/rollup-plugin-glsl-optimize.svg
[dependencies-url]: https://david-dm.org/docd27/rollup-plugin-glsl-optimize
[dev-dependencies]: https://status.david-dm.org/gh/docd27/rollup-plugin-glsl-optimize.svg?type=dev
[dev-dependencies-url]: https://david-dm.org/docd27/rollup-plugin-glsl-optimize?type=dev
[cc-maintainability]: https://badgen.net/codeclimate/maintainability/docd27/rollup-plugin-glsl-optimize
[cc-maintainability-url]: https://codeclimate.com/github/docd27/rollup-plugin-glsl-optimize/maintainability
[coverage]: https://codecov.io/gh/docd27/rollup-plugin-glsl-optimize/branch/master/graph/badge.svg
[coverage-url]: https://codecov.io/gh/docd27/rollup-plugin-glsl-optimize
