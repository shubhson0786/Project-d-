from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

folder = Path(r"C:\Users\shubham sonkar\Desktop\project d\report_render")
files = sorted(folder.glob("completed-*.png"))
for group_index in range(0, len(files), 6):
    group = files[group_index:group_index + 6]
    sheet = Image.new("RGB", (780, 1640), "white")
    draw = ImageDraw.Draw(sheet)
    for index, source in enumerate(group):
        image = ImageOps.contain(Image.open(source).convert("RGB"), (360, 500))
        x = 20 + (index % 2) * 380
        y = 30 + (index // 2) * 535
        sheet.paste(image, (x, y))
        draw.text((x, 8 + (index // 2) * 535), source.stem, fill="black")
    sheet.save(folder / f"completed-contact-{group_index // 6 + 1}.png")
