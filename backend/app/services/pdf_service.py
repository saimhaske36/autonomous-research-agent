import os

from app.utils.pdf_generator import (
    PDFGenerator
)


class PDFService:

    REPORT_DIR = "reports"

    @classmethod
    def generate_report(
        cls,
        job_id: str,
        report_text: str
    ):

        os.makedirs(
            cls.REPORT_DIR,
            exist_ok=True
        )

        output_path = (
            f"{cls.REPORT_DIR}/{job_id}.pdf"
        )

        PDFGenerator.generate(
            report_text,
            output_path
        )

        return output_path