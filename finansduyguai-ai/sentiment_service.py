from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI(title="Finansal Analiz Duygu Servisi")

sentiment_model = pipeline(
    "sentiment-analysis",
    model="savasy/bert-base-turkish-sentiment-cased",
    tokenizer="savasy/bert-base-turkish-sentiment-cased"
)


class SentimentRequest(BaseModel):
    text: str


@app.get("/")
def home():
    return {
        "message": "Duygu analizi servisi çalışıyor."
    }


@app.post("/duygu-analiz")
def duygu_analiz(request: SentimentRequest):
    text = request.text.strip() if request.text else ""

    if text == "":
        return {
            "metinDuygusu": "neutral",
            "guvenSkoru": 0.0
        }

    result = sentiment_model(text)[0]

    label = result["label"].lower()
    score = float(result["score"])

    return {
        "metinDuygusu": label,
        "guvenSkoru": score
    }