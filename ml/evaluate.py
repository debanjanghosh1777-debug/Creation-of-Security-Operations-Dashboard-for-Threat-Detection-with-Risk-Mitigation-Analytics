from sklearn.metrics import accuracy_score
from sklearn.metrics import classification_report

def evaluate(model, X_test, y_test):

    pred = model.predict(X_test)

    print("Accuracy :", accuracy_score(y_test, pred))

    print(classification_report(y_test, pred))