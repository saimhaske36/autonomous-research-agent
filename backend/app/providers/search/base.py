from abc import ABC
from abc import abstractmethod


class BaseSearchProvider(ABC):

    @abstractmethod
    def search(
        self,
        query: str
    ):
        raise NotImplementedError