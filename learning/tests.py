import pytest
from unittest.mock import patch, MagicMock
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from vault.models import Document
from learning.models import TopicMastery, TopicSource, ReviewSession, ReviewItem
from learning.generation import validate_question, extract_topics_from_text, generate_review_questions_batch


# 1. extract_topics flag boundary
@pytest.mark.django_db
def test_extract_topics_flag_respected():
    user = User.objects.create_user(username='tester')
    doc_true = Document.objects.create(user=user, title='Test Doc 1', extract_topics=True)
    doc_false = Document.objects.create(user=user, title='Test Doc 2', extract_topics=False)
    
    assert doc_true.extract_topics is True
    assert doc_false.extract_topics is False


# 2. Output Validation (BUG-2)
def test_validate_question_graceful_rejection():
    # Valid
    valid_q = {
        "topic_index": 1,
        "question": "What is X?",
        "options": {"A": "1", "B": "2", "C": "3", "D": "4"},
        "correct_answer": "A",
        "explanation": "Because."
    }
    assert validate_question(valid_q) is True
    
    # Missing key
    missing_q = dict(valid_q)
    del missing_q['explanation']
    assert validate_question(missing_q) is False
    
    # Invalid correct_answer
    invalid_ans = dict(valid_q)
    invalid_ans['correct_answer'] = "Option A"
    assert validate_question(invalid_ans) is False
    
    # Non-dict options
    invalid_opts = dict(valid_q)
    invalid_opts['options'] = ["1", "2"]
    assert validate_question(invalid_opts) is False


# 3. Source Deletion Data Consistency (BUG-4)
@pytest.mark.django_db
def test_document_deletion_preserves_review_history():
    user = User.objects.create_user(username='tester2')
    doc = Document.objects.create(user=user, title='Target Doc')
    
    mastery = TopicMastery.objects.create(
        user=user, 
        topic_name='Test Concept',
        next_review_date=timezone.now().date()
    )
    
    ctype = ContentType.objects.get_for_model(Document)
    TopicSource.objects.create(topic=mastery, content_type=ctype, object_id=doc.id)
    
    session = ReviewSession.objects.create(user=user, total_items=1)
    
    item = ReviewItem.objects.create(
        session=session,
        mastery=mastery,
        question_text='Q?',
        options={"A": "1", "B": "2", "C": "3", "D": "4"},
        correct_answer='A',
        explanation='Exp',
        difficulty_level=1,
        review_context='Ctx'
    )
    
    # Simulate document deletion which triggers cascade to TopicSource, which deletes TopicMastery
    doc.delete()
    
    # TopicMastery should be deleted due to orphan cleanup signal
    assert not TopicMastery.objects.filter(id=mastery.id).exists()
    
    # But the ReviewItem MUST remain to preserve session history!
    item.refresh_from_db()
    assert item.id is not None
    assert item.mastery is None  # SET_NULL worked
    
    session.refresh_from_db()
    assert session.items.count() == 1


# 4. Prompt Generation Source-First
@pytest.mark.django_db
@patch('google.generativeai.GenerativeModel.generate_content')
def test_generate_review_questions_batch_prompt(mock_generate):
    mock_response = MagicMock()
    mock_response.text = "[]"
    mock_generate.return_value = mock_response

    topics_data = [{
        "topic_name": "Test Topic",
        "context": "Context chunk text from RAG.",
        "difficulty": 2,
    }]
    
    generate_review_questions_batch(topics_data)
    
    called_prompt = mock_generate.call_args[0][0]
    
    # Check that source-first strategy is communicated
    assert "primarily base your question on that material" in called_prompt
    assert "Context chunk text from RAG." in called_prompt
    assert "NEVER invent facts" in called_prompt
