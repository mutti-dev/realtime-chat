from django.urls import path

from . import consumers

websocket_urlpatterns = [
	path('groupchat/', consumers.GroupChatConsumer.as_asgi())
]