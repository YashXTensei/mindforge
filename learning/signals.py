from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import TopicSource, TopicMastery

@receiver(post_delete, sender=TopicSource)
def delete_orphaned_topics(sender, instance, **kwargs):
    """
    When a TopicSource is deleted (e.g. because the parent PDF is deleted),
    check if the associated TopicMastery has any other sources left.
    If it has 0 sources, delete the TopicMastery so it doesn't become a ghost node.
    """
    try:
        topic = TopicMastery.objects.get(pk=instance.topic_id)
        if not topic.sources.exists():
            topic.delete()
    except TopicMastery.DoesNotExist:
        # Topic was already deleted (e.g. by Django's cascade), nothing to do
        pass
