import pandas as pd
import joblib

from xgboost import XGBClassifier

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from preprocess import preprocess
from evaluate import evaluate

df = pd.read_csv("dataset.csv")

X = df.drop("Threat", axis=1)
y = df["Threat"]

X, encoders = preprocess(X)

label_encoder = LabelEncoder()

y = label_encoder.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

model = XGBClassifier(
    n_estimators=300,
    max_depth=8,
    learning_rate=0.05,
    random_state=42
)

model.fit(X_train, y_train)

evaluate(model, X_test, y_test)

joblib.dump(model, "threat_model.pkl")
joblib.dump(encoders, "encoders.pkl")
joblib.dump(label_encoder, "label_encoder.pkl")

print("Training Completed")