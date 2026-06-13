from rest_framework import serializers
from .models import Exam, Question, AnswerKey

class AnswerKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerKey
        fields = ['id', 'reference_answer', 'keywords', 'valid_variants']

class QuestionSerializer(serializers.ModelSerializer):
    answer_key = AnswerKeySerializer(required=False)

    class Meta:
        model = Question
        fields = ['id', 'number', 'text', 'max_points', 'answer_key']

    def create(self, validated_data):
        answer_key_data = validated_data.pop('answer_key', None)
        question = Question.objects.create(**validated_data)
        if answer_key_data:
            AnswerKey.objects.create(question=question, **answer_key_data)
        return question

    def update(self, instance, validated_data):
        answer_key_data = validated_data.pop('answer_key', None)
        
        instance.number = validated_data.get('number', instance.number)
        instance.text = validated_data.get('text', instance.text)
        instance.max_points = validated_data.get('max_points', instance.max_points)
        instance.save()

        if answer_key_data:
            answer_key, created = AnswerKey.objects.get_or_create(question=instance)
            answer_key.reference_answer = answer_key_data.get('reference_answer', answer_key.reference_answer)
            answer_key.keywords = answer_key_data.get('keywords', answer_key.keywords)
            answer_key.valid_variants = answer_key_data.get('valid_variants', answer_key.valid_variants)
            answer_key.save()

        return instance

class ExamSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    teacher_name = serializers.CharField(source='teacher.username', read_only=True)

    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'subject', 'teacher', 'teacher_name', 
            'created_at', 'questions', 'subject_file', 'reference_file', 'status', 'processing_log'
        ]
        read_only_fields = ['teacher', 'subject', 'status', 'processing_log']
