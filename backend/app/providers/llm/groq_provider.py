from groq import Groq

from app.core.config import get_settings
from app.providers.llm.base import BaseLLMProvider


class GroqProvider(BaseLLMProvider):

    def __init__(self):

        settings = get_settings()

        self.model = settings.GROQ_MODEL

        self.client = Groq(
            api_key=settings.GROQ_API_KEY
        )

    def generate(
        self,
        prompt: str
    ) -> str:

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2
        )

        return (
            response
            .choices[0]
            .message
            .content
        )