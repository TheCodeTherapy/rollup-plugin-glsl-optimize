import internalDel from "del";
import del from "rollup-plugin-delete";
import dts from "rollup-plugin-dts";
import * as fsSync from "fs";

const IN_DIR = "typings-autogen";
const OUTPUT_FILE = "dist/index.d.ts";

let earlyDelDone = false;
// Runs sequentially before buildStart hooks:
function earlyDel(targets = [], deleteOptions = {}) {
  return {
    name: "earlydel",
    options: function (options) {
      if (!earlyDelDone) {
        earlyDelDone = true;
        const paths = internalDel.sync(targets, deleteOptions);
        if (deleteOptions.verbose) {
          console.log(`Deleted files and folders: ${paths.length}`);
          if (paths.length > 0) {
            paths.forEach((path) => {
              console.log(path);
            });
          }
        }
      }
      return null;
    },
  };
}

function appendDts(filePath) {
  const fileContent = fsSync.readFileSync(filePath, { encoding: "utf8" });
  return {
    name: "append-dts",
    renderChunk(code) {
      return `${code}\n${fileContent}`;
    },
  };
}

export default [
  {
    input: `${IN_DIR}/src/index.d.ts`,
    output: {
      file: OUTPUT_FILE,
      format: "es",
    },
    plugins: [
      earlyDel([OUTPUT_FILE]),
      dts({ compilerOptions: {} }),
      // appendDts('src/resources.d.ts'),
      del({ hook: "buildEnd", targets: [IN_DIR] }),
    ],
    external: ["child_process"],
  },
];
