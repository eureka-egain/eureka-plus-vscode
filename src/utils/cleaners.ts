import fs from "fs-extra";

const eraseFolderAtPath = (path?: string) => {
  if (path && fs.existsSync(path)) {
    fs.removeSync(path);
  }
};

// ---------------------------------------------------------------

export const cleaners = {
  eraseFolderAtPath,
};
