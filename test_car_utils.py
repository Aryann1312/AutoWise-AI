"""
test_car_utils.py - Unit tests for car brand and model extraction logic and dropdown mapping.
"""

import unittest
from pathlib import Path
import pandas as pd
from car_utils import parse_car_name


class TestCarUtils(unittest.TestCase):
    def test_standard_brands(self):
        brand, model = parse_car_name("Maruti Wagon R LXI Minor")
        self.assertEqual(brand, "Maruti")
        self.assertEqual(model, "Wagon R LXI Minor")

        brand, model = parse_car_name("Hyundai Creta 1.6 VTVT S")
        self.assertEqual(brand, "Hyundai")
        self.assertEqual(model, "Creta 1.6 VTVT S")

        brand, model = parse_car_name("Toyota Corolla Altis 1.8 VL CVT")
        self.assertEqual(brand, "Toyota")
        self.assertEqual(model, "Corolla Altis 1.8 VL CVT")

    def test_land_rover_variations(self):
        brand, model = parse_car_name("Land-Rover Rover Discovery Sport TD4 HSE 7S")
        self.assertEqual(brand, "Land Rover")
        self.assertEqual(model, "Discovery Sport TD4 HSE 7S")

        brand, model = parse_car_name("Land-Rover Rover Discovery S 2.0 SD4")
        self.assertEqual(brand, "Land Rover")
        self.assertEqual(model, "Discovery S 2.0 SD4")

        brand, model = parse_car_name("Land-Rover Rover Range Rover Evoque 2.2L Dynamic")
        self.assertEqual(brand, "Land Rover")
        self.assertEqual(model, "Range Rover Evoque 2.2L Dynamic")

        brand, model = parse_car_name("Land Rover Discovery Sport")
        self.assertEqual(brand, "Land Rover")
        self.assertEqual(model, "Discovery Sport")

    def test_mercedes_benz(self):
        brand, model = parse_car_name("Mercedes-Benz New C-Class 220 CDI AT")
        self.assertEqual(brand, "Mercedes-Benz")
        self.assertEqual(model, "New C-Class 220 CDI AT")

        brand, model = parse_car_name("Mercedes-Benz E-Class E 200 CGI Elegance")
        self.assertEqual(brand, "Mercedes-Benz")
        self.assertEqual(model, "E-Class E 200 CGI Elegance")

    def test_opel_corsa(self):
        brand, model = parse_car_name("OpelCorsa 1.6Gls")
        self.assertEqual(brand, "Opel")
        self.assertEqual(model, "Corsa 1.6Gls")

        brand, model = parse_car_name("OpelCorsa 1.4 GL")
        self.assertEqual(brand, "Opel")
        self.assertEqual(model, "Corsa 1.4 GL")

    def test_acronym_brands(self):
        brand, model = parse_car_name("BMW 3 Series 320d Sport Line")
        self.assertEqual(brand, "BMW")
        self.assertEqual(model, "3 Series 320d Sport Line")

        brand, model = parse_car_name("MG Hector Sharp Diesel MT BSIV")
        self.assertEqual(brand, "MG")
        self.assertEqual(model, "Hector Sharp Diesel MT BSIV")

    def test_outlander_typo_fix(self):
        brand, model = parse_car_name("Mitsubishi OutLand-Roverer 2.4")
        self.assertEqual(brand, "Mitsubishi")
        self.assertEqual(model, "Outlander 2.4")

    def test_empty_or_whitespace(self):
        self.assertEqual(parse_car_name(""), ("Unknown", "Unknown"))
        self.assertEqual(parse_car_name("   "), ("Unknown", "Unknown"))
        self.assertEqual(parse_car_name(None), ("Unknown", "Unknown"))

    def test_dataset_dropdown_mapping(self):
        csv_path = Path("used_cars.csv")
        if not csv_path.exists():
            self.skipTest("used_cars.csv not found in workspace")

        df = pd.read_csv(csv_path)
        parsed = [parse_car_name(n) for n in df["name"].dropna()]
        brands = [p[0] for p in parsed]
        models = [p[1] for p in parsed]

        # Verify no unknown brand or empty model
        self.assertNotIn("Unknown", brands)
        self.assertNotIn("", models)
        self.assertNotIn("Unknown", models)

        # Build brand -> models mapping
        brand_models = {}
        for b, m in zip(brands, models):
            brand_models.setdefault(b, set()).add(m)

        # Verify Land Rover mapping
        self.assertIn("Land Rover", brand_models)
        lr_models = brand_models["Land Rover"]
        self.assertTrue(len(lr_models) >= 5)
        for m in lr_models:
            self.assertTrue(m.startswith("Discovery") or m.startswith("Range Rover"))

        # Verify Maruti models do not contain Land Rover models
        maruti_models = brand_models.get("Maruti", set())
        self.assertTrue(len(maruti_models) > 50)
        self.assertTrue(maruti_models.isdisjoint(lr_models))


if __name__ == "__main__":
    unittest.main()
