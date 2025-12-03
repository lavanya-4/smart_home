import json

model = None

def load_keras_model():
    # ...existing code to load the model...
    pass

def lambda_handler(event, context):
    print(json.dumps(event))
    global model
    if model is None:
        model = load_keras_model()
    # ...existing code for the handler...