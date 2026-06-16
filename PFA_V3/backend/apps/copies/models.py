from django.db import models
from django.conf import settings
from exams.models import Exam, Question

class StudentCopy(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('processing', 'En cours'),
        ('done', 'Terminé'),
        ('error', 'Erreur'),
    ]
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='copies')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='copies')
    scan_file = models.FileField(upload_to='copies/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    # -- NOUVELLES PROPRIÉTÉS DE CALCUL --
    @property
    def raw_total_score(self):
        # La somme brute des points gagnés par l'étudiant
        return sum(a.final_score or 0 for a in self.answers.all())
        
    @property
    def exam_total_points(self):
        return sum(q.max_points for q in self.exam.questions.all())

    @property
    def grade_out_of_20(self):
        return round(min(self.raw_total_score, 20.0), 2)

    def __str__(self):
        return f"Copy of {self.student.username} for {self.exam.title}"

class StudentAnswer(models.Model):
    copy = models.ForeignKey(StudentCopy, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='student_answers')
    raw_text = models.TextField(blank=True)
    score = models.FloatField(null=True, blank=True)
    feedback = models.TextField(null=True, blank=True)
    teacher_override_score = models.FloatField(null=True, blank=True)

    @property
    def final_score(self):
        if self.teacher_override_score is not None:
            return self.teacher_override_score
        return self.score

    def __str__(self):
        return f"Answer to {self.question} by {self.copy.student.username}"