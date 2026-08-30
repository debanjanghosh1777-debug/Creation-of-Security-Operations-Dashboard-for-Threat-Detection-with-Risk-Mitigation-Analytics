import pandas as pd
from sklearn.preprocessing import LabelEncoder

def preprocess(df):

    df = df.copy()

    encoders = {}

    for col in ["Extension", "Mime_Type"]:

        le = LabelEncoder()

        df[col] = le.fit_transform(df[col])

        encoders[col] = le

    return df, encoders