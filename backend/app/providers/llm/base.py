from abc import ABC
from abc import abstractmethod


class BaseLLMProvider(ABC):

    @abstractmethod
    def generate(
        self,
        prompt: str
    ) -> str:
        raise NotImplementedError