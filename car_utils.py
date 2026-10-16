"""
car_utils.py - Utility functions for car brand and model extraction.

This module provides reliable parsing of vehicle listing names into distinct
car brand and model components, carefully handling multi-word brand names,
token variations, and dataset-specific artifacts.
"""

import re
from typing import Tuple


def parse_car_name(name: str) -> Tuple[str, str]:
    """
    Parse a vehicle listing name into canonical (brand, car_model) tuple.

    Rules applied:
    1. Strips leading/trailing and duplicate whitespace.
    2. Recognizes multi-word and hyphenated brands:
       - 'Land-Rover', 'Land-Rover Rover', 'Land Rover' -> canonical 'Land Rover'
         with the remaining string extracted as the car model.
       - 'Mercedes-Benz', 'Mercedes Benz' -> canonical 'Mercedes-Benz'.
       - 'OpelCorsa' -> canonical brand 'Opel', model 'Corsa ...'
    3. Cleans known dataset anomalies (e.g. 'OutLand-Roverer' -> 'Outlander').
    4. Handles uppercase brand acronyms ('BMW', 'MG').
    5. For standard single-word brands (Maruti, Hyundai, Honda, Toyota, etc.),
       the first word is the brand and the remainder is the model.

    Args:
        name: Raw car name string from dataset or user input.

    Returns:
        Tuple of (brand, car_model).
    """
    if not isinstance(name, str) or not name.strip():
        return "Unknown", "Unknown"

    # Normalize internal whitespace
    clean_name = " ".join(name.strip().split())

    # 1. Land Rover variations (e.g. 'Land-Rover Rover Discovery S 2.0 SD4')
    if re.match(r"^Land[- ]?Rover(\s+Rover)?\b", clean_name, re.IGNORECASE):
        prefix_match = re.match(r"^Land[- ]?Rover(\s+Rover)?\s*", clean_name, re.IGNORECASE)
        model = clean_name[prefix_match.end():].strip()
        return "Land Rover", model if model else "Unknown"

    # 2. OpelCorsa concatenation in dataset (e.g. 'OpelCorsa 1.6Gls')
    if re.match(r"^OpelCorsa\b", clean_name, re.IGNORECASE):
        prefix_match = re.match(r"^OpelCorsa\s*", clean_name, re.IGNORECASE)
        rest = clean_name[prefix_match.end():].strip()
        model = f"Corsa {rest}".strip() if rest else "Corsa"
        return "Opel", model

    # 3. Mercedes-Benz / Mercedes
    if re.match(r"^Mercedes[- ]?Benz\b", clean_name, re.IGNORECASE):
        prefix_match = re.match(r"^Mercedes[- ]?Benz\s*", clean_name, re.IGNORECASE)
        model = clean_name[prefix_match.end():].strip()
        return "Mercedes-Benz", model if model else "Unknown"

    # 4. General cases: split into first word and remaining string
    parts = clean_name.split(" ", 1)
    brand = parts[0].strip().title()

    # Normalize acronym casings
    if brand.upper() in ["BMW", "MG"]:
        brand = brand.upper()

    model = parts[1].strip() if len(parts) > 1 else "Unknown"

    # Fix dataset typo/artifact where Outlander became OutLand-Roverer
    if "OutLand-Roverer" in model:
        model = model.replace("OutLand-Roverer", "Outlander")

    return brand, model
