import os
import cv2
import numpy as np
from PIL import Image
import pytesseract
import easyocr

class OCRService:
    def __init__(self):
        languages = os.environ.get("OCR_LANGS", "fr,en")
        self.ocr_langs = [lang.strip() for lang in languages.split(",") if lang.strip()]
        if not self.ocr_langs:
            self.ocr_langs = ["fr", "en"]

        tesseract_map = {
            "fr": "fra",
            "en": "eng",
        }
        self.tesseract_langs = "+".join(tesseract_map.get(lang, lang) for lang in self.ocr_langs)
        self.reader = easyocr.Reader(self.ocr_langs, gpu=False)

    def _deskew(self, gray):
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        _, bw = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        bw = 255 - bw
        coords = np.column_stack(np.where(bw > 0))
        if coords.size == 0:
            return gray

        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle

        if abs(angle) < 0.5:
            return gray

        height, width = gray.shape[:2]
        center = (width // 2, height // 2)
        matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(gray, matrix, (width, height), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    def preprocess_image(self, image_path):
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError("Could not read image")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = self._deskew(gray)

        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        contrast = clahe.apply(gray)

        denoised = cv2.fastNlMeansDenoising(contrast, None, 10, 7, 21)
        thresh = cv2.adaptiveThreshold(
            denoised,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11,
            2,
        )

        return Image.fromarray(thresh), thresh, img

    def detect_answer_zones(self, image_np, num_questions):
        """
        Split the page using low-ink horizontal bands, falling back to equal splits.
        """
        if num_questions <= 0:
            return []

        if len(image_np.shape) == 3:
            gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
        else:
            gray = image_np

        height, width = gray.shape[:2]
        ink = gray < 128
        row_sums = ink.sum(axis=1)
        min_ink = max(1, int(width * 0.01))

        content_rows = np.where(row_sums > min_ink)[0]
        if content_rows.size == 0:
            return [gray]

        top = max(0, content_rows[0] - 5)
        bottom = min(height, content_rows[-1] + 6)

        row_sums = row_sums[top:bottom]
        height = bottom - top

        low_ink = row_sums <= min_ink
        bands = []
        start = None
        for idx, is_low in enumerate(low_ink):
            if is_low and start is None:
                start = idx
            elif not is_low and start is not None:
                bands.append((start, idx - 1))
                start = None
        if start is not None:
            bands.append((start, len(low_ink) - 1))

        band_centers = [int((a + b) / 2) for a, b in bands if (b - a) >= 6]
        target_positions = [int((i + 1) * height / num_questions) for i in range(num_questions - 1)]

        splits = []
        for target in target_positions:
            if band_centers:
                nearest = min(band_centers, key=lambda c: abs(c - target))
                splits.append(nearest)
            else:
                splits.append(target)

        splits = sorted(set(splits))
        if len(splits) != num_questions - 1:
            splits = target_positions

        zones = []
        prev = 0
        for split in splits:
            zones.append(gray[top + prev:top + split, 0:width])
            prev = split
        zones.append(gray[top + prev:top + height, 0:width])
        return zones

    def extract_text(self, image_zone):
        """
        Try Tesseract first, fallback to EasyOCR.
        """
        if isinstance(image_zone, Image.Image):
            zone_array = np.array(image_zone)
        else:
            zone_array = image_zone

        try:
            text = pytesseract.image_to_string(
                Image.fromarray(zone_array),
                lang=self.tesseract_langs,
                config="--oem 1 --psm 6",
            )
            if text.strip():
                return text.strip()
        except Exception:
            pass
            
        # Fallback to EasyOCR
        try:
            results = self.reader.readtext(zone_array)
            text = " ".join([res[1] for res in results])
            return text.strip()
        except Exception as e:
            print(f"EasyOCR Error: {e}")
            return ""

    def process_copy(self, scan_path, num_questions):
        try:
            processed_pil, processed_np, _original_cv2 = self.preprocess_image(scan_path)
            zones = self.detect_answer_zones(processed_np, num_questions)
            
            results = {}
            for idx, zone in enumerate(zones):
                text = self.extract_text(zone)
                results[idx + 1] = text
                
            return results
        except Exception as e:
            print(f"OCR Pipeline Error: {e}")
            return {i+1: "" for i in range(num_questions)}
