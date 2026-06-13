from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('teacher', 'Enseignant'),
        ('student', 'Étudiant'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')

    def is_teacher(self):
        return self.role == 'teacher'

    def is_student(self):
        return self.role == 'student'
