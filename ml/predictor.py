import pandas as pd
import joblib


class ThreatPredictor:

    def __init__(self):

        self.model = joblib.load("ml/threat_model.pkl")
        self.encoders = joblib.load("ml/encoders.pkl")
        self.label_encoder = joblib.load("ml/label_encoder.pkl")

    def predict(self, features):

        df = pd.DataFrame([features])

        # Encode Extension
        ext_encoder = self.encoders["Extension"]
        if df.loc[0, "Extension"] in ext_encoder.classes_:
            df["Extension"] = ext_encoder.transform(df["Extension"])
        else:
            df["Extension"] = 0

        # Encode Mime Type
        mime_encoder = self.encoders["Mime_Type"]
        if df.loc[0, "Mime_Type"] in mime_encoder.classes_:
            df["Mime_Type"] = mime_encoder.transform(df["Mime_Type"])
        else:
            df["Mime_Type"] = 0

        # Predict
        prediction = self.model.predict(df)[0]
        probs = self.model.predict_proba(df)[0]

        print("Probabilities:", probs)

        prediction = self.model.predict(df)[0]
        confidence = probs.max()

        prediction = self.label_encoder.inverse_transform([prediction])[0]
        confidence = round(confidence * 100, 2)

        # Risk Level
        if prediction == "Malware":
            risk = "High"
            recommendation = "Delete the file immediately. Do not execute it."

        elif prediction == "Suspicious":
            risk = "Medium"
            recommendation = "Scan the file with antivirus before opening."

        else:
            risk = "Low"
            recommendation = "File appears safe."
        print("Prediction:", prediction)
        print("Confidence:", confidence)
        return {
            "prediction": prediction,
            "confidence": confidence,
            "risk_level": risk,
            "recommendation": recommendation
        }