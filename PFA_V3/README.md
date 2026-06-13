# AutoCorrect AI

Système automatisé d'analyse et de correction de copies d'examen manuscrites, destiné aux enseignants.

## Fonctionnalités
- Upload de copies scannées
- OCR (Tesseract / EasyOCR)
- RAG pour la correction automatique avec LangChain et GPT-4o
- Tableau de bord enseignant et espace étudiant

## Lancement avec Docker Compose

1. Clonez ce dépôt.
2. Copiez `.env.example` vers `.env` et ajoutez votre clé API OpenAI.
3. Lancez les conteneurs :
   ```bash
   docker-compose up --build
   ```
4. Accédez au frontend sur `http://localhost:5173` et l'API sur `http://localhost:8000`.
