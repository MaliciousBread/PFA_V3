from django.db import models
from django.conf import settings

class Exam(models.Model):
    SUBJECT_CHOICES = [
        ('cpp', 'C++'),
    ]
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES, default='cpp')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exams')
    subject_file = models.FileField(upload_to='exams/subjects/', null=True, blank=True)
    reference_file = models.FileField(upload_to='exams/references/', null=True, blank=True)
    status = models.CharField(max_length=20, default='done', choices=[
        ('pending', 'En attente'),
        ('processing', 'Traitement OCR...'),
        ('done', 'Prêt'),
        ('error', 'Erreur'),
    ])
    processing_log = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.subject})"

class Question(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='questions')
    number = models.IntegerField()
    text = models.TextField()
    max_points = models.FloatField()

    class Meta:
        ordering = ['number']

    def __str__(self):
        return f"Q{self.number} - {self.exam.title}"

class AnswerKey(models.Model):
    question = models.OneToOneField(Question, on_delete=models.CASCADE, related_name='answer_key')
    reference_answer = models.TextField()
    keywords = models.JSONField(default=list)
    valid_variants = models.JSONField(default=list, blank=True)
    embedding_vector = models.BinaryField(null=True, blank=True)

    def __str__(self):
        return f"Key for {self.question}"
