"""
Removes the generator's four-point star watermark (bottom-right) from every
frame of the hero footage, ahead of scripts/build-frames.ts.

    python3 scripts/clean-watermark.py <source_dir> <out_dir>
    FRAMES_PRECLEANED=1 npx tsx scripts/build-frames.ts <out_dir>

Needs opencv-contrib-python and numpy. The star is a fixed shape in a fixed
place, so its mask is built once from a frame where it sits on a flat backdrop
(the last one). Each frame is then filled with frequency-selective
reconstruction, which keeps an arm or fabric edge running through the star
straight; the cheaper FAST mode is used where the corner is flat.
"""
import glob, os, sys
import cv2
import numpy as np

SRC, OUT = sys.argv[1], sys.argv[2]
X0, X1, Y0, Y1 = 1660, 1800, 850, 950   # box around the star, 1908x1080 source
PAD = 40
os.makedirs(OUT, exist_ok=True)
files = sorted(glob.glob(os.path.join(SRC, "*.jpg")))

# Star mask from the last frame: pixels lighter than a row-interpolated backdrop.
last = cv2.imread(files[-1]).astype(np.float32)[Y0:Y1, X0:X1]
t = np.linspace(0, 1, last.shape[1])[None, :, None]
bg = last[:, :14].mean(1, keepdims=True) * (1 - t) + last[:, -14:].mean(1, keepdims=True) * t
alpha = cv2.GaussianBlur(((last - bg) / (255 - bg)).mean(2), (0, 0), 0.8)
mask = cv2.dilate((alpha > 0.06).astype(np.uint8), np.ones((7, 7), np.uint8))
band = cv2.dilate(mask, np.ones((21, 21), np.uint8)) - mask

mroi = np.zeros((Y1 - Y0 + 2 * PAD, X1 - X0 + 2 * PAD), np.uint8)
mroi[PAD:PAD + Y1 - Y0, PAD:PAD + X1 - X0] = mask
valid = (255 - mroi * 255).astype(np.uint8)  # xphoto: 255 = keep, 0 = fill
ys, xs = slice(Y0 - PAD, Y1 + PAD), slice(X0 - PAD, X1 + PAD)


def edge_strength(im):
    g = cv2.GaussianBlur(cv2.cvtColor(im[Y0:Y1, X0:X1], cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 1.0)
    m = np.hypot(cv2.Sobel(g, cv2.CV_32F, 1, 0), cv2.Sobel(g, cv2.CV_32F, 0, 1)) / 8
    return float(np.percentile(m[band > 0], 95))


for f in files:
    im = cv2.imread(f)
    mode = cv2.xphoto.INPAINT_FSR_BEST if edge_strength(im) > 2.5 else cv2.xphoto.INPAINT_FSR_FAST
    roi = im[ys, xs].copy()
    dst = np.zeros_like(roi)
    cv2.xphoto.inpaint(roi, valid, dst, mode)
    im[ys, xs] = dst
    cv2.imwrite(os.path.join(OUT, os.path.basename(f)), im,
                [cv2.IMWRITE_JPEG_QUALITY, 97, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444])
