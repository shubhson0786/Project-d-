"""Fetch MongoDB's executable without downloading the archive's debug symbols.

Uses range requests to the official MongoDB archive. zipfile verifies the entry
CRC while extracting. The executable is for local integration tests only.
"""
from pathlib import Path
import io
import urllib.request
import zipfile

URL = 'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.24.zip'
ROOT = Path(__file__).resolve().parents[1]

class RemoteZip(io.RawIOBase):
    def __init__(self):
        response = urllib.request.urlopen(urllib.request.Request(URL, method='HEAD'), timeout=60)
        self.size = int(response.headers['Content-Length'])
        self.position = 0
    def seekable(self): return True
    def readable(self): return True
    def tell(self): return self.position
    def seek(self, offset, whence=0):
        self.position = offset if whence == 0 else self.position + offset if whence == 1 else self.size + offset
        return self.position
    def read(self, size=-1):
        if size == 0: return b''
        end = self.size - 1 if size < 0 else min(self.size - 1, self.position + size - 1)
        if self.position > end: return b''
        request = urllib.request.Request(URL, headers={'Range': f'bytes={self.position}-{end}'})
        with urllib.request.urlopen(request, timeout=120) as response:
            if response.status != 206: raise RuntimeError('Server did not support partial downloads')
            data = response.read()
        self.position += len(data)
        return data

if __name__ == '__main__':
    target = ROOT / '.cache' / 'mongodb'
    target.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(RemoteZip()) as archive:
        entries = [item for item in archive.infolist() if item.filename.endswith('/bin/mongod.exe') or ('/bin/' in item.filename and item.filename.endswith('.dll'))]
        for entry in entries:
            destination = target / Path(entry.filename).name
            print(f'{destination.name}: {entry.compress_size / 1048576:.1f} MB compressed', flush=True)
            with archive.open(entry) as source, destination.open('wb') as output:
                while chunk := source.read(1024 * 1024): output.write(chunk)
        print('MongoDB test executable ready', flush=True)
