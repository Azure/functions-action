import fs, { Dirent } from 'fs';
export { chmodSync, mkdirSync, renameSync, rmdirSync, rmSync, statSync, lstatSync, unlinkSync, } from 'fs';
export declare const readdirSync: (path: fs.PathLike) => Dirent[];
export declare const promises: {
    chmod: typeof fs.promises.chmod;
    mkdir: typeof fs.promises.mkdir;
    readdir: (path: fs.PathLike) => Promise<fs.Dirent<string>[]>;
    rename: typeof fs.promises.rename;
    rm: typeof fs.promises.rm;
    rmdir: typeof fs.promises.rmdir;
    stat: typeof fs.promises.stat;
    lstat: typeof fs.promises.lstat;
    unlink: typeof fs.promises.unlink;
};
//# sourceMappingURL=fs.d.ts.map