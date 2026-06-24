from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer
)

from reportlab.lib.styles import (
    getSampleStyleSheet
)


class PDFGenerator:

    @staticmethod
    def generate(
        report_text: str,
        output_path: str
    ):

        doc = SimpleDocTemplate(
            output_path
        )

        styles = (
            getSampleStyleSheet()
        )

        elements = []

        for line in report_text.split("\n"):

            if line.strip():

                elements.append(
                    Paragraph(
                        line,
                        styles["BodyText"]
                    )
                )

                elements.append(
                    Spacer(
                        1,
                        6
                    )
                )

        doc.build(
            elements
        )

        return output_path