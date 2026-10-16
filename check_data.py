import pandas as pd

# Load the dataset
df = pd.read_csv("used_cars.csv")

# Display the first five rows
print("First five rows:")
print(df.head())

# Display column names
print("\nColumn names:")
print(df.columns.tolist())

# Display dataset size
print("\nDataset shape:")
print(df.shape)

# Check missing values
print("\nMissing values:")
print(df.isnull().sum())

# Display basic statistics
print("\nDataset statistics:")
print(df.describe())