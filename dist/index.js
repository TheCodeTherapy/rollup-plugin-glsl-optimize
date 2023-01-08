/* eslint-disable */
// @ts-nocheck

/*
* DO NOT EDIT: Auto-generated bundle from sources in ./src
* For easier debugging you can include ./src/index.js directly instead
*/


import { createFilter } from '@rollup/pluginutils';
import { platform, arch, EOL } from 'os';
import * as path from 'path';
import * as fsSync from 'fs';
import { spawn } from 'child_process';
import { TextDecoder } from 'util';
import { once } from 'events';
import envPaths from 'env-paths';
import { settings } from '../settings.js';
import 'url';
import 'https-proxy-agent';
import TFileCache from '@derhuerst/http-basic/lib/FileCache.js';
import '@derhuerst/http-basic';
import 'progress';
import 'adm-zip';
import * as crypto from 'crypto';
import MagicString from 'magic-string';

function* simpleParse(input) {
  yield* parser(lexer(input));
}
const _T = (n) =>  (n);
const TOK = Object.freeze({
  EOL: _T(1),
  EOF: _T(2),
  Line: _T(3),
  Comment: _T(4),
  Version: _T(5),
  Extension: _T(6),
  LineNo: _T(7),
  Directive: _T(8),
});
function* lexer(input) {
  let skipOne = false;
  let line = 1,
    col = 0;
  let afterLineContinuation = false,
    inCommentSingleLine = false,
    inCommentMultiLine = false;
  let curToken = undefined;
  let curText = undefined;
  const setTokenIf = (type) => {
    if (!curToken) {
      setToken(type);
    }
  };
  const setToken = (type) => {
    curToken = { type, col, line, value: "", text: "" };
  };
  const emitToken = function* () {
    if (curToken.type === TOK.Line) {
      yield curToken;
    } else {
      yield curToken;
    }
    curToken = undefined;
  };
  const emitTokenIf = function* () {
    if (curToken) {
      yield* emitToken();
    }
  };
  const appendTokenValue = () => {
    curToken.text += curText;
    curToken.value += curText;
  };
  const appendToken = () => {
    curToken.text += curText;
  };
  const handleEOL = function* () {
    if (afterLineContinuation) {
      appendToken();
      afterLineContinuation = false;
    } else if (inCommentMultiLine) {
      appendToken();
      curToken.value += "\n";
    } else {
      yield* emitTokenIf();
      inCommentSingleLine = false;
      yield { type: TOK.EOL, text: curText, col, line, value: "\n" };
    }
    line++;
    col = 0;
  };
  if (input.length > 0) {
    let next = input[0];
    let cur;
    for (let i = 1; i <= input.length; i++) {
      cur = next;
      next = i < input.length ? input[i] : undefined;
      col++;
      if (skipOne) {
        skipOne = false;
        continue;
      }
      curText = cur;
      switch (cur) {
        case "\\":
          switch (next) {
            case "\r":
            case "\n":
              setTokenIf(TOK.Line);
              appendToken();
              afterLineContinuation = true;
              break;
            default:
              setTokenIf(TOK.Line);
              appendTokenValue();
          }
          break;
        case "\r":
          if (next === "\n") {
            curText += next;
            skipOne = true;
          }
          yield* handleEOL();
          break;
        case "\n":
          if (next === "\r") {
            curText += next;
            skipOne = true;
          }
          yield* handleEOL();
          break;
        default:
          if (inCommentSingleLine) {
            appendTokenValue();
          } else if (inCommentMultiLine) {
            if (cur === "*" && next === "/") {
              curText += next;
              skipOne = true;
              appendToken();
              yield* emitToken();
              inCommentMultiLine = false;
            } else {
              appendTokenValue();
            }
          } else {
            switch (cur) {
              case "/":
                switch (next) {
                  case "/":
                    curText += next;
                    skipOne = true;
                    yield* emitTokenIf();
                    setToken(TOK.Comment);
                    appendToken();
                    inCommentSingleLine = true;
                    break;
                  case "*":
                    curText += next;
                    skipOne = true;
                    yield* emitTokenIf();
                    setToken(TOK.Comment);
                    appendToken();
                    inCommentMultiLine = true;
                    break;
                  default:
                    setTokenIf(TOK.Line);
                    appendTokenValue();
                }
                break;
              default:
                setTokenIf(TOK.Line);
                appendTokenValue();
            }
          }
      }
    }
    yield* emitTokenIf();
  }
  yield { type: TOK.EOF, text: "", col, line, value: "" };
}
function* parser(input) {
  let LineTokens = [];
  for (const token of input) {
    switch (token.type) {
      case TOK.Line:
        LineTokens.push(token);
        break;
      case TOK.Comment:
        if (LineTokens.length > 0) {
          LineTokens.push(token);
        } else {
          yield token;
        }
        break;
      case TOK.EOL:
      case TOK.EOF:
        if (LineTokens.length > 0) {
          const combinedToken = {
            ...LineTokens[0],
            type: TOK.Line,
            value: LineTokens.map((token) =>
              token.type === TOK.Comment ? " " : token.value
            ).join(""),
            text: LineTokens.map((token) => token.text).join(""),
          };
          const matchPreprocessor = /^[ \t]*#[ \t]*([^ \t].*)?$/u.exec(
            combinedToken.value
          );
          if (matchPreprocessor && matchPreprocessor.length === 2) {
            const directiveLine = matchPreprocessor[1];
            if (directiveLine !== undefined) {
              const directiveParts = directiveLine.split(/[ \t]+/u);
              if (directiveParts.length > 0) {
                let [directive, ...body] = directiveParts;
                body = body.filter(Boolean);
                switch (directive.toLowerCase()) {
                  case "version":
                    combinedToken.type = TOK.Version;
                    combinedToken.Version = body.join(" ");
                    break;
                  case "line":
                    combinedToken.type = TOK.LineNo;
                    break;
                  case "extension":
                    {
                      combinedToken.type = TOK.Extension;
                      if (body.length === 3 && body[1] === ":") {
                        combinedToken.ExtensionName = body[0];
                        const extensionBehavior = body[2].toLowerCase();
                        switch (extensionBehavior) {
                          case "require":
                          case "enable":
                          case "warn":
                          case "disable":
                            combinedToken.ExtensionBehavior = extensionBehavior;
                            break;
                          default:
                            combinedToken.ExtensionBehavior = body[2];
                            warnParse(
                              `#extension directive: unknown behavior '${body[2]}'`,
                              combinedToken
                            );
                        }
                      } else {
                        warnParse(
                          "#extension directive: parse error",
                          combinedToken
                        );
                      }
                    }
                    break;
                  default:
                    combinedToken.type = TOK.Directive;
                    break;
                }
              }
            }
          }
          yield combinedToken;
          LineTokens = [];
        }
        yield token;
        break;
      default:
        yield token;
    }
  }
}
const warnParse = (message, token) =>
  console.error(`Warning: ${formatParseError(message, token)}`);
const formatParseError = (message, token) =>
  `${message}\nLine ${token.line} col ${token.col}:\n${formatLine(token.text)}`;
const formatLine = (line) => {
  let lineF = "";
  for (let i = 0; i < line.length; i++) {
    switch (line[i]) {
      case "\r":
        lineF += "<CR>";
        break;
      case "\n":
        lineF += "<EOL>";
        break;
      case "\t":
        lineF += "<TAB>";
        break;
      default:
        lineF += line[i];
    }
  }
  return lineF;
};

const GLSL_INCLUDE_EXT = "GL_GOOGLE_include_directive";
const GLSL_LINE_EXT = "GL_GOOGLE_cpp_style_line_directive";
function insertExtensionPreamble(
  code,
  filePath,
  versionReplacer = (v) => v,
  extraPreamble
) {
  const tokens = [
    ...(function* () {
      for (const token of simpleParse(code)) {
        if (token.type === TOK.Extension) {
          if (
            token?.ExtensionName === GLSL_INCLUDE_EXT ||
            token?.ExtensionName === GLSL_LINE_EXT
          ) {
            if (
              token?.ExtensionBehavior === "enable" ||
              token?.ExtensionBehavior === "require"
            ) ; else {
              throw new Error(
                formatParseError(
                  `Error: extension ${token.ExtensionName} cannot be disabled`,
                  token
                )
              );
            }
          }
        }
        yield token;
      }
    })(),
  ];
  return insertPreambleTokens(
    tokens,
    (fixupLineNo) => ({
      col: 0,
      line: fixupLineNo,
      type: TOK.Directive,
      value: "",
      text: `#extension ${GLSL_INCLUDE_EXT} : require${
        extraPreamble ? `\n${extraPreamble}` : ""
      }\n#line ${fixupLineNo} "${filePath}"\n`,
    }),
    versionReplacer
  );
}
function fixupDirectives(
  code,
  preserve = false,
  required = true,
  searchLineDirective = false,
  stripLineDirectives = false,
  versionReplacer = (v) => v
) {
  const STRIP_EXT = searchLineDirective ? GLSL_LINE_EXT : GLSL_INCLUDE_EXT;
  return [
    ...(function* () {
      let found = false;
      let skipNextEOL = false;
      nextToken: for (const token of simpleParse(code)) {
        if (skipNextEOL) {
          skipNextEOL = false;
          if (token.type === TOK.EOL) {
            continue nextToken;
          }
        }
        switch (token.type) {
          case TOK.Extension:
            if (token?.ExtensionName === STRIP_EXT) {
              if (
                token?.ExtensionBehavior === "enable" ||
                token?.ExtensionBehavior === "require"
              ) {
                if (!found) {
                  found = true;
                }
                if (preserve) {
                  token.text = `#extension ${GLSL_LINE_EXT} : require`;
                } else {
                  skipNextEOL = true;
                  continue nextToken;
                }
              } else {
                console.warn(
                  formatParseError(
                    `Warning: extension ${STRIP_EXT} disabled`,
                    token
                  )
                );
              }
            }
            break;
          case TOK.Version: {
            const newVersion = versionReplacer(token.Version);
            token.Version = newVersion;
            token.text = `#version ${newVersion}`;
            break;
          }
          case TOK.LineNo:
            if (stripLineDirectives && token.type === TOK.LineNo) {
              skipNextEOL = true;
              continue nextToken;
            }
            break;
        }
        yield token;
      }
      if (required && !found) {
        console.warn(`Warning: couldn't find ${STRIP_EXT} directive`);
        return code;
      }
    })(),
  ]
    .map((tok) => tok.text)
    .join("");
}
function insertPreambleTokens(
  tokens,
  preambleToken,
  versionReplacer = (v) => v
) {
  const newVersionToken = function* (token) {
    const newVersion = versionReplacer(undefined);
    if (newVersion !== undefined) {
      yield {
        type: TOK.Version,
        Version: newVersion,
        col: token.col,
        line: token.line,
        text: `#version ${newVersion}`,
        value: "",
      };
      yield {
        type: TOK.EOL,
        col: token.col,
        line: token.line,
        text: "\n",
        value: "\n",
      };
    }
  };
  return {
    code: [
      ... (function* () {
        let insertNext = false,
          acceptVersion = true,
          foundVersion = false,
          didInsertion = false;
        const newVersionPreambleTokens = function* (token) {
          acceptVersion = false;
          didInsertion = true;
          yield* newVersionToken(token);
          yield preambleToken(token.line);
        };
        for (const token of tokens) {
          if (insertNext) {
            insertNext = false;
            yield preambleToken(token.line);
          }
          switch (token.type) {
            case TOK.Comment:
              break;
            case TOK.EOF:
              if (acceptVersion) {
                yield* newVersionPreambleTokens(token);
              } else {
                if (!didInsertion) {
                  didInsertion = true;
                  yield {
                    type: TOK.EOL,
                    col: token.col,
                    line: token.line,
                    text: "\n",
                    value: "\n",
                  };
                  yield preambleToken(token.line + 1);
                }
              }
              break;
            case TOK.EOL:
              if (acceptVersion) {
                yield* newVersionPreambleTokens(token);
              } else {
                if (!didInsertion) {
                  insertNext = true;
                  didInsertion = true;
                }
              }
              break;
            case TOK.Version:
              if (acceptVersion) {
                acceptVersion = false;
                foundVersion = true;
                const newVersion = versionReplacer(token.Version);
                token.Version = newVersion;
                token.text = `#version ${newVersion}`;
              } else {
                throw new Error(
                  formatParseError(
                    `Parse error: #version directive must be on first line`,
                    token
                  )
                );
              }
              break;
            default:
              if (acceptVersion) {
                yield* newVersionPreambleTokens(token);
              }
          }
          yield token;
        }
        if (!foundVersion) {
          console.warn(`Warning: #version directive missing`);
        }
      })(),
    ]
      .map((tok) => tok.text)
      .join(""),
    didInsertion: true,
  };
}
function insertPreamble(code, preamble) {
  return insertPreambleTokens(simpleParse(code), (fixupLineNo) => ({
    col: 0,
    line: fixupLineNo,
    type: TOK.Comment,
    value: "",
    text: `${preamble}\n`,
  }));
}

function chunkWriterAsync(outputStream) {
  outputStream.setDefaultEncoding("utf8");
  outputStream.addListener("error", (err) => {
    throw new Error(`Output stream error: ${err?.message ?? ""}`);
  });
  return {
    write: async (strChunk) => {
      if (!outputStream.write(strChunk, "utf8")) {
        await once(outputStream, "drain");
      }
    },
    done: async () => {
      outputStream.end();
      await once(outputStream, "finish");
    },
  };
}
async function writeLines(stream, lines) {
  const chunkWriter = chunkWriterAsync(stream);
  await chunkWriter.write(lines);
  await chunkWriter.done();
}
async function* parseLines(stream) {
  stream.addListener("error", (err) => {
    throw new Error(`Input stream error: ${err?.message ?? ""}`);
  });
  const utf8Decoder = new TextDecoder("utf-8");
  let outputBuffer = Buffer.from([]);
  let outputBufferPos = 0;
  for await (const chunk of stream) {
    outputBuffer =
      outputBuffer.length > 0 ? Buffer.concat([outputBuffer, chunk]) : chunk;
    while (outputBufferPos < outputBuffer.length) {
      if (outputBuffer[outputBufferPos] === 0xa) {
        const outputEndPos =
          outputBufferPos > 0 && outputBuffer[outputBufferPos - 1] === 0xd
            ? outputBufferPos - 1
            : outputBufferPos;
        const nextChunk = outputBuffer.slice(0, outputEndPos);
        outputBuffer = outputBuffer.slice(outputBufferPos + 1);
        outputBufferPos = 0;
        const nextChunkString = utf8Decoder.decode(nextChunk, {
          stream: false,
        });
        yield nextChunkString;
      } else {
        outputBufferPos++;
      }
    }
  }
  if (outputBuffer.length > 0) {
    const nextChunkString = utf8Decoder.decode(outputBuffer, { stream: false });
    yield nextChunkString;
  }
}
async function bufferLines(lines) {
  const output = [];
  for await (const line of lines) {
    output.push(line);
  }
  return output;
}
async function bufferAndOutLines(lines, prefix = "") {
  const output = [];
  for await (const line of lines) {
    output.push(line);
    console.log(`${prefix}${line}`);
  }
  return output;
}
async function bufferAndErrLines(lines, prefix = "") {
  const output = [];
  for await (const line of lines) {
    output.push(line);
    console.error(`${prefix}${line}`);
  }
  return output;
}

const binFolder = settings.BIN_PATH;
const rootFolder = settings.PROJECT_ROOT;
let _pkg;
const getPkg = () => {
  if (!_pkg) {
    try {
      _pkg = loadJSON("package.json");
    } catch (err) {
      _pkg = { name: "unknown" };
    }
  }
  return _pkg;
};
const loadJSON = (file) =>
  JSON.parse(
    fsSync.readFileSync(path.resolve(rootFolder, file), { encoding: "utf8" })
  );
const ToolConfig = {
  Validator: {
    name: "glslangValidator",
    optionKey: "glslangValidatorPath",
    envKey: "GLSLANG_VALIDATOR",
    url: "https://github.com/KhronosGroup/glslang",
  },
  Optimizer: {
    name: "spirv-opt",
    optionKey: "glslangOptimizerPath",
    envKey: "GLSLANG_OPTIMIZER",
    url: "https://github.com/KhronosGroup/SPIRV-Tools",
  },
  Cross: {
    name: "spriv-cross",
    optionKey: "glslangCrossPath",
    envKey: "GLSLANG_CROSS",
    url: "https://github.com/KhronosGroup/SPIRV-Cross",
  },
};
const ToolDistPaths = {
  win64: {
    Validator: `glslangValidator.exe`,
    Optimizer: `spirv-opt.exe`,
    Cross: `spirv-cross.exe`,
  },
  ubuntu64: {
    Validator: `glslangValidator`,
    Optimizer: `spirv-opt`,
    Cross: `spirv-cross`,
  },
  macos64: {
    Validator: `glslangValidator`,
    Optimizer: `spirv-opt`,
    Cross: `spirv-cross`,
  },
};
let _platTag = undefined;
let _platConfigured = false;
function getPlatTag() {
  if (!_platTag) {
    if (arch() === "x64") {
      switch (platform()) {
        case "win32":
          _platTag = "win64";
          break;
        case "linux":
          _platTag = "ubuntu64";
          break;
        case "darwin":
          _platTag = "macos64";
          break;
      }
    } else if (arch() === "arm64") {
      switch (platform()) {
        case "darwin":
          _platTag = "macos64";
          break;
      }
    }
  }
  return _platTag;
}
function configurePlatformBinaries() {
  if (!_platConfigured) {
    _platConfigured = true;
    getPlatTag();
    if (_platTag) {
       (
        Object.entries(ToolDistPaths[_platTag])
      ).forEach(([tool, file]) => {
        ToolConfig[tool].distPath = `${_platTag}${path.sep}${file}`;
      });
    }
  }
  return _platTag
    ? {
        folderPath: path.join(binFolder, _platTag),
        tag: _platTag,
        fileList: Object.values(ToolConfig).map(
          (tool) => path.join(binFolder, tool.distPath) ?? ""
        ),
      }
    : null;
}
function errorMissingTools(kinds) {
  let errMsg = `Khronos tool binaries could not be found:\n`;
  for (const kind of kinds) {
    const config = ToolConfig[kind];
    errMsg +=
      `${config.name} not found, searched path: '${config.path ?? ""}'\n` +
      toolInfo(config);
  }
  throw new Error(errMsg);
}
const toolInfo = (config) =>
  `${config.name} : configure with the environment variable ${config.envKey} (or the option ${config.optionKey})\n${config.url}\n`;
function configureTools(
  options,
  required =  (Object.keys(ToolConfig))
) {
  configurePlatformBinaries();
  const missingKinds = [];
  for (const kind of required) {
    const tool = ToolConfig[kind];
    const toolPath =
      process.env[tool.envKey] || options[tool.optionKey] || tool.distPath;
    if (!toolPath) {
      console.warn(`Khronos ${tool.name} binary not shipped for this platform`);
    } else {
      tool.path = path.resolve(binFolder, toolPath);
    }
    if (!tool.path || !fsSync.existsSync(tool.path)) {
      missingKinds.push(kind);
    }
  }
  if (missingKinds.length) {
    errorMissingTools(missingKinds);
  }
}
function getToolPath(kind) {
  const validatorPath = ToolConfig[kind].path;
  if (!validatorPath) errorMissingTools([kind]);
  return validatorPath;
}
function launchTool(kind, workingDir, args) {
  const toolBin = getToolPath(kind);
  return launchToolPath(toolBin, workingDir, args);
}
function launchToolPath(path, workingDir, args) {
  const toolProcess = spawn(path, args, {
    cwd: workingDir,
    stdio: ["pipe", "pipe", "pipe"],
    shell: false,
    windowsVerbatimArguments: true,
  });
  toolProcess.on("error", (err) => {
    throw new Error(
      `${path}: failed to launch${err?.message ? ` : ${err.message}` : ""}`
    );
  });
  const exitPromise = new Promise((resolve, reject) => {
    toolProcess.on("exit", (code, signal) => {
      resolve({ code, signal });
    });
  });
  return { toolProcess, exitPromise };
}
async function waitForToolBuffered(
  { toolProcess, exitPromise },
  input = undefined,
  echo = false
) {
  const stderrPromise = echo
    ? bufferAndErrLines(parseLines(toolProcess.stderr))
    : bufferLines(parseLines(toolProcess.stderr));
  const stdoutPromise = echo
    ? bufferAndOutLines(parseLines(toolProcess.stdout))
    : bufferLines(parseLines(toolProcess.stdout));
  if (input !== undefined) {
    await writeLines(toolProcess.stdin, input);
  }
  const exitStatus = await exitPromise;
  const outLines = await stdoutPromise;
  const errLines = await stderrPromise;
  return {
    error:
      exitStatus.signal !== null || (exitStatus.code && exitStatus.code !== 0),
    exitMessage: `exit status: ${exitStatus.code || "n/a"} ${
      exitStatus.signal || ""
    }`,
    exitStatus,
    outLines,
    errLines,
  };
}
function printToolDiagnostic(lines) {
  for (const line of lines) {
    if (line.length && line !== "stdin") {
      console.error(line);
    }
  }
}
const argEscapeWindows = (pattern) => {
  const buf = [];
  for (const char of pattern) {
    switch (char) {
      case '"':
        buf.push("\\", '"');
        break;
      default:
        buf.push(char);
    }
  }
  return buf.join("");
};
const argQuoteWindows = (val) => `"${argEscapeWindows(val)}"`.split(" ");
const argVerbatim = (val) => [val];
const argQuote = platform() === "win32" ? argQuoteWindows : argVerbatim;
let _cachePath;
const getCachePath = () => {
  if (!_cachePath) {
    _cachePath = envPaths(getPkg().name).cache;
  }
  return _cachePath;
};

(TFileCache).default;
function checkMakeFolder(path) {
  if (!fsSync.existsSync(path)) {
    fsSync.mkdirSync(path, { recursive: true });
  }
  return true;
}
const rmDir = (path) =>
  fsSync.existsSync(path) &&
  fsSync.rmSync(path, { force: true, recursive: true });

function compressShader(code) {
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

async function glslRunTool(kind, title, name, workingDir, input, params) {
  const result = await waitForToolBuffered(
    launchTool(kind, workingDir, params),
    input
  );
  if (result.error) {
    printToolDiagnostic(result.outLines);
    printToolDiagnostic(result.errLines);
    const errMsg = `${title}: ${name} failed, ${result.exitMessage}`;
    console.error(errMsg);
    throw new Error(errMsg);
  }
  return result.outLines ? result.outLines.join(EOL) : "";
}
async function glslRunValidator(
  name,
  workingDir,
  stageName,
  input,
  params,
  extraParams
) {
  return glslRunTool(
    "Validator",
    "Khronos glslangValidator",
    name,
    workingDir,
    input,
    [
      "--stdin",
      "-C",
      "-t",
      "-S",
      stageName,
      ...params,
      ...extraParams,
    ]
  );
}
async function glslRunOptimizer(
  name,
  workingDir,
  inputFile,
  outputFile,
  input,
  preserveUnusedBindings = true,
  params,
  extraParams
) {
  return glslRunTool(
    "Optimizer",
    "Khronos spirv-opt",
    name,
    workingDir,
    input,
    [
      "-O",
      "--target-env=opengl4.0",
      ...(preserveUnusedBindings ? ["--preserve-bindings"] : []),
      ...params,
      ...extraParams,
      ...argQuote(inputFile),
      "-o",
      ...argQuote(outputFile),
    ]
  );
}
async function glslRunCross(
  name,
  workingDir,
  stageName,
  inputFile,
  input,
  emitLineInfo,
  params,
  extraParams
) {
  return glslRunTool("Cross", "Khronos spirv-cross", name, workingDir, input, [
    ...argQuote(inputFile),
    ...(emitLineInfo ? ["--emit-line-directives"] : []),
    `--stage`,
    stageName,
    ...params,
    ...extraParams,
  ]);
}
function getBuildDir(id) {
  const sanitizeID = path
    .basename(id)
    .replace(/([^a-z0-9]+)/gi, "-")
    .toLowerCase();
  const uniqID =
    ((Date.now() >>> 0) + crypto.randomBytes(4).readUInt32LE()) >>> 0;
  const uniqIDHex = uniqID.toString(16).padStart(8, "0");
  return path.join(getCachePath(), "glslBuild", `${sanitizeID}-${uniqIDHex}`);
}
async function glslProcessSource(
  id,
  source,
  stageName,
  glslOptions = {},
  warnLog = console.error
) {
  const options = {
    sourceMap: true,
    compress: true,
    optimize: true,
    emitLineDirectives: false,
    suppressLineExtensionDirective: false,
    optimizerPreserveUnusedBindings: true,
    optimizerDebugSkipOptimizer: false,
    preamble: undefined,
    includePaths: [],
    extraValidatorParams: [],
    extraOptimizerParams: [],
    extraCrossParams: [],
    ...glslOptions,
  };
  configureTools(
    {},
    options.optimize ? ["Validator", "Optimizer", "Cross"] : ["Validator"]
  );
  let tempBuildDir;
  if (options.optimize) {
    tempBuildDir = getBuildDir(id);
    rmDir(tempBuildDir);
    checkMakeFolder(tempBuildDir);
  }
  const baseDir = path.dirname(id);
  const baseName = path.basename(id);
  let targetID = `./${baseName}`;
  let targetDir = baseDir;
  let outputFile = targetID;
  if (!fsSync.existsSync(targetDir)) {
    warnLog(
      `Error resolving path: '${id}' : Khronos glslangValidator may fail to find includes`
    );
    targetDir = process.cwd();
    targetID = id;
    outputFile = `temp`;
  }
  let outputFileAbs;
  let optimizedFileAbs;
  let versionReplacer;
  let targetGlslVersion = 300;
  if (options.optimize) {
    outputFileAbs = path.join(tempBuildDir, `${outputFile}.spv`);
    optimizedFileAbs = path.join(tempBuildDir, `${outputFile}-opt.spv`);
    versionReplacer = (version) => {
      const versionParts =
        version && version.match(/^\s*(\d+)(?:\s+(es))?\s*$/i);
      if (versionParts && versionParts.length === 3) {
        targetGlslVersion = +versionParts[1];
      }
      if (targetGlslVersion < 300) {
        throw new Error(
          `Only GLSL ES shaders version 300 (WebGL2) or higher can be optimized`
        );
      }
      return `${Math.max(targetGlslVersion, 310)} es`;
    };
  }
  const { code, didInsertion } = insertExtensionPreamble(
    source,
    targetID,
    versionReplacer,
    options.preamble
  );
  const extraValidatorParams = [
    ...options.includePaths.map((path) => `-I${path}`),
    ...options.extraValidatorParams,
  ];
  let processedGLSL;
  if (options.optimize) {
    await glslRunValidator(
      "Build spirv",
      targetDir,
      stageName,
      code,
      [
        "-G",
        "-g",
        "--auto-map-locations",
        "--auto-map-bindings",
        "-o",
        ...argQuote(outputFileAbs),
      ],
      extraValidatorParams
    );
    if (!fsSync.existsSync(outputFileAbs)) {
      throw new Error(`Build spirv failed: no output file`);
    }
    if (!options.optimizerDebugSkipOptimizer) {
      await glslRunOptimizer(
        "Optimize spirv",
        targetDir,
        outputFileAbs,
        optimizedFileAbs,
        undefined,
        options.optimizerPreserveUnusedBindings,
        [
        ],
        options.extraOptimizerParams
      );
      if (!fsSync.existsSync(optimizedFileAbs)) {
        throw new Error(
          `Optimize spirv failed: no output file (${optimizedFileAbs})`
        );
      }
    }
    processedGLSL = await glslRunCross(
      "Build spirv to GLSL",
      targetDir,
      stageName,
      options.optimizerDebugSkipOptimizer ? outputFileAbs : optimizedFileAbs,
      undefined,
      options.emitLineDirectives,
      [
        "--es",
        "--version",
        `${targetGlslVersion}`,
      ],
      options.extraCrossParams
    );
    rmDir(tempBuildDir);
  } else {
    processedGLSL = await glslRunValidator(
      "Preprocessing",
      targetDir,
      stageName,
      code,
      [
        "-E",
      ],
      extraValidatorParams
    );
    await glslRunValidator(
      "Validation",
      targetDir,
      stageName,
      processedGLSL,
      [],
      extraValidatorParams
    );
  }
  processedGLSL = fixupDirectives(
    processedGLSL,
    options.emitLineDirectives && !options.suppressLineExtensionDirective,
    didInsertion && (!options.optimize || options.emitLineDirectives),
    options.optimize,
    !options.emitLineDirectives,
    undefined
  );
  const outputCode = options.compress
    ? compressShader(processedGLSL)
    : processedGLSL;
  const result = {
    code: outputCode,
    map: { mappings: "" },
  };
  if (options.sourceMap) {
    const sourceMapSource = insertPreamble(
      processedGLSL,
      "/*\n" +
        `* Preprocessed${
          options.optimize ? " + Optimized" : ""
        } from '${targetID}'\n` +
        (options.compress ? "* [Embedded string is compressed]\n" : "") +
        "*/"
    ).code;
    const magicString = new MagicString(sourceMapSource);
    result.map = magicString.generateMap({
      source: id,
      includeContent: true,
      hires: true,
    });
  }
  return result;
}

let glslifyCompile;
async function glslifyInit() {
  if (glslifyCompile) return;
  try {
    const glslify = await import('glslify');
    if (glslify && glslify.compile && typeof glslify.compile === "function") {
      glslifyCompile = glslify.compile;
    }
  } catch {
  }
}
async function glslifyProcessSource(
  id,
  source,
  options,
  failError,
  warnLog = console.error
) {
  if (!glslifyCompile) {
    failError(`glslify could not be found. Install it with npm i -D glslify`);
  }
  let basedir = path.dirname(id);
  if (!fsSync.existsSync(basedir)) {
    warnLog(
      `Error resolving path: '${id}' : glslify may fail to find includes`
    );
    basedir = process.cwd();
  }
  return glslifyCompile(
    source,
     ({ basedir, ...options })
  );
}

const stageDefs = {
  vert: [".vs", ".vert", ".vs.glsl", ".vert.glsl"],
  frag: [".fs", ".frag", ".fs.glsl", ".frag.glsl"],
  geom: [".geom", ".geom.glsl"],
  comp: [".comp", ".comp.glsl"],
  tesc: [".tesc", ".tesc.glsl"],
  tese: [".tese", ".tese.glsl"],
};
const extsIncludeDefault = [
  ...Object.values(stageDefs).flatMap((exts) =>
    exts.map((ext) => `**/*${ext}`)
  ),
  "**/*.glsl",
];
const stageRegexes =  (
  Object.entries(stageDefs)
).map(([st, exts]) => [
  st,
  new RegExp(
    `(?:${exts.map((ext) => ext.replace(".", "\\.")).join("|")})$`,
    "i"
  ),
]);
function generateCode(source) {
  return `export default ${JSON.stringify(source)}; // eslint-disable-line`;
}
function glslOptimize(userOptions = {}) {
  const pluginOptions = {
    include: extsIncludeDefault,
    exclude: [],
    glslify: false,
    glslifyOptions: {},
    ...userOptions,
  };
  const filter = createFilter(pluginOptions.include, pluginOptions.exclude);
  return {
    name: "glsl-optimize",
    async options(options) {
      if (pluginOptions.glslify) {
        await glslifyInit();
      }
      return options;
    },
    async load(id) {
      if (!id || !filter(id) || !fsSync.existsSync(id)) return;
      let source;
      try {
        source = fsSync.readFileSync(id, { encoding: "utf8" });
      } catch (err) {
        this.warn(`Failed to load file '${id}' : ${err.message}`);
        return;
      }
      const stage = stageRegexes.find(([, regex]) => id.match(regex))?.[0];
      if (!stage) {
        this.error({
          message: `File '${id}' : extension did not match a shader stage.`,
        });
      }
      if (pluginOptions.glslify) {
        try {
          source = await glslifyProcessSource(
            id,
            source,
            pluginOptions.glslifyOptions,
            (message) => this.error({ message })
          );
        } catch (err) {
          this.error({
            message: `Error processing GLSL source with glslify:\n${err.message}`,
          });
        }
      }
      try {
        const result = await glslProcessSource(
          id,
          source,
          stage,
          pluginOptions
        );
        result.code = generateCode(result.code);
        return result;
      } catch (err) {
        this.error({
          message: `Error processing GLSL source:\n${err.message}`,
        });
      }
    },
  };
}

export { glslOptimize as default };
