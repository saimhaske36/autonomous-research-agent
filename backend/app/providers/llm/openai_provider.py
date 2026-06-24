from openai import OpenAI

from app.core.config import get_settings

from app.providers.llm.base import (
    BaseLLMProvider
)

settings = get_settings()


class OpenAIProvider(BaseLLMProvider):

    def __init__(self):

        self.client = OpenAI(
            api_key=settings.OPENAI_API_KEY
        )

    def generate(
        self,
        prompt: str
    ) -> str:

        response = self.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return response.choices[0].message.content