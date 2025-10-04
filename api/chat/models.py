from django.contrib.auth.models import AbstractUser
from django.db import models


def upload_thumbnail(instance, filename):
	path = f'thumbnails/{instance.username}'
	extension = filename.split('.')[-1]
	if extension:
		path = path + '.' + extension
	return path


class User(AbstractUser):
	thumbnail = models.CharField(max_length=500, blank=True, null=True)
	is_online = models.BooleanField(default=False)
	last_online = models.DateTimeField(null=True, blank=True)
	is_admin = models.BooleanField(default=False)

	theme = models.CharField(max_length=10, choices=(('light','Light'),('dark','Dark')), null=True, blank=True)
	notifications_enabled = models.BooleanField(default=True)

	settings = models.JSONField(null=True, blank=True)


class Connection(models.Model):
	sender = models.ForeignKey(
		User,
		related_name='sent_connections',
		on_delete=models.CASCADE
	)
	receiver = models.ForeignKey(
		User,
		related_name='received_connections',
		on_delete=models.CASCADE
	)
	accepted = models.BooleanField(default=False)
	updated = models.DateTimeField(auto_now=True)
	created = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.sender.username + ' -> ' + self.receiver.username



class Message(models.Model):
    connection = models.ForeignKey(
        Connection,
        related_name="messages",
        on_delete=models.CASCADE,
    )
    user = models.ForeignKey(
        User,
        related_name="my_messages",
        on_delete=models.CASCADE,
    )
    text = models.TextField(blank=True, default="")
    created = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to="messages/files/", blank=True, null=True)
    presigned_file_url = models.CharField(max_length=100, blank=True, null=True) 
    file_key = models.CharField(max_length=500, blank=True, null=True)   
    mime_type = models.CharField(max_length=100, blank=True, null=True)  
    size = models.PositiveIntegerField(blank=True, null=True)            
    status = models.CharField(                                         
        max_length=20,
        choices=(
            ("sent", "Sent"),
            ("delivered", "Delivered"),
            ("read", "Read"),
        ),
        default="sent",
    )
    is_ai = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username}: {self.text[:30]}"




	

class AiMessage(models.Model):
	
	user = models.ForeignKey(
		User,
		related_name='ai_messages',
		on_delete=models.CASCADE
	)
	user_query = models.TextField()
	ai_res = models.TextField()
	created = models.DateTimeField(auto_now_add=True)
	rating = models.TextField(blank=True)


	

	def __str__(self):
		return self.user.username + ': ' + self.user_query



