"""Compare the standard action's extracted files with a digest-verified ZIP.

No extraction, uploads, credentials, or network access. Fail closed on differences.
"""

import pathlib
import stat
import sys
import zipfile


def verify(archive, directory):
    """Prove the action's extracted files match a ZIP whose SHA-256 was checked in TS.

    Args:
        archive: Local ZIP path. This function does NOT authenticate its checksum;
            deploy-static.ts must verify that against GitHub before calling us.
        directory: Artifact directory already extracted by download-artifact and
            audited for unsafe paths/symlinks by the TypeScript artifact checker.

    Checks every file's bytes and the complete file set, rejecting unsafe ZIP names,
    duplicate file entries, symlinks, extra/missing files and size/count overruns.
    It never extracts files, changes the artifact, or needs network credentials.

    Raises:
        ValueError: An integrity, path or budget check fails.
        OSError / zipfile.BadZipFile: A file cannot be read or the ZIP is invalid.
        The CLI leaves these uncaught so GitHub Actions stops before deployment.
    """
    root = pathlib.Path(directory)
    expected = set()
    with zipfile.ZipFile(archive) as bundle:
        entries = bundle.infolist()
        if len(entries) > 20_000 or sum(item.file_size for item in entries) > 1024**3:
            raise ValueError("Artifact exceeds count/size budget")
        for item in entries:
            name = item.filename.rstrip("/")
            if (
                not name
                or name.startswith("/")
                or "\\" in name
                or ":" in name
                or any(ord(char) < 32 for char in name)
                or any(part in ("", ".", "..") for part in name.split("/"))
                or stat.S_ISLNK(item.external_attr >> 16)
                or item.file_size > 25 * 1024 * 1024
            ):
                raise ValueError("Unsafe archive member")
            if item.is_dir():
                continue
            if name in expected:
                raise ValueError("Duplicate archive member")
            expected.add(name)
            path = root / name
            if path.is_symlink() or path.read_bytes() != bundle.read(item):
                raise ValueError("Extracted artifact differs from verified archive")
    actual = {path.relative_to(root).as_posix() for path in root.rglob("*") if path.is_file()}
    if actual != expected:
        raise ValueError("Missing or extra extracted files")


if __name__ == "__main__":
    verify(sys.argv[1], sys.argv[2])
