from django.db import models


class AppModel(models.Model):
    """
    A model in the application with some sane defaults.
    """

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

    def __str__(self) -> str:
        human_identity = ""
        if hasattr(self, "name"):
            human_identity = f" name={repr(self.name)}"
        elif hasattr(self, "uuid"):
            human_identity = f" uuid={repr(self.uuid.hex)}"

        class_name = self.__class__.__name__
        return f"<{class_name} pk={repr(self.pk)}{human_identity}>"
