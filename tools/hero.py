"""生成内容页 hero：真实 3D 客厅截图 + 电影感压暗 + 左侧排版。

设计尺寸 1200x600，按 2x 渲染后缩放，保证文字锐利。
用法：python tools/hero.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
SRC = Path(r"E:\Ayane_Use\_gallery\satio\10-dialogue.png")

W, H = 1200, 600
S = 2  # 超采样倍数
CROP_TOP = 132  # 源图纵向裁切起点（1x）

FONT_LIGHT = r"C:\Windows\Fonts\segoeuil.ttf"
FONT_CN = r"C:\Windows\Fonts\msyh.ttc"
FONT_MONO = r"C:\Windows\Fonts\consola.ttf"

INK = (236, 231, 224)
INK2 = (176, 167, 155)
WARM = (232, 160, 106)


def font(path, size):
    return ImageFont.truetype(path, size * S)


def tracked(draw, xy, s, fnt, spacing, fill):
    """逐字绘制，模拟 letter-spacing。"""
    x, y = xy
    for ch in s:
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += draw.textlength(ch, font=fnt) + spacing * S
    return x


def vgrad(size, stops):
    w, h = size
    col = Image.new("L", (1, h))
    px = col.load()
    for y in range(h):
        t = y / max(1, h - 1)
        for i in range(len(stops) - 1):
            p0, a0 = stops[i]
            p1, a1 = stops[i + 1]
            if p0 <= t <= p1:
                px[0, y] = int(a0 + (a1 - a0) * ((t - p0) / max(1e-6, p1 - p0)))
                break
    return col.resize((w, h), Image.BILINEAR)


def hgrad(size, stops):
    w, h = size
    row = Image.new("L", (w, 1))
    px = row.load()
    for x in range(w):
        t = x / max(1, w - 1)
        for i in range(len(stops) - 1):
            p0, a0 = stops[i]
            p1, a1 = stops[i + 1]
            if p0 <= t <= p1:
                px[x, 0] = int(a0 + (a1 - a0) * ((t - p0) / max(1e-6, p1 - p0)))
                break
    return row.resize((w, h), Image.BILINEAR)


def build():
    w, h = W * S, H * S
    src = Image.open(SRC).convert("RGB")
    scale = W / src.width
    mid = src.resize((W * S, round(src.height * scale * S)), Image.LANCZOS)
    top = CROP_TOP * S
    base = mid.crop((0, top, w, top + h))

    # 1) 整体压暗
    base = Image.blend(base, Image.new("RGB", base.size, (8, 10, 14)), 0.22)
    base = base.convert("RGBA")

    # 2) 左侧压暗，给文字腾出阅读区
    left = Image.new("RGBA", base.size, (6, 8, 12, 0))
    left.putalpha(hgrad(base.size, [(0.0, 244), (0.26, 226), (0.48, 140), (0.70, 0), (1.0, 0)]))
    base.alpha_composite(left)

    # 3) 顶部/底部轻微压角
    vg = Image.new("RGBA", base.size, (6, 8, 12, 0))
    vg.putalpha(vgrad(base.size, [(0.0, 130), (0.20, 0), (0.74, 0), (1.0, 120)]))
    base.alpha_composite(vg)

    d = ImageDraw.Draw(base)

    # ---- 文案 ----
    x0 = 64 * S
    tracked(d, (x0 + 1 * S, 138 * S), "S.A.T.I.O  ·  PERSONAL WORLD", font(FONT_MONO, 11), 2.4, WARM)
    d.text((x0 - 2 * S, 150 * S), "Tanora Vic", font=font(FONT_LIGHT, 64), fill=INK)
    d.text((x0, 236 * S), "造一个能住在电脑里的角色。", font=font(FONT_CN, 25), fill=(228, 220, 210))
    d.text((x0 + 1 * S, 278 * S), "a character shell that lives on your own machine.",
           font=font(FONT_LIGHT, 14), fill=INK2)

    # 发丝线 + 端点
    ly = 318 * S
    d.line([(x0, ly), (x0 + 232 * S, ly)], fill=(255, 255, 255, 46), width=max(1, S // 2))
    d.ellipse([(x0 + 232 * S - 3 * S, ly - 3 * S), (x0 + 238 * S, ly + 3 * S)], fill=WARM)

    # 胶囊 pill（用独立图层做 alpha 混合，直接画在 RGBA 上会吃掉透明度）
    px0, py0, px1, py1 = x0, 344 * S, x0 + 372 * S, 384 * S
    pill = Image.new("RGBA", base.size, (0, 0, 0, 0))
    pd = ImageDraw.Draw(pill)
    pd.rounded_rectangle([px0, py0, px1, py1], radius=(py1 - py0) // 2,
                         fill=(255, 255, 255, 10), outline=(255, 255, 255, 46), width=max(1, S // 2))
    base.alpha_composite(pill)

    label = "LOCAL-FIRST · SELF-HOSTED · APACHE-2.0"
    f = font(FONT_MONO, 10)
    tw = d.textlength(label, font=f) + 2.2 * S * (len(label) - 1)
    tracked(d, ((px0 + px1 - tw) // 2, py0 + 12 * S), label, f, 2.2, (214, 205, 194))

    # 右上角 caption
    cap = "PROTOTYPE · RUNNING LOCAL"
    f2 = font(FONT_MONO, 9)
    tw2 = d.textlength(cap, font=f2) + 2.6 * S * (len(cap) - 1)
    tracked(d, (w - 64 * S - tw2, 34 * S), cap, f2, 2.6, (166, 157, 146))

    out = base.convert("RGB").resize((W, H), Image.LANCZOS)
    dst = ASSETS / "hero-photo.webp"
    out.save(dst, "WEBP", quality=90, method=6)
    print(f"hero-photo.webp {out.width}x{out.height} {dst.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    build()
