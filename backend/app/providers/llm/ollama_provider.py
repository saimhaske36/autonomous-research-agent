import ollama

from app.core.config import get_settings

from app.providers.llm.base import (
    BaseLLMProvider
)

settings = get_settings()


class OllamaProvider(BaseLLMProvider):

    def generate(
        self,
        prompt: str
    ) -> str:

        response = ollama.chat(
            model=settings.OLLAMA_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return response["message"]["content"]