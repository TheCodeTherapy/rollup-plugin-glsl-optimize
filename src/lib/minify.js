/*
  Originally from https://github.com/vwochnik/rollup-plugin-glsl
  MIT License
  Copyright (c) Vincent Wochnik <v.wochnik@gmail.com>
*/

/** @internal */
export function compressShader(code) {
  let needNewline = false;
  return code
    .replace(
      /\\(?:\r\n|\n\r|\n|\r)|\/\*.*?\*\/|\/\/(?:\\(?:\r\n|\n\r|\n|\r)|[^\n\r])*/g,
      ""
    )
    .split(/\n+/)
    .reduce((result, line) => {
      line = line.trim().replace(/\s{2,}|\t/, " ");
      if (line.charAt(0) === "#") {
        if (needNewline) {
          result.push("\n");
        }
        result.push(line, "\n");
        needNewline = false;
      } else {
        result.push(
          line.replace(
            /\s*({|}|=|\*|,|\+|\/|>|<|&|\||\[|\]|\(|\)|-|!|;)\s*/g,
            "$1"
          )
        );
        needNewline = true;
      }
      return result;
    }, [])
    .join("")
    .replace(/\n+/g, "\n");
}
