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
    _provider_logged = False

    @staticmethod
    def get_provider():

        settings = get_settings()

        provider = (
            settings.LLM_PROVIDER.lower()
        )
        if not LLMFactory._provider_logged:
            print(f"Using LLM Provider: {provider}")
            LLMFactory._provider_logged = True

        if provider == "groq":

            return GroqProvider()

        if provider == "ollama":

            return OllamaProvider()

        if provider == "openai":

            return OpenAIProvider()

        raise ValueError(
            f"Unsupported provider: {provider}"
        )
         
