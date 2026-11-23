"""把用户给的两张品牌图转成仓库里的 webp 资产。

- hero-verse.webp    ：S.A.T.I.O Verse 品牌卡（白光辉、红宝石、细线轨道 + 衬线字标）
- moment-dialogue.webp：虚焦的黄昏客厅 + 发光胶囊，做「跑起来的样子」插入图
用法：python tools/brand.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

SRC = {
    "hero-verse.webp": Path(
        r"C:\Users\ASUS\.dsh\attachments\v1\objects\2a"
        r"\2aa1a103f936f3fb7e14167b9fd86dc857dc09638acf1c12494f34e4c230934e"
    ),
    "moment-dialogue.webp": Path(
        r"C:\Users\ASUS\.dsh\attachments\v1\objects\57"
        r"\579142acca2176d71e305c4e1f452573d84a27e0fef5af57e35a06973454602c"
    ),
}


def main():
    for name, src in SRC.items():
        im = Image.open(src).convert("RGB")
        dst = ASSETS / name
        im.save(dst, "WEBP", quality=93, method=6)
        print(f"{name} {im.width}x{im.height} {dst.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
