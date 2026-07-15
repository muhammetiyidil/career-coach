#!/usr/bin/env python
"""Tiny adb UI driver for the CareerCoach RN app test.

Usage:
  python ui.py find <text-substring>     -> list matching nodes with centers
  python ui.py tap <text-substring>      -> tap center of first match
  python ui.py tapi <text> <index>       -> tap center of match #index
  python ui.py shot <name>               -> screenshot to test-artifacts/<name>.png
  python ui.py type <text>               -> type text (spaces ok)
  python ui.py key <keycode>             -> send keyevent
  python ui.py swipe x1 y1 x2 y2 [ms]    -> swipe
"""
import os
import re
import subprocess
import sys

ADB = r"C:\Users\muham\AppData\Local\Android\Sdk\platform-tools\adb.exe"
HERE = os.path.dirname(os.path.abspath(__file__))


def run(*args, binary=False):
    result = subprocess.run([ADB, *args], capture_output=True)
    if binary:
        return result.stdout
    return result.stdout.decode('utf-8', 'replace')


def dump():
    run('shell', 'uiautomator', 'dump', '/sdcard/window_dump.xml')
    return run('shell', 'cat', '/sdcard/window_dump.xml')


def nodes(needle):
    xml = dump()
    out = []
    for m in re.finditer(r'<node[^>]*?/>', xml):
        tag = m.group(0)
        text = re.search(r'text="([^"]*)"', tag)
        desc = re.search(r'content-desc="([^"]*)"', tag)
        cls = re.search(r'class="([^"]*)"', tag)
        label = ((text.group(1) if text else '') + '|' + (desc.group(1) if desc else ''))
        if needle.lower() in label.lower():
            b = re.search(r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', tag)
            if b:
                x1, y1, x2, y2 = map(int, b.groups())
                out.append((label.strip('|'), (x1 + x2) // 2, (y1 + y2) // 2,
                            (x1, y1, x2, y2), cls.group(1) if cls else ''))
    return out


def main():
    cmd = sys.argv[1]

    if cmd == 'find':
        for label, cx, cy, bounds, cls in nodes(sys.argv[2]):
            print(f'{label!r} center=({cx},{cy}) bounds={bounds} cls={cls}')
    elif cmd in ('tap', 'tapi'):
        idx = int(sys.argv[3]) if cmd == 'tapi' else 0
        found = nodes(sys.argv[2])
        if not found:
            print('NOT FOUND:', sys.argv[2])
            sys.exit(1)
        label, cx, cy, _, _ = found[idx]
        run('shell', 'input', 'tap', str(cx), str(cy))
        print(f'tapped {label!r} at ({cx},{cy})')
    elif cmd == 'shot':
        png = run('exec-out', 'screencap', '-p', binary=True)
        path = os.path.join(HERE, sys.argv[2] + '.png')
        with open(path, 'wb') as f:
            f.write(png)
        print('saved', path)
    elif cmd == 'type':
        run('shell', 'input', 'text', sys.argv[2].replace(' ', '%s'))
        print('typed')
    elif cmd == 'key':
        run('shell', 'input', 'keyevent', sys.argv[2])
        print('key sent')
    elif cmd == 'swipe':
        run('shell', 'input', 'swipe', *sys.argv[2:])
        print('swiped')


if __name__ == '__main__':
    main()
