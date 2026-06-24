from app.core.config import get_settings

from app.providers.llm.openai_provider import (
    OpenAIProvider
)

from app.providers.llm.ollama_provider import (
    OllamaProvider
)

from app.providers.llm.groq_provider import (
    GroqProvider
)

settings = get_settings()


class LLMFactory:

    @staticmethod
    def get_provider():

        settings = get_settings()



        provider = (
            settings.LLM_PROVIDER.lower()
        )
        print(f"Using LLM Provider: {provider}")

        if provider == "groq":

            return GroqProvider()

        if provider == "ollama":

            return OllamaProvider()

        if provider == "openai":

            return OpenAIProvider()

        raise ValueError(
            f"Unsupported provider: {provider}"
        )
         
